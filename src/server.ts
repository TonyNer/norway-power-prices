import express from "express";
import TelegramBot from "node-telegram-bot-api";
import { fetchPrices } from "./fetchPrices.js";

const app = express();

const bot = new TelegramBot(process.env.TELEGRAM_TOKEN!, { polling: true });

bot.on("message", (msg) => {
  bot.sendMessage(msg.chat.id, "Welcome! Send /prices to get latest power prices.");
});

bot.onText(/\/prices/, async (msg) => {
  const prices = await fetchPrices();
  bot.sendMessage(msg.chat.id, JSON.stringify(prices, null, 2));
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
