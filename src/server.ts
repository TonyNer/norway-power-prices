import express from "express";
import dotenv from "dotenv";
import { getLatest, getNextRows } from "./db.js";
import { fetchPrices } from "./fetchPrices.js";
import { sendTelegram } from "./telegram.js";

dotenv.config();

const app = express();
app.use(express.static("public"));

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

const port = Number(process.env.PORT ?? 3000);
const priceThreshold = Number(process.env.PRICE_THRESHOLD ?? 1.0);
if (!Number.isFinite(priceThreshold)) {
  throw new Error("Invalid PRICE_THRESHOLD");
}
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
let startupPriceChecked = false;

async function maybeNotifyLowPrice(): Promise<void> {
  if (startupPriceChecked) return;
  const next = getNextRows(Math.floor(Date.now() / 1000), 1)[0];
  if (!next) return;
  startupPriceChecked = true;
  if (next.price < priceThreshold) {
    const start = new Date(next.ts_start * 1000);
    const end = new Date(next.ts_end * 1000);
    const msg = [
      "✅ *Low Price Alert*",
      `Next hour: *${next.price.toFixed(2)} NOK/kWh*`,
      `Period: ${start.toLocaleString()} → ${end.toLocaleTimeString()}`
    ].join("\n");
    try {
      await sendTelegram(msg);
    } catch (err) {
      console.error("Failed to send low-price Telegram message", err);
    }
  }
}

async function runFetchCycle(): Promise<void> {
  if (fetchInFlight) return;
  fetchInFlight = true;
  try {
    await fetchPrices();
    await maybeNotifyLowPrice();
  } catch (err) {
    console.error("Price fetch failed", err);
  } finally {
    fetchInFlight = false;
  }
}

runFetchCycle();
setInterval(runFetchCycle, FETCH_INTERVAL_MS);
