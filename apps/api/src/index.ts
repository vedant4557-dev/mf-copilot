/**
 * apps/api/src/index.ts
 * Express API server — main entry point
 *
 * Install:
 *   npm install express @anthropic-ai/sdk @prisma/client ioredis
 *               @supabase/supabase-js jsonwebtoken zod helmet
 *               express-rate-limit pino pino-http socket.io cors
 */

import express from "express";
import helmet from "helmet";
import cors from "cors";
import pino from "pino-http";
import { createServer } from "http";
import { Server as SocketIO } from "socket.io";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";

import portfolioRouter from "./routes/portfolio";
import aiRouter        from "./routes/ai";
import navRouter       from "./routes/nav";
import authRouter      from "./routes/auth";
import fundsRouter     from "./routes/funds";
import paymentRouter   from "./routes/payments";

const app    = express();
const server = createServer(app);
const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL!);

const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.WEB_ORIGIN || "http://localhost:3000", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(pino({ logger: pino.pino() }));

// Global rate limit — 100 req/min per IP
import rateLimit from "express-rate-limit";
app.use(rateLimit({ windowMs: 60_000, max: 100, standardHeaders: true, legacyHeaders: false }));

// ─────────────────────────────────────────────────────────────
// Routes
// ─────────────────────────────────────────────────────────────
app.use("/api/auth",       authRouter);
app.use("/api/portfolios", portfolioRouter);
app.use("/api/ai",         aiRouter);
app.use("/api/nav",        navRouter);
app.use("/api/funds",      fundsRouter);
app.use("/api/payments",   paymentRouter);

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "mf-copilot-api", version: "4.0.0" })
);

// ─────────────────────────────────────────────────────────────
// WebSocket — Socket.io with Redis adapter for multi-instance
// ─────────────────────────────────────────────────────────────
import { createAdapter } from "@socket.io/redis-adapter";

const pubClient = new Redis(process.env.REDIS_URL!);
const subClient = pubClient.duplicate();

const io = new SocketIO(server, {
  cors: { origin: process.env.WEB_ORIGIN || "http://localhost:3000" },
});
io.adapter(createAdapter(pubClient, subClient));

io.on("connection", (socket) => {
  // Join user-specific rooms on auth
  socket.on("auth", (token: string) => {
    // Verify JWT and extract userId
    try {
      const jwt = require("jsonwebtoken");
      const { id } = jwt.verify(token, process.env.JWT_SECRET!);
      socket.join(`portfolio:${id}`);
      socket.join(`alerts:${id}`);
    } catch {
      socket.disconnect(true);
    }
  });

  socket.join("market");  // all users get market-wide NAV broadcast
});

// Subscribe to Redis pub/sub channels from ingestion service
const sub = new Redis(process.env.REDIS_URL!);
sub.subscribe("nav:updated", "alert:triggered");
sub.on("message", (channel, message) => {
  if (channel === "nav:updated") {
    io.to("market").emit("nav.update", JSON.parse(message));
  }
  if (channel === "alert:triggered") {
    const data = JSON.parse(message);
    io.to(`alerts:${data.userId}`).emit("alert.triggered", data);
  }
});

// ─────────────────────────────────────────────────────────────
// Start
// ─────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`🚀 API server running on :${PORT}`);
});

// Graceful shutdown
const shutdown = async () => {
  await prisma.$disconnect();
  redis.disconnect();
  sub.disconnect();
  process.exit(0);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT",  shutdown);
