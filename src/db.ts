import Database from "better-sqlite3";

const db = new Database("./prices.db");

db.exec(`
PRAGMA journal_mode = WAL;
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  zone TEXT NOT NULL,
  price REAL NOT NULL,
  time_start TEXT NOT NULL, -- ISO with offset (display)
  time_end   TEXT NOT NULL,
  ts_start   INTEGER NOT NULL, -- epoch seconds UTC (queries)
  ts_end     INTEGER NOT NULL,
  UNIQUE(zone, ts_start)
);
CREATE INDEX IF NOT EXISTS idx_prices_ts_start ON prices(ts_start);
`);

export type PriceRow = {
  id: number;
  zone: string;
  price: number;
  time_start: string;
  time_end: string;
  ts_start: number;
  ts_end: number;
};

const stmtInsert = db.prepare(`
INSERT OR IGNORE INTO prices
(zone, price, time_start, time_end, ts_start, ts_end)
VALUES (?, ?, ?, ?, ?, ?)
`);

const stmtLatest = db.prepare(`
SELECT * FROM prices
ORDER BY ts_start DESC
LIMIT ?
`);

const stmtNext = db.prepare(`
SELECT * FROM prices
WHERE ts_start > ?
ORDER BY ts_start ASC
LIMIT ?
`);

export function insertPrice(
  zone: string,
  price: number,
  time_start_iso: string,
  time_end_iso: string
) {
  const ts_start = Math.floor(new Date(time_start_iso).getTime() / 1000);
  const ts_end = Math.floor(new Date(time_end_iso).getTime() / 1000);
  return stmtInsert.run(zone, price, time_start_iso, time_end_iso, ts_start, ts_end);
}

export function getLatest(limit: number): PriceRow[] {
  return stmtLatest.all(limit) as PriceRow[];
}

export function getNextRows(nowEpochSec: number, limit: number): PriceRow[] {
  return stmtNext.all(nowEpochSec, limit) as PriceRow[];
}

export default db;
