const router  = require("express").Router();
const https   = require("https");
const fs      = require("fs");
const FormData = require("form-data");
const multer  = require("multer");
const path    = require("path");
const { query } = require("../db");

const upload = multer({
  dest: path.join(__dirname, "../uploads/"),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only images allowed"));
  },
});

/* ── GET /donations/top — top 5 public ── */
router.get("/top", async (_req, res) => {
  const { rows } = await query(
    `select display_name, amount, created_at
     from donations where status='approved'
     order by amount desc, created_at asc
     limit 5`
  );
  res.json(rows);
});

/* ── POST /donations/slip — upload slip ── */
router.post("/slip", upload.single("slip"), async (req, res) => {
  const { display_name, amount, user_id, payer_name, payer_bank } = req.body;
  const file = req.file;

  if (!file)         return res.status(400).json({ error: "กรุณาแนบสลิป" });
  if (!display_name) return res.status(400).json({ error: "กรุณาใส่ชื่อ" });
  if (!amount)       return res.status(400).json({ error: "กรุณาใส่จำนวนเงิน" });

  try {
    const { rows } = await query(
      `insert into donations (display_name, user_id, amount, slip_path, payer_name, payer_bank, status)
       values ($1, $2, $3, $4, $5, $6, 'pending') returning id`,
      [display_name, user_id || null, Number(amount), file.path, payer_name || null, payer_bank || null]
    );
    const donationId = rows[0].id;

    await sendSlipToTelegram({ donationId, display_name, amount, payerName: payer_name, payerBank: payer_bank, filePath: file.path });

    res.json({ success: true, donationId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* อนุมัติ donation ด้วยยอดที่กำหนด — ใช้ร่วมกันจาก Telegram callback และ LINE auto-approve */
async function approveDonationById(id, amount, { via = "manual" } = {}) {
  const { rows } = await query(
    "select * from donations where id=$1 and status in ('pending','pending_amount')", [id]
  );
  if (!rows[0]) return null;

  await query(
    "update donations set status='approved', amount=$1, approved_at=now() where id=$2",
    [amount, id]
  );

  const { sendTelegramMessage } = require("./payments");
  const tag = via === "line-bot" ? "🤖 Auto-approved (LINE)" : "✅ Approved";
  await sendTelegramMessage(`${tag} — Donation #${id}\n👤 ${rows[0].display_name}\n💰 ฿${Number(amount).toLocaleString()}`);

  return { ...rows[0], amount };
}

/* ── Telegram ── */
async function sendSlipToTelegram({ donationId, display_name, amount, payerName, payerBank, filePath }) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  const caption =
    `🩷 Donation #${donationId}\n` +
    `👤 ชื่อ: ${display_name}\n` +
    `💰 ยอด: ${Number(amount).toLocaleString()} บาท\n` +
    (payerName ? `🏦 ผู้โอน: ${payerName}${payerBank ? ` (${payerBank})` : ""}\n` : "") +
    `🕐 เวลา: ${new Date().toLocaleString("th-TH")}`;

  const replyMarkup = JSON.stringify({
    inline_keyboard: [[
      { text: "✅ Approve", callback_data: `donate_approve_${donationId}` },
      { text: "❌ Reject",  callback_data: `donate_reject_${donationId}`  },
    ]],
  });

  const form = new FormData();
  form.append("chat_id", chatId);
  form.append("caption", caption);
  form.append("reply_markup", replyMarkup);
  form.append("photo", fs.createReadStream(filePath));

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${token}/sendPhoto`,
      method: "POST",
      headers: form.getHeaders(),
    }, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { console.log("[Donate Telegram]", d); resolve(d); });
    });
    req.on("error", reject);
    form.pipe(req);
  });
}

module.exports = router;
module.exports.approveDonationById = approveDonationById;
