const router = require("express").Router();
const { query } = require("../db");
const { approvePaymentRequestById, sendTelegramMessage } = require("./payments");
const { approveDonationById } = require("./donations");

/* ตัดคำนำหน้าไทย/อังกฤษ + ช่องว่างส่วนเกิน เพื่อเทียบชื่อผู้โอนแบบหลวมๆ */
function normalizeName(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/^(นาย|นาง|นางสาว|น\.ส\.|mr\.?|mrs\.?|ms\.?)\s*/i, "")
    .replace(/\s+/g, "")
    .trim();
}

function namesMatch(a, b) {
  const na = normalizeName(a);
  const nb = normalizeName(b);
  if (!na || !nb) return false;
  return na.includes(nb) || nb.includes(na);
}

/* POST /auto-approve — เรียกจาก LINE bot เมื่อจับยอดเงินเข้าได้จากข้อความแจ้งเตือนธนาคาร */
router.post("/", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { amount, payerName, bank, rawMessage } = req.body;
  const numAmount = Number(amount);
  if (!numAmount || numAmount <= 0)
    return res.status(400).json({ error: "amount ไม่ถูกต้อง" });

  try {
    const [{ rows: payments }, { rows: donations }] = await Promise.all([
      query("select id, payer_name from payment_requests where status='pending' and amount=$1", [numAmount]),
      query("select id, payer_name from donations where status in ('pending','pending_amount') and amount=$1", [numAmount]),
    ]);

    let candidates = [
      ...payments.map(r => ({ type: "payment", id: r.id, payer_name: r.payer_name })),
      ...donations.map(r => ({ type: "donation", id: r.id, payer_name: r.payer_name })),
    ];

    /* ถ้ามีชื่อผู้โอนจากข้อความ ให้กรองด้วยชื่อก่อน ถ้าเหลือพอดี 1 รายการค่อยใช้ผลกรอง */
    if (payerName && candidates.length > 1) {
      const filtered = candidates.filter(c => namesMatch(c.payer_name, payerName));
      if (filtered.length >= 1) candidates = filtered;
    }

    if (candidates.length === 1) {
      const match = candidates[0];
      const approved = match.type === "payment"
        ? await approvePaymentRequestById(match.id, { via: "line-bot" })
        : await approveDonationById(match.id, numAmount, { via: "line-bot" });

      if (!approved) {
        return res.json({ matched: false, reason: "already-processed" });
      }
      return res.json({ matched: true, type: match.type, id: match.id });
    }

    /* จับคู่ไม่ชัด (ไม่เจอ หรือเจอหลายรายการ) — แจ้งเตือนให้ admin ตรวจสอบเอง ไม่ auto-approve */
    const reason = candidates.length === 0 ? "no-match" : "ambiguous";
    await sendTelegramMessage(
      `⚠️ LINE bot จับยอดเงินเข้า ฿${numAmount.toLocaleString()}${payerName ? ` จาก ${payerName}` : ""}${bank ? ` (${bank})` : ""} แต่${reason === "no-match" ? "ไม่พบ" : "พบหลาย"}รายการที่ pending อยู่ตรงกัน\n` +
      (candidates.length ? `ตัวเลือก: ${candidates.map(c => `${c.type}#${c.id}`).join(", ")}\n` : "") +
      `กรุณาตรวจสอบและ approve ด้วยตนเอง` +
      (rawMessage ? `\n\nข้อความต้นฉบับ: ${rawMessage}` : "")
    );

    res.json({ matched: false, reason, candidates: candidates.length });
  } catch (err) {
    console.error("[auto-approve]", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
