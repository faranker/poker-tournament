const router  = require("express").Router();
const jwt     = require("jsonwebtoken");
const { query } = require("../db");

/* ── middleware: verify JWT ── */
function auth(req, res, next) {
  const token = (req.headers.authorization || "").replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

/* ── POST /sessions/save ── */
router.post("/save", auth, async (req, res) => {
  const { game_state } = req.body;
  if (!game_state) return res.status(400).json({ error: "game_state required" });

  await query(
    `insert into game_sessions (user_id, game_state, updated_at)
     values ($1, $2, now())
     on conflict (user_id) do update set game_state=$2, updated_at=now()`,
    [req.user.id, JSON.stringify(game_state)]
  );
  res.json({ ok: true });
});

/* ── GET /sessions/load ── */
router.get("/load", auth, async (req, res) => {
  const { rows } = await query(
    "select game_state, updated_at from game_sessions where user_id=$1",
    [req.user.id]
  );
  if (!rows[0]) return res.json({ game_state: null });
  res.json({ game_state: rows[0].game_state, updated_at: rows[0].updated_at });
});

module.exports = router;
