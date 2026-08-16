require("dotenv").config();
const { pool } = require("./db");

const sql = `
  create table if not exists game_sessions (
    user_id   text primary key,
    game_state jsonb    not null,
    updated_at timestamptz default now()
  );
`;

pool.query(sql)
  .then(() => { console.log("✅ game_sessions table ready"); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
