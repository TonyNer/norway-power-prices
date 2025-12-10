// src/fetchPrices.ts
import fetch from "node-fetch";
import dotenv from "dotenv";
import { insertPrice } from "./db.js";
dotenv.config();

type ApiPrice = {
  NOK_per_kWh: number;
  time_start: string; // ISO
  time_end: string;   // ISO
};

async function fetchPrices(): Promise<void> {
  const zone = process.env.ZONE || "NO4";
  const url = `https://www.hvakosterstrommen.no/api/v1/prices/current?sone=${encodeURIComponent(zone)}`;

  let data: unknown;
  try {
    const res = await fetch(url, { headers: { "Accept": "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    data = await res.json();
  } catch (e) {
    console.error("Fetch failed:", e);
    process.exit(1);
  }

  if (!Array.isArray(data)) {
    console.error("Unexpected API response shape");
    process.exit(1);
  }

  let inserted = 0;
  let ignored = 0;

  for (const p of data as ApiPrice[]) {
    if (
      typeof p?.NOK_per_kWh !== "number" ||
      typeof p?.time_start !== "string" ||
      typeof p?.time_end !== "string"
    ) {
      continue; // skip bad rows
    }
    try {
      const info = insertPrice.run(zone, p.NOK_per_kWh, p.time_start, p.time_end);
      inserted += info.changes ? 1 : 0;
      ignored += info.changes ? 0 : 1;
    } catch (e) {
      console.error("Insert error:", e);
    }
  }

  console.log(`Saved prices: inserted=${inserted}, ignored=${ignored}`);
}

fetchPrices();
