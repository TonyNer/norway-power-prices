import express, { Request, Response } from "express";
import db from "./db.js";

const app = express();
app.use(express.static("public"));

app.get("/api/prices", (req: Request, res: Response) => {
  const rows = db.prepare(`
    SELECT *
    FROM prices
    ORDER BY time_start DESC
    LIMIT 24
  `).all();

  res.json(rows);
});

app.listen(3000, () => console.log("Server running on port 3000"));
