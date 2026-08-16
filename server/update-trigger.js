require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({
  host: "localhost", database: "poker_tournament",
  user: "postgres", password: process.env.DB_PASSWORD, port: 5432,
});

const sql = `
  create or replace function give_trial_plan()
  returns trigger language plpgsql as $$
  begin
    insert into subscriptions (user_id, plan, expires_at)
    values (new.id, 'full_pro', now() + interval '1 day');
    return new;
  end;
  $$;
`;

pool.query(sql)
  .then(() => { console.log("✅ Trigger updated: trial = 1 day"); pool.end(); })
  .catch(e => { console.error(e); pool.end(); });
