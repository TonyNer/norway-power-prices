// src/telegram.ts
import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function assertEnv() {
  if (!TOKEN) throw new Error("Missing TELEGRAM_TOKEN");
  if (!CHAT_ID) throw new Error("Missing TELEGRAM_CHAT_ID");
}

export async function sendTelegram(msg: string): Promise<void> {
  assertEnv();
  const url = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
  const body = {
    chat_id: CHAT_ID,
    text: msg,
    parse_mode: "Markdown",
    disable_web_page_preview: true
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Telegram send failed: ${res.status} ${text}`);
  }
}
