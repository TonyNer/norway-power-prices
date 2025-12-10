import { savePrice } from "./db.js";

export async function fetchAndStorePrices() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  const url = `https://www.hvakosterstrommen.no/api/v1/prices/${year}/${month}-${day}_NO5.json`;

  const res = await fetch(url);
  const data: any[] = await res.json(); // FIXED

  for (const entry of data) {
    savePrice(entry);
  }

  console.log(`Saved ${data.length} hourly prices`);
}
