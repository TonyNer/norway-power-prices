import dotenv from "dotenv";
import { getNextRows } from "./db.js";
import { sendTelegram } from "./telegram.js";
dotenv.config();

const threshold = Number(process.env.PRICE_THRESHOLD ?? 1.0);
if (!Number.isFinite(threshold)) {
  console.error("Invalid PRICE_THRESHOLD");
  process.exit(1);
}

function nowEpoch(): number {
  return Math.floor(Date.now() / 1000);
}

async function checkAlerts(): Promise<void> {
  const next = getNextRows(nowEpoch(), 1)[0];
  if (!next) {
    console.log("No upcoming price row found.");
    return;
  }

  if (next.price > threshold) {
    const start = new Date(next.ts_start * 1000);
    const end = new Date(next.ts_end * 1000);
    const msg = [
      "⚡ *High Price Warning*",
      `Next hour: *${next.price.toFixed(2)} NOK/kWh*`,
      `Period: ${start.toLocaleString()} → ${end.toLocaleTimeString()}`
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
