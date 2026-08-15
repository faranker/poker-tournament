const router     = require("express").Router();
const requireAuth = require("../middleware/auth");
const { query }  = require("../db");
const fs         = require("fs");
const path       = require("path");
const https      = require("https");
const FormData   = require("form-data");

const PLAN_NAMES = { cash_pro: "Cash Pro", full_pro: "Full Pro" };
const PLAN_MONTHS = { monthly: 1, yearly: 12 };

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

/* POST /payments/slip — รับสลิป + ส่ง Telegram */
router.post("/slip", requireAuth, upload.single("slip"), async (req, res) => {
  const { plan, billing_cycle, amount } = req.body;
  const file = req.file;

  if (!file) return res.status(400).json({ error: "กรุณาแนบสลิป" });
  if (!plan || !amount) return res.status(400).json({ error: "ข้อมูลไม่ครบ" });

  try {
    /* บันทึก payment request ลง DB */
    const { rows } = await query(
      `insert into payment_requests (user_id, plan, billing_cycle, amount, slip_path, status)
       values ($1, $2, $3, $4, $5, 'pending') returning id`,
      [req.user.id, plan, billing_cycle || "monthly", amount, file.path]
    );
    const requestId = rows[0].id;

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
    const months = PLAN_MONTHS[pr.billing_cycle] || 1;
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + months);

    /* อัปเดต plan */
    await query(
      `insert into subscriptions (user_id, plan, expires_at)
       values ($1, $2, $3)
       on conflict (user_id) do update set plan=$2, expires_at=$3, updated_at=now()`,
      [pr.user_id, pr.plan, expiresAt]
    );

    /* อัปเดต status */
    await query(
      "update payment_requests set status='approved', approved_at=now() where id=$1",
      [id]
    );

    /* แจ้ง Telegram ว่า approve แล้ว */
    await sendTelegramMessage(`✅ Approved #${id}\nPlan: ${PLAN_NAMES[pr.plan]}\nExpires: ${expiresAt.toLocaleDateString("th-TH")}`);

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

async function sendSlipToTelegram({ requestId, userId, username, email, plan, billingCycle, amount, filePath }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const caption =
    `💳 <b>Payment Request #${requestId}</b>\n` +
    `👤 User: <b>${username}</b> (${email})\n` +
    `📦 Plan: <b>${plan}</b> · ${billingCycle}\n` +
    `💰 ยอด: <b>${Number(amount).toLocaleString()} บาท</b>\n` +
    `🕐 เวลา: ${new Date().toLocaleString("th-TH")}\n\n` +
    `✅ Approve: POST /payments/approve/${requestId}\n` +
    `❌ Reject:  POST /payments/reject/${requestId}`;

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("parse_mode", "HTML");
  form.append("photo", fs.createReadStream(filePath));

  await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    body: form,
  });
}

module.exports = router;
