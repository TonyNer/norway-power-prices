import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const TOKEN = process.env.TELEGRAM_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

export async function sendTelegram(msg: string) {
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: msg
    })
  });
}
