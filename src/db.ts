import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDb() {
  return open({
    filename: "prices.db",
    driver: sqlite3.Database,
  });
}

export async function savePrice(priceData: any) {
  const db = await openDb();

  await db.run(
    `INSERT INTO prices (time_start, time_end, price_nok, price_eur)
     VALUES (?, ?, ?, ?)`,
    priceData.time_start,
    priceData.time_end,
    priceData.NOK_per_kWh,
    priceData.EUR_per_kWh
  );
}
