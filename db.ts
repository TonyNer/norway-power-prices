import Database from "better-sqlite3";

const db = new Database("prices.db");

// Create table
db.prepare(`
  CREATE TABLE IF NOT EXISTS prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    time_start TEXT UNIQUE,
    NOK_per_kWh REAL
  )
`).run();

export default db;
