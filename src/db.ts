// src/db.ts
import Database from "better-sqlite3";

const db = new Database("./prices.db");

// Schema with de-dup + indexes
db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT NOT NULL,
  price REAL NOT NULL,
  time_start TEXT NOT NULL,
  time_end TEXT NOT NULL,
  UNIQUE(zone, time_start)
);
CREATE INDEX IF NOT EXISTS idx_prices_time_start ON prices(time_start);
`);

export type PriceRow = {
  id: number;
  zone: string;
  price: number;
  time_start: string;
  time_end: string;
};

export const insertPrice = db.prepare(
  `INSERT OR IGNORE INTO prices (zone, price, time_start, time_end)
   VALUES (?, ?, ?, ?)`
);

export const getLatest = db.prepare<unknown[], PriceRow[]>(
  `SELECT * FROM prices ORDER BY time_start DESC LIMIT ?`
);

export const getNextRows = db.prepare<[string, number], PriceRow[]>(
  `SELECT * FROM prices
   WHERE time_start > ?
   ORDER BY time_start ASC
   LIMIT ?`
);

export const getByStart = db.prepare<[string], PriceRow | undefined>(
  `SELECT price, time_start, time_end, zone, id FROM prices WHERE time_start = ?`
);

export default db;
