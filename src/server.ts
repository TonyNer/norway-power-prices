import express, { type Request, type Response } from "express";
import dotenv from "dotenv";
import { getLatest, getNextRows } from "./db.js";
dotenv.config();

const app = express();
app.use(express.static("public"));

app.get("/healthz", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/api/prices", (req: Request, res: Response) => {
  const raw = (req.query as any)?.limit;
  const n = Number(raw);
  const limit = Number.isFinite(n) ? Math.min(n, 168) : 24;
  res.json(getLatest(limit));
});

app.get("/api/forecast", (req: Request, res: Response) => {
  const raw = (req.query as any)?.hours;
  const n = Number(raw);
  const hours = Number.isFinite(n) ? Math.min(n, 48) : 12;
  const nowEpoch = Math.floor(Date.now() / 1000);
  res.json(getNextRows(nowEpoch, hours));
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Server running on port ${port}`));
