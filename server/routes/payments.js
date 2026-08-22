const router     = require("express").Router();
const requireAuth = require("../middleware/auth");
const { query }  = require("../db");
const fs         = require("fs");
const path       = require("path");
const https      = require("https");
const FormData   = require("form-data");
const { approvePaymentRequest, PLAN_NAMES } = require("../services/paymentApproval");

/* Server-side plan pricing — mirrors src/components/PaymentModal.tsx's
   PLAN_PRICES. Amount for /payments/initiate is always computed from here,
   never trusted from the client, since it's now a hard match key against
   real SCB deposits. */
const PLAN_PRICES = {
  cash_pro: { monthly: 49, yearly: 299 },
  full_pro: { monthly: 99, yearly: 499 },
};

/* Short bank codes this app can match against — mirrors line-forwarder-app's
   parser_scb.py THAI_BANK_NAME_MAP / parser_gsb.py BANK_CODES vocabulary,
   which is what actually lands in a detected deposit's `from_bank` field. */
const KNOWN_BANK_CODES = ["SCB", "KTB", "GSB", "KBANK", "BAY", "BBL", "TTB", "UOB", "CIMB"];

const PAYMENT_WINDOW_MINUTES = parseInt(process.env.PAYMENT_WINDOW_MINUTES || "10", 10);

/* SCB's own LINE notification always masks the sender's account number to
   the last 4 digits (e.g. "X-7667") — confirmed against a real deposit
   message, 2026-08-23. The payer still types their FULL account number
   into the payment form (expected_from_account_number), so an exact-match
   comparison against SCB's masked value could never succeed — match on
   the last 4 digits instead, which works whether either side happens to
   be a full number or already masked. */
function last4Digits(accountNumber) {
  const digitsOnly = String(accountNumber || "").replace(/\D/g, "");
  return digitsOnly.slice(-4);
}

/* ── Simple file upload parser (no multer needed) ── */
const multer = require("multer");
const upload = multer({
  dest: path.join(__dirname, "../uploads/"),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

/* POST /payments/initiate — สร้างรายการรอโอนเงิน (ก่อนแสดง QR) */
router.post("/initiate", requireAuth, async (req, res) => {
  const { plan, billing_cycle, expected_from_account_number, expected_from_bank } = req.body;
  const cycle = billing_cycle === "yearly" ? "yearly" : "monthly";

  const prices = PLAN_PRICES[plan];
  if (!prices) return res.status(400).json({ error: "แผนไม่ถูกต้อง" });
  if (!expected_from_account_number || !String(expected_from_account_number).trim())
    return res.status(400).json({ error: "กรุณากรอกเลขบัญชีต้นทาง" });
  if (!KNOWN_BANK_CODES.includes(expected_from_bank))
    return res.status(400).json({ error: "กรุณาเลือกธนาคารต้นทาง" });

  const amount = prices[cycle];
  const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

  try {
    const { rows } = await query(
      `insert into payment_requests
         (user_id, plan, billing_cycle, amount, status,
          expected_from_account_number, expected_from_bank, payment_window_expires_at)
       values ($1, $2, $3, $4, 'awaiting_transfer', $5, $6, $7)
       returning id`,
      [req.user.id, plan, cycle, amount, String(expected_from_account_number).trim(), expected_from_bank, expiresAt]
    );
    res.json({ id: rows[0].id, amount, expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* GET /payments/status/:id — poll ระหว่างรอ QR */
router.get("/status/:id", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "select id, status, plan, amount, payment_window_expires_at from payment_requests where id=$1 and user_id=$2",
      [req.params.id, req.user.id]
    );
    const pr = rows[0];
    if (!pr) return res.status(404).json({ error: "ไม่พบรายการ" });

    if (pr.status === "awaiting_transfer" && new Date(pr.payment_window_expires_at) < new Date()) {
      await query("update payment_requests set status='expired' where id=$1 and status='awaiting_transfer'", [pr.id]);
      pr.status = "expired";
    }
    res.json({ status: pr.status, plan: pr.plan, amount: pr.amount, expires_at: pr.payment_window_expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /payments/scb-deposit — webhook จาก line-forwarder-app เมื่อพบเงินเข้า SCB */
router.post("/scb-deposit", async (req, res) => {
  const secret = req.headers["x-webhook-secret"];
  if (!process.env.SCB_WEBHOOK_SECRET || secret !== process.env.SCB_WEBHOOK_SECRET)
    return res.status(403).json({ error: "Forbidden" });

  const { transaction_key, amount, from_bank, from_account_number, transaction_time } = req.body;
  if (!transaction_key || amount == null || !from_bank || !from_account_number)
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  try {
    const { rows: matches } = await query(
      `select * from payment_requests
        where status='awaiting_transfer'
          and payment_window_expires_at > now()
          and right(regexp_replace(expected_from_account_number, '\\D', '', 'g'), 4) = $1
          and expected_from_bank = $2
          and amount = $3`,
      [last4Digits(from_account_number), from_bank, amount]
    );

    if (matches.length === 0) {
      console.log(`[scb-deposit] no pending match for ฿${amount} from ${from_bank} ${from_account_number}`);
      return res.json({ matched: false });
    }
    if (matches.length > 1) {
      console.warn(`[scb-deposit] ambiguous — ${matches.length} pending requests match ฿${amount} from ${from_bank} ${from_account_number}`);
      await sendTelegramMessage(
        `⚠️ พบเงินเข้า SCB ฿${amount} จาก ${from_bank} ${from_account_number} แต่ตรงกับหลาย request — กรุณาตรวจสอบด้วยตนเอง`
      );
      return res.json({ matched: false, ambiguous: true });
    }

    const pr = matches[0];
    let result;
    try {
      result = await approvePaymentRequest(pr, { matchedTransactionKey: transaction_key });
    } catch (err) {
      if (err.code === "23505") {
        // matched_transaction_key unique conflict — this deposit was already processed
        console.log(`[scb-deposit] duplicate delivery for transaction_key=${transaction_key}`);
        return res.json({ matched: false, duplicate: true });
      }
      throw err;
    }

    await sendTelegramMessage(
      `✅ Auto-approved via SCB deposit — request #${pr.id}\n` +
      `📦 Plan: ${result.planName}\n` +
      `💰 ยอด: ${Number(pr.amount).toLocaleString()} บาท\n` +
      `🕐 เวลาโอน: ${transaction_time || "-"}`
    );
    res.json({ matched: true, payment_request_id: pr.id });
  } catch (err) {
    console.error("[scb-deposit]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /payments/slip — แนบสลิป (fallback หมดเวลา/manual) + ส่ง Telegram */
router.post("/slip", requireAuth, upload.single("slip"), async (req, res) => {
  const { payment_request_id } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "กรุณาแนบสลิป" });
  if (!payment_request_id) return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  try {
    const { rows: prRows } = await query(
      "select * from payment_requests where id=$1 and user_id=$2 and status in ('awaiting_transfer','expired')",
      [payment_request_id, req.user.id]
    );
    const existing = prRows[0];
    if (!existing) return res.status(404).json({ error: "ไม่พบรายการ หรือดำเนินการแล้ว" });

    await query(
      "update payment_requests set slip_path=$1, status='pending' where id=$2",
      [file.path, existing.id]
    );
    const requestId = existing.id;
    const plan = existing.plan;
    const billing_cycle = existing.billing_cycle;
    const amount = existing.amount;

    /* ดึงข้อมูล user */
    const { rows: users } = await query(
      "select email, username from users where id = $1",
      [req.user.id]
    );
    const user = users[0];

    /* ส่งไป Telegram */
    await sendSlipToTelegram({
      requestId,
      userId: req.user.id,
      username: user?.username || "-",
      email: user?.email || "-",
      plan: PLAN_NAMES[plan] || plan,
      billingCycle: billing_cycle === "yearly" ? "รายปี" : "รายเดือน",
      amount,
      filePath: file.path,
    });

    res.json({ success: true, requestId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /payments/approve/:id — Approve จาก Telegram callback */
router.post("/approve/:id", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  try {
    const { rows } = await query(
      "select * from payment_requests where id = $1 and status = 'pending'",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบ request นี้" });

    const pr = rows[0];
    const { expiresAt, planName } = await approvePaymentRequest(pr);

    /* แจ้ง Telegram ว่า approve แล้ว */
    await sendTelegramMessage(`✅ Approved #${id}\nPlan: ${planName}\nExpires: ${expiresAt.toLocaleDateString("th-TH")}`);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /payments/reject/:id */
router.post("/reject/:id", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  try {
    await query(
      "update payment_requests set status='rejected' where id=$1 and status='pending'",
      [id]
    );
    await sendTelegramMessage(`❌ Rejected #${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* ── Telegram helpers ── */
async function sendTelegramMessage(text) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function sendSlipToTelegram({ requestId, username, email, plan, billingCycle, amount, filePath }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const caption =
    `💳 Payment Request #${requestId}\n` +
    `👤 User: ${username} (${email})\n` +
    `📦 Plan: ${plan} · ${billingCycle}\n` +
    `💰 ยอด: ${Number(amount).toLocaleString()} บาท\n` +
    `🕐 เวลา: ${new Date().toLocaleString("th-TH")}`;

  const replyMarkup = JSON.stringify({
    inline_keyboard: [[
      { text: "✅ Approve", callback_data: `approve_${requestId}` },
      { text: "❌ Reject",  callback_data: `reject_${requestId}`  },
    ]],
  });

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("reply_markup", replyMarkup);
  form.append("photo", fs.createReadStream(filePath));

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.telegram.org",
      path: `/bot${token}/sendPhoto`,
      method: "POST",
      headers: form.getHeaders(),
    };
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => { console.log("[Telegram sendPhoto]", data); resolve(data); });
    });
    req.on("error", (e) => { console.error("[Telegram error]", e); reject(e); });
    form.pipe(req);
  });
}

module.exports = router;
