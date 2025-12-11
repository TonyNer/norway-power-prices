import express from "express";
import dotenv from "dotenv";
import {
  getLatest,
  getNextRows,
  getNotificationLogs,
  getPriceThreshold,
  setPriceThreshold
} from "./db.js";
import { fetchPrices } from "./fetchPrices.js";
import { sendTelegram } from "./telegram.js";

dotenv.config();

const app = express();
app.use(express.static("public"));
app.use(express.json());

const port = Number(process.env.PORT ?? 3000);
const rawThreshold = process.env.price_threshold ?? process.env.PRICE_THRESHOLD ?? "0.1";
const defaultThreshold = Number(rawThreshold);
if (!Number.isFinite(defaultThreshold) || defaultThreshold <= 0) {
  throw new Error("Invalid PRICE_THRESHOLD");
}
getPriceThreshold(defaultThreshold);

app.get("/healthz", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/prices", (req, res) => {
  // Avoid type collisions by treating query as unknown/any
  const raw = (req as any)?.query?.limit;
  const n = Number(raw);
  const limit = Number.isFinite(n) ? Math.min(n, 168) : 24;
  res.json(getLatest(limit));
});

app.get("/api/forecast", (req, res) => {
  const raw = (req as any)?.query?.hours;
  const n = Number(raw);
  const hours = Number.isFinite(n) ? Math.min(n, 48) : 12;
  const nowEpoch = Math.floor(Date.now() / 1000);
  res.json(getNextRows(nowEpoch, hours));
});

app.get("/api/notifications", (req, res) => {
  const raw = (req as any)?.query?.limit;
  const n = Number(raw);
  const limit = Number.isFinite(n) ? Math.min(Math.max(n, 1), 100) : 10;
  res.json(getNotificationLogs(limit));
});

app.get("/api/threshold", (_req, res) => {
  res.json({ value: getPriceThreshold(defaultThreshold) });
});

app.post("/api/threshold", async (req, res) => {
  const raw = req.body?.value;
  const next = Number(raw);
  if (!Number.isFinite(next) || next <= 0) {
    return res.status(400).json({ error: "Invalid threshold value" });
  }
  try {
    setPriceThreshold(next);
    res.json({ value: next });
    const upcoming = getNextRows(Math.floor(Date.now() / 1000), 1)[0];
    if (upcoming && upcoming.price >= next) {
      const start = new Date(upcoming.ts_start * 1000);
      const end = new Date(upcoming.ts_end * 1000);
      const message = [
        "⚠️ *Threshold Updated*",
        `New threshold: *${next.toFixed(2)} NOK/kWh*`,
        `Next hour price ${upcoming.price.toFixed(2)} NOK/kWh is above threshold.`,
        `Period: ${start.toLocaleString()} → ${end.toLocaleTimeString()}`
      ].join("\n");
      try {
        await sendTelegram(message);
        lastHourlyAlertTs = upcoming.ts_start;
      } catch (err) {
        console.error("Failed to send threshold update Telegram message", err);
      }
    }
  } catch (err) {
    console.error("Failed to update threshold", err);
    res.status(500).json({ error: "Failed to update threshold" });
  }
});

app.listen(port, () => console.log(`Server running on port ${port}`));

async function announceStartup(): Promise<void> {
  try {
    await sendTelegram("✅ power-notify container started and is running.");
  } catch (err) {
    console.error("Failed to send startup Telegram message", err);
  }
}
announceStartup();

const FETCH_INTERVAL_MS = Math.max(
  5 * 60 * 1000,
  Number(process.env.FETCH_INTERVAL_MS ?? 60 * 60 * 1000)
);
let fetchInFlight = false;
let lastHourlyAlertTs: number | null = null;

async function evaluateNextHourPrice(): Promise<void> {
  const next = getNextRows(Math.floor(Date.now() / 1000), 1)[0];
  if (!next) return;
  const currentThreshold = getPriceThreshold(defaultThreshold);
  if (next.price <= currentThreshold) return;
  if (lastHourlyAlertTs === next.ts_start) return;
  lastHourlyAlertTs = next.ts_start;

  const start = new Date(next.ts_start * 1000);
  const end = new Date(next.ts_end * 1000);
  const msg = [
    "⚠️ *High Price Alert*",
    `Upcoming hour: *${next.price.toFixed(2)} NOK/kWh*`,
    `Period: ${start.toLocaleString()} → ${end.toLocaleTimeString()}`,
    `Above threshold (${currentThreshold.toFixed(2)} NOK/kWh)`
  ].join("\n");

  try {
    await sendTelegram(msg);
  } catch (err) {
    console.error("Failed to send hourly price Telegram message", err);
  }
}

function scheduleHourlyChecks(): void {
  const hourMs = 60 * 60 * 1000;
  const delay = hourMs - (Date.now() % hourMs);
  setTimeout(() => {
    evaluateNextHourPrice().catch(err => console.error("Hourly check failed", err));
    setInterval(() => {
      evaluateNextHourPrice().catch(err => console.error("Hourly check failed", err));
    }, hourMs);
  }, delay);
}

async function runFetchCycle(): Promise<void> {
  if (fetchInFlight) return;
  fetchInFlight = true;
  try {
    await fetchPrices();
  } catch (err) {
    console.error("Price fetch failed", err);
  } finally {
    fetchInFlight = false;
  }
}

runFetchCycle();
setInterval(runFetchCycle, FETCH_INTERVAL_MS);
scheduleHourlyChecks();
