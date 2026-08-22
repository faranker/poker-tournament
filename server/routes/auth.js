const router  = require("express").Router();
const bcrypt  = require("bcryptjs");
const jwt     = require("jsonwebtoken");
const crypto  = require("crypto");
const { query } = require("../db");

const sign = (user) =>
  jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });

const buildUser = async (user) => {
  const { rows } = await query(
    "select plan, expires_at from subscriptions where user_id = $1",
    [user.id]
  );
  const sub = rows[0];
  let plan = sub?.plan || "free";
  const expiresAt = sub?.expires_at || null;
  if (expiresAt && new Date(expiresAt) < new Date()) plan = "free";
  return { id: user.id, email: user.email, username: user.username, plan, expiresAt };
};

/* POST /auth/register */
router.post("/register", async (req, res) => {
  const { email, username, password } = req.body;
  if (!email || !username || !password)
    return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });
  if (username.length < 3)
    return res.status(400).json({ error: "Username ต้องมีอย่างน้อย 3 ตัวอักษร" });
  if (password.length < 6)
    return res.status(400).json({ error: "Password ต้องมีอย่างน้อย 6 ตัวอักษร" });
  try {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await query(
      "insert into users (email, username, password) values ($1, $2, $3) returning id, email, username",
      [email.toLowerCase(), username.toLowerCase(), hash]
    );
    const user = rows[0];
    const token = sign(user);
    const profile = await buildUser(user);
    res.status(201).json({ token, user: profile });
  } catch (err) {
    if (err.code === "23505") {
      const field = err.detail?.includes("email") ? "Email" : "Username";
      return res.status(409).json({ error: `${field} นี้ถูกใช้งานแล้ว` });
    }
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  }
});

/* POST /auth/login */
router.post("/login", async (req, res) => {
  const { identifier, password } = req.body;
  if (!identifier || !password)
    return res.status(400).json({ error: "กรอกข้อมูลให้ครบ" });
  try {
    const { rows } = await query(
      "select * from users where email = $1 or username = $1",
      [identifier.toLowerCase()]
    );
    const user = rows[0];
    if (!user) return res.status(401).json({ error: "ไม่พบบัญชีผู้ใช้นี้" });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: "รหัสผ่านไม่ถูกต้อง" });
    if (user.role === "banned")
      return res.status(403).json({ error: "บัญชีนี้ถูกระงับการใช้งาน" });
    const token = sign(user);
    const profile = await buildUser(user);
    res.json({ token, user: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด กรุณาลองใหม่" });
  }
});

/* GET /auth/me */
router.get("/me", require("../middleware/auth"), async (req, res) => {
  try {
    const { rows } = await query(
      "select id, email, username from users where id = $1",
      [req.user.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "User not found" });
    const profile = await buildUser(rows[0]);
    res.json({ user: profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* GET /auth/profile/bg — ดึง background image */
router.get("/profile/bg", require("../middleware/auth"), async (req, res) => {
  try {
    const { rows } = await query("select bg_image from users where id = $1", [req.user.id]);
    res.json({ bg_image: rows[0]?.bg_image || null });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* PUT /auth/profile/bg — บันทึก background image (base64, max 1MB) */
router.put("/profile/bg", require("../middleware/auth"), async (req, res) => {
  const { bg_image } = req.body;
  if (bg_image && Buffer.byteLength(bg_image, "utf8") > 1.5 * 1024 * 1024)
    return res.status(400).json({ error: "รูปใหญ่เกินไป (max 1MB)" });
  try {
    await query("update users set bg_image = $1 where id = $2", [bg_image || null, req.user.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

/* POST /auth/check-username */
router.post("/check-username", async (req, res) => {
  const { username } = req.body;
  if (!username) return res.status(400).json({ error: "กรุณาระบุ username" });
  const { rows } = await query(
    "select 1 from users where username = $1",
    [username.toLowerCase()]
  );
  res.json({ available: rows.length === 0 });
});

/* POST /auth/reset-password */
router.post("/reset-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "กรุณาระบุ email" });
  try {
    const { rows } = await query("select id from users where email = $1", [email.toLowerCase()]);
    if (!rows[0]) return res.json({ message: "หากมีบัญชีนี้อยู่ระบบจะส่ง email ให้" });
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 3600000); // 1 hour
    await query(
      "update users set reset_token = $1, reset_expires = $2 where id = $3",
      [token, expires, rows[0].id]
    );
    // TODO: send email with reset link
    // resetLink = `${process.env.CLIENT_URL}/reset?token=${token}`
    console.log(`[Reset token for ${email}]: ${token}`);
    res.json({ message: "หากมีบัญชีนี้อยู่ระบบจะส่ง email ให้" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "เกิดข้อผิดพลาด" });
  }
});

module.exports = router;
