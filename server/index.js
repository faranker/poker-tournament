require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const { pool } = require("./db");

const app  = express();
const PORT = process.env.PORT || 3001;

/* Middleware */
app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());

/* Routes */
app.use("/auth",          require("./routes/auth"));
app.use("/subscriptions", require("./routes/subscriptions"));
app.use("/exports",       require("./routes/exports"));
app.use("/payments",      require("./routes/payments"));
app.use("/telegram",      require("./routes/telegram-webhook"));
app.use("/sessions",      require("./routes/sessions"));
app.use("/history",       require("./routes/history"));
app.use("/donations",     require("./routes/donations"));

/* Health check */
app.get("/health", async (_req, res) => {
  try {
    await pool.query("select 1");
    res.json({ status: "ok", db: "connected", time: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

/* 404 */
app.use((_req, res) => res.status(404).json({ error: "Not found" }));

/* Sweep expired payment windows every 60s — belt-and-suspenders alongside
   the lazy check in GET /payments/status/:id, so a request nobody polls
   still flips to 'expired' instead of lingering forever. */
setInterval(() => {
  pool.query(
    "update payment_requests set status='expired' where status='awaiting_transfer' and payment_window_expires_at < now()"
  ).catch((err) => console.error("[expiry-sweep]", err));
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`\n🃏 Poker Tournament API running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health\n`);
});
