const router  = require("express").Router();
const https   = require("https");
const { query } = require("../db");
const { approvePaymentRequest, PLAN_NAMES } = require("../services/paymentApproval");

/* ── POST /telegram/webhook  (Telegram → server) ── */
router.post("/webhook", async (req, res) => {
  res.sendStatus(200); // ตอบ Telegram ก่อนเสมอ

  const cb = req.body?.callback_query;
  if (!cb) return;

  const callbackId = cb.id;
  const data       = cb.data || "";

  /* donate_approve_N | donate_reject_N */
  if (data.startsWith("donate_")) {
    const parts = data.split("_");           // ["donate","approve","5"] or ["donate","set","5","99"]
    const dAction = parts[1];
    const dId     = parseInt(parts[2], 10);

    /* donate_set_ID_AMOUNT */
    if (dAction === "set") {
      const setAmount = parseInt(parts[3], 10);
      if (!dId || !setAmount) { await answerCallback(callbackId, "❓ ข้อมูลไม่ถูกต้อง"); return; }
      try {
        const { rows } = await query(
          "select * from donations where id=$1 and status in ('pending','pending_amount')", [dId]
        );
        if (!rows[0]) { await answerCallback(callbackId, "⚠️ ไม่พบหรือดำเนินการแล้ว"); return; }
        const d = rows[0];
        await query(
          "update donations set status='approved', amount=$1, approved_at=now() where id=$2",
          [setAmount, dId]
        );
        await answerCallback(callbackId, `✅ Approved ฿${setAmount}!`);
        await editMessageCaption(cb.message,
          `🩷 <b>APPROVED — Donation #${dId}</b>\n\n` +
          `👤 ชื่อ: <b>${d.display_name}</b>\n` +
          `💰 ยอด: <b>${setAmount.toLocaleString()} บาท</b>\n` +
          `🕐 Approved: ${new Date().toLocaleString("th-TH")}`
        );
      } catch (err) {
        console.error("[donate-set]", err);
        await answerCallback(callbackId, "❌ เกิดข้อผิดพลาด");
      }
      return;
    }
    if (!dId || !["approve","reject"].includes(dAction)) {
      await answerCallback(callbackId, "❓ ไม่รู้จัก action นี้");
      return;
    }
    try {
      const { rows } = await query(
        "select * from donations where id=$1 and status='pending'", [dId]
      );
      if (!rows[0]) { await answerCallback(callbackId, "⚠️ ไม่พบหรือดำเนินการแล้ว"); return; }
      const d = rows[0];

      if (dAction === "approve") {
        /* แสดงปุ่มเลือกยอดเงิน */
        await answerCallback(callbackId, `เลือกยอดเงินตาม slip`);
        await editMessageCaption(cb.message,
          `🩷 <b>Donation #${dId}</b>\n\n` +
          `👤 ชื่อ: <b>${d.display_name}</b>\n` +
          `💰 เลือกยอดตาม slip ที่แนบมา`,
          { inline_keyboard: [
            [
              { text: "฿29",  callback_data: `donate_set_${dId}_29`  },
              { text: "฿49",  callback_data: `donate_set_${dId}_49`  },
              { text: "฿99",  callback_data: `donate_set_${dId}_99`  },
            ],
            [
              { text: "฿199", callback_data: `donate_set_${dId}_199` },
              { text: "฿499", callback_data: `donate_set_${dId}_499` },
              { text: "❌ ยกเลิก", callback_data: `donate_reject_${dId}` },
            ],
          ]}
        );
      } else {
        await query("update donations set status='rejected' where id=$1 and status='pending'", [dId]);
        await answerCallback(callbackId, `❌ Rejected donation #${dId}`);
        await editMessageCaption(cb.message,
          `❌ <b>REJECTED — Donation #${dId}</b>\n🕐 ${new Date().toLocaleString("th-TH")}`
        );
      }
    } catch (err) {
      console.error("[donate-webhook]", err);
      await answerCallback(callbackId, "❌ เกิดข้อผิดพลาด");
    }
    return;
  }

  /* approve_N | reject_N (payment) */
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
      const { expiresAt, planName } = await approvePaymentRequest(pr);

      const { rows: uRows } = await query("select username, email from users where id=$1", [pr.user_id]);
      const u = uRows[0] || {};
      await answerCallback(callbackId, `✅ Approved สำเร็จ!`);
      await editMessageCaption(cb.message,
        `✅ <b>APPROVED — Request #${id}</b>\n\n` +
        `👤 User: <b>${u.username || "-"}</b> (${u.email || "-"})\n` +
        `📦 Plan: <b>${planName}</b> · ${pr.billing_cycle === "yearly" ? "รายปี" : "รายเดือน"}\n` +
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

function editMessageCaption(message, newCaption, replyMarkup = { inline_keyboard: [] }) {
  return telegramPost("editMessageCaption", {
    chat_id:      message.chat.id,
    message_id:   message.message_id,
    caption:      newCaption,
    parse_mode:   "HTML",
    reply_markup: JSON.stringify(replyMarkup),
  });
}

module.exports = router;
module.exports.telegramPost = telegramPost;
