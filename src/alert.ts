import db from "./db.js";
import { sendTelegram } from "./telegram.js";
import dotenv from "dotenv";
dotenv.config();

const threshold = Number(process.env.PRICE_THRESHOLD || 1.0);

async function checkAlerts() {
  const now = new Date();
  const hourAhead = new Date(now.getTime() + 60 * 60 * 1000);

  const price = db.prepare(`
    SELECT price, time_start
    FROM prices
    WHERE time_start = ?
  `).get(hourAhead.toISOString());

  if (!price) return;

  if (price.price > threshold) {
    await sendTelegram(
      `⚡ *High Price Warning*\nPrice in 1 hour: *${price.price.toFixed(
        2
      )} NOK/kWh*`
    );
  }
}

checkAlerts();
