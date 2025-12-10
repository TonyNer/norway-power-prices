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

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  message TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
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

export type NotificationLog = {
  id: number;
  message: string;
  created_at: number;
};

type SettingRow = {
  value: string;
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

const stmtInsertNotification = db.prepare(`
INSERT INTO notifications (message, created_at)
VALUES (?, ?)
`);

const stmtGetNotifications = db.prepare(`
SELECT * FROM notifications
ORDER BY created_at DESC
LIMIT ?
`);

const stmtGetSetting = db.prepare(`
SELECT value FROM settings WHERE key = ?
`);

const stmtUpsertSetting = db.prepare(`
INSERT INTO settings (key, value)
VALUES (?, ?)
ON CONFLICT(key) DO UPDATE SET value = excluded.value
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

export function logNotification(message: string): void {
  const ts = Math.floor(Date.now() / 1000);
  stmtInsertNotification.run(message, ts);
}

export function getNotificationLogs(limit: number): NotificationLog[] {
  return stmtGetNotifications.all(limit) as NotificationLog[];
}

export function getSetting(key: string): string | undefined {
  const row = stmtGetSetting.get(key) as SettingRow | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  stmtUpsertSetting.run(key, value);
}

const PRICE_THRESHOLD_KEY = "price_threshold";

export function getPriceThreshold(defaultValue: number): number {
  const stored = getSetting(PRICE_THRESHOLD_KEY);
  const parsed = Number(stored);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  setPriceThreshold(defaultValue);
  return defaultValue;
}

export function setPriceThreshold(value: number): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error("Invalid price threshold");
  }
  setSetting(PRICE_THRESHOLD_KEY, value.toString());
}

export default db;
