import axios from "axios";
import { savePrice } from "./db.js";

export async function fetchPrices() {
  const { data } = await axios.get("https://norway-power.com/api/v1/prices");

  for (const price of data) {
    await savePrice(price);
  }

  return data;
}
