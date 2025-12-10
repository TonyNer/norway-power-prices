import fetch from "node-fetch";
import dotenv from "dotenv";
import { logNotification } from "./db.js";
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function ensureEnv() {
  if (!TOKEN) throw new Error("Missing TELEGRAM_TOKEN");
  if (!CHAT_ID) throw new Error("Missing TELEGRAM_CHAT_ID");
}

export async function sendTelegram(msg: string): Promise<void> {
  ensureEnv();
  const res = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg,
      parse_mode: "Markdown",
      disable_web_page_preview: true
    })
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Telegram send failed: ${res.status} ${t}`);
  }
  logNotification(msg);
}
