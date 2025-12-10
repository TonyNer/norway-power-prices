import Database from "better-sqlite3";

const db = new Database("./prices.db");

db.exec(`
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT,
  price REAL,
  time_start TEXT,
  time_end TEXT
);
`);

export default db;
