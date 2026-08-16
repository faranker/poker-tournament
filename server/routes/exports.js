const router    = require("express").Router();
const requireAuth = require("../middleware/auth");
const { query } = require("../db");

/* GET /exports/count — นับ export ของ user ในเดือนนี้ */
router.get("/count", requireAuth, async (req, res) => {
  try {
    const { rows } = await query(
      `select count(*) as count from export_logs
       where user_id = $1
       and date_trunc('month', exported_at) = date_trunc('month', now())`,
      [req.user.id]
    );
    res.json({ count: parseInt(rows[0].count) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /exports — บันทึก export log */
router.post("/", requireAuth, async (req, res) => {
  const { mode } = req.body;
  if (!mode) return res.status(400).json({ error: "กรุณาระบุ mode" });
  try {
    await query(
      "insert into export_logs (user_id, mode) values ($1, $2)",
      [req.user.id, mode]
    );
    res.status(201).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
