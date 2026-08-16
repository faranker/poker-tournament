const router = require("express").Router();
const jwt    = require("jsonwebtoken");
const { query } = require("../db");

function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try { req.user = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { res.status(401).json({ error: "Invalid token" }); }
}

/* ── POST /history/save ── */
router.post("/save", auth, async (req, res) => {
  const { mode, game_name, players, summary, played_at } = req.body;
  if (!mode || !players) return res.status(400).json({ error: "missing fields" });

  const { rows } = await query(
    `insert into session_history (user_id, mode, game_name, players, summary, played_at)
     values ($1,$2,$3,$4,$5,$6) returning id`,
    [req.user.id, mode, game_name || null,
     JSON.stringify(players), JSON.stringify(summary || {}),
     played_at || new Date()]
  );
  res.json({ ok: true, id: rows[0].id });
});

/* ── GET /history ── */
router.get("/", auth, async (req, res) => {
  const { rows } = await query(
    `select id, mode, game_name, players, summary, played_at
     from session_history
     where user_id=$1 and played_at > now() - interval '90 days'
     order by played_at desc
     limit 100`,
    [req.user.id]
  );
  res.json(rows);
});

module.exports = router;
