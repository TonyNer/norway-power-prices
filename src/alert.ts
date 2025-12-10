// src/alert.ts
import dotenv from "dotenv";
import { getNextRows } from "./db.js";
import { sendTelegram } from "./telegram.js";
dotenv.config();

const threshold = Number(process.env.PRICE_THRESHOLD ?? 1.0);
if (!Number.isFinite(threshold)) {
  console.error("Invalid PRICE_THRESHOLD");
  process.exit(1);
}

function isoNow(): string {
  return new Date().toISOString();
}

// Round up to next whole hour (for display only)
function nextHourLocal(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

async function checkAlerts(): Promise<void> {
  // Find the *next* price period after now.
  const next = getNextRows.all(isoNow(), 1)[0];
  if (!next) {
    console.log("No upcoming price row found.");
    return;
  }

  if (next.price > threshold) {
    const nextLocal = new Date(next.time_start);
    const endLocal = new Date(next.time_end);
    const msg = [
      "⚡ *High Price Warning*",
      `Next hour: *${next.price.toFixed(2)} NOK/kWh*`,
      `Period: ${nextLocal.toLocaleString()} → ${endLocal.toLocaleTimeString()}`
    ].join("\n");
    await sendTelegram(msg);
    console.log("Alert sent.");
  } else {
    console.log(
      `Next price ${next.price.toFixed(3)} NOK/kWh <= threshold ${threshold.toFixed(3)}`
    );
  }
}

checkAlerts();
