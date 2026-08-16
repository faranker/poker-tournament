const router  = require("express").Router();
const https   = require("https");
const { query } = require("../db");

const PLAN_NAMES  = { cash_pro: "Cash Pro", full_pro: "Full Pro" };
const PLAN_MONTHS = { monthly: 1, yearly: 12 };

/* ── POST /telegram/webhook  (Telegram → server) ── */
router.post("/webhook", async (req, res) => {
  res.sendStatus(200); // ตอบ Telegram ก่อนเสมอ

  const cb = req.body?.callback_query;
  if (!cb) return;

  const callbackId = cb.id;
  const data       = cb.data || "";          // "approve_4" | "reject_4"
  const [action, idStr] = data.split("_");
  const id = parseInt(idStr, 10);

  if (!id || !["approve","reject"].includes(action)) {
    await answerCallback(callbackId, "❓ ไม่รู้จัก action นี้");
    return;
  }

  try {
    const { rows } = await query(
      "select * from payment_requests where id=$1 and status='pending'", [id]
    );
    if (!rows[0]) {
      await answerCallback(callbackId, "⚠️ ไม่พบ request หรือดำเนินการแล้ว");
      return;
    }
    const pr = rows[0];

    if (action === "approve") {
      const months = PLAN_MONTHS[pr.billing_cycle] || 1;

      /* extend from existing expires_at if still active, else from now */
      const { rows: subRows } = await query(
        "select expires_at from subscriptions where user_id=$1", [pr.user_id]
      );
      const existing = subRows[0]?.expires_at;
      const base = existing && new Date(existing) > new Date() ? new Date(existing) : new Date();
      const expiresAt = new Date(base);
      expiresAt.setMonth(expiresAt.getMonth() + months);

      await query(
        `insert into subscriptions (user_id, plan, expires_at)
         values ($1,$2,$3)
         on conflict (user_id) do update set plan=$2, expires_at=$3, updated_at=now()`,
        [pr.user_id, pr.plan, expiresAt]
      );
      await query(
        "update payment_requests set status='approved', approved_at=now() where id=$1", [id]
      );

      const { rows: uRows } = await query("select username, email from users where id=$1", [pr.user_id]);
      const u = uRows[0] || {};
      await answerCallback(callbackId, `✅ Approved สำเร็จ!`);
      await editMessageCaption(cb.message,
        `✅ <b>APPROVED — Request #${id}</b>\n\n` +
        `👤 User: <b>${u.username || "-"}</b> (${u.email || "-"})\n` +
        `📦 Plan: <b>${PLAN_NAMES[pr.plan]}</b> · ${pr.billing_cycle === "yearly" ? "รายปี" : "รายเดือน"}\n` +
        `💰 ยอด: <b>${Number(pr.amount).toLocaleString()} บาท</b>\n` +
        `📅 หมดอายุ: <b>${expiresAt.toLocaleDateString("th-TH")}</b>\n` +
        `🕐 Approved: ${new Date().toLocaleString("th-TH")}\n\n` +
        `⚡ กรุณา refresh หน้าเว็บเพื่อดู plan ที่อัปเดต`
      );

    } else {
      await query(
        "update payment_requests set status='rejected' where id=$1 and status='pending'", [id]
      );
      await answerCallback(callbackId, `❌ Rejected แล้ว`);
      await editMessageCaption(cb.message,
        `❌ <b>REJECTED — Request #${id}</b>\n\n` +
        `🕐 Rejected: ${new Date().toLocaleString("th-TH")}`
      );
    }
  } catch (err) {
    console.error("[telegram-webhook]", err);
    await answerCallback(callbackId, "❌ เกิดข้อผิดพลาด server");
  }
});

/* ── POST /telegram/set-webhook  (เรียกครั้งเดียวเพื่อลงทะเบียน) ── */
router.post("/set-webhook", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });

  const { tunnel_url } = req.body;
  if (!tunnel_url) return res.status(400).json({ error: "tunnel_url required" });

  const webhookUrl = `${tunnel_url}/telegram/webhook`;
  const token      = process.env.TELEGRAM_BOT_TOKEN;

  try {
    const result = await telegramGet(
      `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(webhookUrl)}`
    );
    res.json({ ok: true, webhookUrl, telegram: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── helpers ── */
function telegramGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    }).on("error", reject);
  });
}

function telegramPost(path, body) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const data  = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${token}/${path}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data) },
    }, (res) => {
      let d = "";
      res.on("data", c => d += c);
      res.on("end", () => resolve(d));
    });
    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

function answerCallback(callbackQueryId, text) {
  return telegramPost("answerCallbackQuery", { callback_query_id: callbackQueryId, text });
}

function editMessageCaption(message, newCaption) {
  return telegramPost("editMessageCaption", {
    chat_id:      message.chat.id,
    message_id:   message.message_id,
    caption:      newCaption,
    parse_mode:   "HTML",
    reply_markup: JSON.stringify({ inline_keyboard: [] }), // ลบปุ่มออก
  });
}

module.exports = router;
module.exports.telegramPost = telegramPost;
