import fetch from "node-fetch";
import db from "./db.js";
import dotenv from "dotenv";
dotenv.config();

async function fetchPrices() {
  const zone = process.env.ZONE || "NO4";

  const url = `https://www.hvakosterstrommen.no/api/v1/prices/current?sone=${zone}`;

  const res = await fetch(url);
  const data = await res.json();

  const insert = db.prepare(`
    INSERT INTO prices (zone, price, time_start, time_end)
    VALUES (?, ?, ?, ?)
  `);

  data.forEach((p: any) => {
    insert.run(zone, p.NOK_per_kWh, p.time_start, p.time_end);
  });

  console.log("Saved new prices");
}

fetchPrices();
