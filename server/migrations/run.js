/* รัน migration SQL file หนึ่งไฟล์ผ่าน connection เดียวกับที่ server ใช้ (server/db.js)
 * ใช้: node migrations/run.js migrations/2026-08-19-line-auto-approve.sql
 * ต่อ local DB โดยอัตโนมัติจาก server/.env, หรือถ้าอยาก apply กับ production
 * ให้ตั้ง DATABASE_URL ของ Railway เป็น env var ก่อนรันคำสั่งนี้ */
const fs = require("fs");
const { pool } = require("../db");

const file = process.argv[2];
if (!file) {
  console.error("usage: node migrations/run.js <path-to-sql-file>");
  process.exit(1);
}

(async () => {
  const sql = fs.readFileSync(file, "utf8");
  try {
    await pool.query(sql);
    console.log(`✅ Applied ${file}`);
  } catch (err) {
    console.error(`❌ Failed to apply ${file}:`, err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
