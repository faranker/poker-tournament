const router = require("express").Router();
const { query } = require("../db");

// Mirrors server/routes/payments.js's own copy — see that file's comment
// for why last-4-digit matching is needed (SCB masks sender account
// numbers in its own LINE notification, so exact-match never succeeds).
const KNOWN_BANK_CODES = ["SCB", "KTB", "GSB", "KBANK", "BAY", "BBL", "TTB", "UOB", "CIMB"];
const PAYMENT_WINDOW_MINUTES = parseInt(process.env.PAYMENT_WINDOW_MINUTES || "10", 10);

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

/* POST /donations/initiate — สร้างรายการรอโอนเงิน (ก่อนแสดง QR) */
router.post("/initiate", async (req, res) => {
  const { display_name, amount, expected_from_bank, expected_from_account_number, user_id } = req.body;

  if (!display_name || !String(display_name).trim())
    return res.status(400).json({ error: "กรุณาใส่ชื่อที่แสดง" });
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0)
    return res.status(400).json({ error: "กรุณาใส่จำนวนเงินให้ถูกต้อง" });
  if (!expected_from_account_number || !String(expected_from_account_number).trim())
    return res.status(400).json({ error: "กรุณากรอกเลขบัญชีต้นทาง" });
  if (!KNOWN_BANK_CODES.includes(expected_from_bank))
    return res.status(400).json({ error: "กรุณาเลือกธนาคารต้นทาง" });

  const expiresAt = new Date(Date.now() + PAYMENT_WINDOW_MINUTES * 60 * 1000);

  try {
    const { rows } = await query(
      `insert into donations
         (display_name, user_id, amount, status,
          expected_from_account_number, expected_from_bank, payment_window_expires_at)
       values ($1, $2, $3, 'awaiting_transfer', $4, $5, $6)
       returning id`,
      [
        String(display_name).trim(), user_id || null, numAmount,
        String(expected_from_account_number).trim(), expected_from_bank, expiresAt,
      ]
    );
    res.json({ id: rows[0].id, amount: numAmount, expires_at: expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* GET /donations/status/:id — poll ระหว่างรอ QR (public — donations can be anonymous) */
router.get("/status/:id", async (req, res) => {
  try {
    const { rows } = await query(
      "select id, status, amount, payment_window_expires_at from donations where id=$1",
      [req.params.id]
    );
    const d = rows[0];
    if (!d) return res.status(404).json({ error: "ไม่พบรายการ" });

    if (d.status === "awaiting_transfer" && new Date(d.payment_window_expires_at) < new Date()) {
      await query("update donations set status='expired' where id=$1 and status='awaiting_transfer'", [d.id]);
      d.status = "expired";
    }
    res.json({ status: d.status, amount: d.amount, expires_at: d.payment_window_expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /donations/approve/:id — ใช้โดย BO panel เท่านั้น (admin-key) */
router.post("/approve/:id", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  try {
    const { rows } = await query(
      "update donations set status='approved', approved_at=now() where id=$1 and status in ('awaiting_transfer','pending','pending_amount','expired') returning id",
      [id]
    );
    if (!rows[0]) return res.status(404).json({ error: "ไม่พบรายการนี้ หรือดำเนินการแล้ว" });
    await sendTelegramMessage(`✅ Approved donation #${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /donations/reject/:id */
router.post("/reject/:id", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { id } = req.params;
  try {
    await query(
      "update donations set status='rejected' where id=$1 and status in ('awaiting_transfer','pending','pending_amount','expired')",
      [id]
    );
    await sendTelegramMessage(`❌ Rejected donation #${id}`);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* ── Telegram ── */
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

module.exports = router;
