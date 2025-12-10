// src/server.ts
import express from "express";
import dotenv from "dotenv";
import { getLatest, getNextRows } from "./db.js";
dotenv.config();

const app = express();
app.use(express.static("public"));

app.get("/healthz", (_req, res) => res.json({ ok: true }));

app.get("/api/prices", (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 24), 168) || 24;
  const rows = getLatest.all(limit);
  res.json(rows);
});

app.get("/api/forecast", (req, res) => {
  const hours = Math.min(Number(req.query.hours ?? 12), 48) || 12;
  const nowIso = new Date().toISOString();
  const rows = getNextRows.all(nowIso, hours);
  res.json(rows);
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Server running on port ${port}`));
