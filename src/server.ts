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
