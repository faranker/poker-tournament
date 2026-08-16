const router    = require("express").Router();
const requireAuth = require("../middleware/auth");
const { query } = require("../db");

/* GET /subscriptions/me — ดู plan ปัจจุบัน */
router.get("/me", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      "select plan, expires_at from subscriptions where user_id = $1",
      [req.user.id]
    );
    const sub = rows[0] || { plan: "free", expires_at: null };
    let plan = sub.plan;
    if (sub.expires_at && new Date(sub.expires_at) < new Date()) plan = "free";
    res.json({ plan, expires_at: sub.expires_at });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* PUT /subscriptions/:userId — แก้ plan (admin เท่านั้น — ใส่ ADMIN_KEY ใน header) */
router.put("/:userId", async (req, res) => {
  const adminKey = req.headers["x-admin-key"];
  if (adminKey !== process.env.ADMIN_KEY)
    return res.status(403).json({ error: "Forbidden" });
  const { plan, expires_at } = req.body;
  const validPlans = ["free", "cash_pro", "full_pro"];
  if (!validPlans.includes(plan))
    return res.status(400).json({ error: "Invalid plan" });
  try {
    await query(
      `insert into subscriptions (user_id, plan, expires_at)
       values ($1, $2, $3)
       on conflict (user_id) do update set plan = $2, expires_at = $3, updated_at = now()`,
      [req.params.userId, plan, expires_at || null]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
