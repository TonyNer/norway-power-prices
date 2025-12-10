import fetch from "node-fetch";
import db from "./db.ts";
import Twilio from "twilio";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";

dotenv.config();

const REGION = "NO4";
const PORT = 3000;

const client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

// Express backend to serve saved prices
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("web")); // serve index.html

app.get("/api/prices", (req, res) => {
  const rows = db.prepare("SELECT * FROM prices ORDER BY time_start").all();
  res.json(rows);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// Fetch prices and save to DB
async function fetchAndNotify() {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_${REGION}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json() as {NOK_per_kWh: number, time_start: string}[];

    const insert = db.prepare("INSERT OR IGNORE INTO prices (time_start, NOK_per_kWh) VALUES (?, ?)");
    data.forEach(hour => insert.run(hour.time_start, hour.NOK_per_kWh));

    // Check next hour
    const currentHour = today.getHours();
    const nextHour = (currentHour + 1) % 24;
    const nextPriceObj = data.find(hourObj => new Date(hourObj.time_start).getHours() === nextHour);

    if (nextPriceObj && nextPriceObj.NOK_per_kWh > 1.0) {
      const message = `⚡ NO4 power price alert for ${nextHour}:00 is ${nextPriceObj.NOK_per_kWh.toFixed(2)} NOK/kWh`;
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: process.env.MY_WHATSAPP_NUMBER,
        body: message
      });
      console.log("WhatsApp alert sent:", message);
    }
  } catch (err) {
    console.error("Error fetching or notifying:", err);
  }
}

// Initial run and schedule every hour
fetchAndNotify();
setInterval(fetchAndNotify, 60 * 60 * 1000);
