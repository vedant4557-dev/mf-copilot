/**
 * services/ingestion-service/src/index.ts
 * AMFI NAV Ingestion Pipeline
 *
 * Fetches daily NAV data from AMFI at 11:30 PM IST (after market close),
 * upserts into PostgreSQL nav_history, and invalidates Redis caches.
 *
 * Install: npm install node-cron axios prisma @prisma/client ioredis pino
 */

import cron from "node-cron";
import axios from "axios";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL || "info" });
const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

const AMFI_URL = "https://www.amfiindia.com/spages/NAVAll.txt";
const BATCH_SIZE = 500;

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface NAVRecord {
  amfiCode: number;
  isin:     string;
  nav:      number;
  navDate:  Date;
  name:     string;
}

// ─────────────────────────────────────────────────────────────
// Parse AMFI NAV text file
// Format: SchemeCode;ISINDiv;ISINRe;SchemeName;NetAssetValue;Date
// ─────────────────────────────────────────────────────────────
function parseAMFIDate(raw: string): Date {
  // Format: "31-Mar-2024" or "31/03/2024"
  const [d, m, y] = raw.includes("-")
    ? raw.split("-")
    : raw.split("/").reverse();
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  const month = isNaN(Number(m)) ? months[m] : m.padStart(2, "0");
  return new Date(`${y}-${month}-${d.padStart(2, "0")}`);
}

function parseNAVFile(raw: string): NAVRecord[] {
  const records: NAVRecord[] = [];
  for (const line of raw.split("\n")) {
    const parts = line.trim().split(";");
    if (parts.length < 6) continue;

    const [codeStr, isinDiv, isinRe, name, navStr, dateStr] = parts;
    const code = parseInt(codeStr.trim(), 10);
    const nav  = parseFloat(navStr.trim());
    // Prefer "Reinvestment" ISIN (3rd column) as canonical, fall back to 2nd
    const isin = (isinRe?.trim() || isinDiv?.trim() || "").replace(/\r/, "");

    if (isNaN(code) || isNaN(nav) || nav <= 0 || !isin.startsWith("INF")) {
      continue;
    }

    try {
      records.push({
        amfiCode: code,
        isin,
        nav,
        navDate: parseAMFIDate(dateStr.trim()),
        name:    name.trim().slice(0, 200),
      });
    } catch {
      // skip malformed date rows
    }
  }
  return records;
}

// ─────────────────────────────────────────────────────────────
// Upsert in batches
// ─────────────────────────────────────────────────────────────
async function upsertBatch(batch: NAVRecord[]): Promise<number> {
  await prisma.$transaction(
    batch.map((r) =>
      prisma.navHistory.upsert({
        where: {
          fund_isin_nav_date: { fundIsin: r.isin, navDate: r.navDate },
        },
        create: {
          fundIsin: r.isin,
          navDate:  r.navDate,
          nav:      r.nav,
        },
        update: { nav: r.nav },
      })
    )
  );
  return batch.length;
}

// ─────────────────────────────────────────────────────────────
// Upsert funds master from NAV file (new funds auto-discovered)
// ─────────────────────────────────────────────────────────────
async function syncFundsMaster(records: NAVRecord[]): Promise<void> {
  const unique = new Map<string, NAVRecord>();
  for (const r of records) unique.set(r.isin, r);

  await prisma.$transaction(
    [...unique.values()].map((r) =>
      prisma.funds.upsert({
        where: { isin: r.isin },
        create: {
          isin:     r.isin,
          amfiCode: r.amfiCode,
          name:     r.name,
          amc:      "AMFI",     // enriched separately via factsheet scraper
          category: "Unknown",
        },
        update: { name: r.name },
      })
    )
  );
}

// ─────────────────────────────────────────────────────────────
// Cache invalidation
// ─────────────────────────────────────────────────────────────
async function invalidateCaches(): Promise<void> {
  const patterns = ["portfolio:*:analytics", "amfi:nav_map", "nav:*"];
  for (const pattern of patterns) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.info({ count: keys.length, pattern }, "Cache keys invalidated");
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Emit WebSocket event via Redis pub/sub
// ─────────────────────────────────────────────────────────────
async function broadcastNAVUpdate(count: number): Promise<void> {
  await redis.publish(
    "nav:updated",
    JSON.stringify({ recordsUpdated: count, timestamp: new Date().toISOString() })
  );
}

// ─────────────────────────────────────────────────────────────
// Main ingestion function
// ─────────────────────────────────────────────────────────────
async function fetchAndStoreNAV(): Promise<void> {
  const startedAt = Date.now();
  let logId: number | null = null;

  // Write ingestion_log start row
  const logRow = await prisma.ingestionLog.create({
    data: { source: "amfi", status: "running" },
  });
  logId = logRow.id;

  try {
    logger.info("Fetching AMFI NAV file…");
    const { data: raw } = await axios.get<string>(AMFI_URL, {
      timeout: 45_000,
      responseType: "text",
    });

    const records = parseNAVFile(raw);
    logger.info({ count: records.length }, "Parsed NAV records");

    await syncFundsMaster(records);

    // Batch upsert
    let inserted = 0;
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      inserted += await upsertBatch(records.slice(i, i + BATCH_SIZE));
      logger.debug({ inserted, total: records.length }, "Batch progress");
    }

    await invalidateCaches();
    await broadcastNAVUpdate(inserted);

    const durationMs = Date.now() - startedAt;
    await prisma.ingestionLog.update({
      where: { id: logId },
      data: {
        status:     "success",
        recordsIn:  records.length,
        recordsOut: inserted,
        finishedAt: new Date(),
        durationMs,
      },
    });

    logger.info({ inserted, durationMs }, "✅ NAV ingestion complete");
  } catch (err) {
    logger.error(err, "NAV ingestion failed");
    if (logId) {
      await prisma.ingestionLog.update({
        where: { id: logId },
        data: {
          status:     "failed",
          errorMsg:   String(err),
          finishedAt: new Date(),
          durationMs: Date.now() - startedAt,
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────
// Scheduler — 11:30 PM IST (18:00 UTC) weekdays
// Also re-runs at 9:00 AM IST (3:30 UTC) to catch late updates
// ─────────────────────────────────────────────────────────────
cron.schedule("0 18 * * 1-5", fetchAndStoreNAV, { timezone: "UTC" });
cron.schedule("30 3  * * 2-6", fetchAndStoreNAV, { timezone: "UTC" }); // catch T+1 updates

// Manual trigger via env flag (for Docker init)
if (process.env.RUN_ON_START === "true") {
  fetchAndStoreNAV().catch(logger.error);
}

logger.info("📡 AMFI NAV ingestion service started");

// Graceful shutdown
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  redis.disconnect();
  process.exit(0);
});
