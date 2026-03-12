/**
 * apps/api/src/routes/portfolio.ts
 * Portfolio CRUD, analytics, CAS import, corporate action adjustments
 */

import { Router, Request, Response } from "express";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import Redis from "ioredis";
import { computeAnalytics } from "@mf-copilot/analytics";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { auditLog } from "../middleware/audit";
import { validate } from "../middleware/validate";

const router = Router();
const prisma = new PrismaClient();
const redis  = new Redis(process.env.REDIS_URL!);

const ANALYTICS_TTL = 600; // 10 min

// ─────────────────────────────────────────────────────────────
// GET /portfolios — list user's portfolios
// ─────────────────────────────────────────────────────────────
router.get(
  "/",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const portfolios = await prisma.portfolios.findMany({
      where: { userId: req.user!.id },
      include: { _count: { select: { portfolioHoldings: true } } },
      orderBy: { isPrimary: "desc" },
    });
    res.json({ portfolios });
  }
);

// ─────────────────────────────────────────────────────────────
// GET /portfolios/:id/analytics — computed metrics
// ─────────────────────────────────────────────────────────────
router.get(
  "/:id/analytics",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const cacheKey = `portfolio:${id}:analytics`;

    // Cache hit
    const cached = await redis.get(cacheKey);
    if (cached) {
      return res.json({ ...JSON.parse(cached), fromCache: true });
    }

    const portfolio = await prisma.portfolios.findFirst({
      where: { id, userId: req.user!.id },
      include: {
        portfolioHoldings: {
          include: {
            portfolioTransactions: { orderBy: { txnDate: "asc" } },
          },
        },
      },
    });

    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    // Fetch latest NAVs
    const isins = portfolio.portfolioHoldings.map((h) => h.fundIsin);
    const navRows = await prisma.navHistory.findMany({
      where: { fundIsin: { in: isins } },
      orderBy: { navDate: "desc" },
      distinct: ["fundIsin"],
    });
    const navMap = Object.fromEntries(navRows.map((n) => [n.fundIsin, Number(n.nav)]));

    const analytics = computeAnalytics(portfolio.portfolioHoldings, navMap);

    // Cache and persist
    await redis.setex(cacheKey, ANALYTICS_TTL, JSON.stringify(analytics));
    await prisma.analyticsResults.create({
      data: {
        portfolioId:   id,
        totalValue:    analytics.totalValue,
        totalInvested: analytics.totalInvested,
        pnl:           analytics.pnl,
        pnlPct:        analytics.pnlPct,
        xirr:          analytics.xirr,
        sharpe:        analytics.sharpe,
        sortino:       analytics.sortino,
        maxDrawdown:   analytics.maxDrawdown,
        beta:          analytics.beta,
        healthScore:   analytics.healthScore,
        diversityScore:analytics.diversityScore,
        sectorExposure:analytics.sectorExposure,
        overlapMatrix: analytics.overlapMatrix,
      },
    });

    return res.json({ ...analytics, fromCache: false });
  }
);

// ─────────────────────────────────────────────────────────────
// POST /portfolios/:id/import-cas — process CAS parser output
// ─────────────────────────────────────────────────────────────
const ImportCASSchema = z.object({
  folios: z.array(
    z.object({
      folio:       z.string(),
      fund_name:   z.string(),
      isin:        z.string().optional(),
      units:       z.number().positive(),
      avg_buy_nav: z.number().positive(),
      invested:    z.number().positive(),
      transactions: z.array(
        z.object({
          date:   z.string(),
          type:   z.string(),
          units:  z.number().optional(),
          nav:    z.number().optional(),
          amount: z.number().optional(),
          note:   z.string().optional(),
        })
      ),
    })
  ),
});

router.post(
  "/:id/import-cas",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 5 }),
  validate(ImportCASSchema),
  auditLog("cas_import"),
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { folios } = req.body;

    const portfolio = await prisma.portfolios.findFirst({
      where: { id, userId: req.user!.id },
    });
    if (!portfolio) return res.status(404).json({ error: "Portfolio not found" });

    let imported = 0;
    for (const folio of folios) {
      // Resolve ISIN → fund
      const fund = folio.isin
        ? await prisma.funds.findFirst({ where: { isin: folio.isin } })
        : await prisma.funds.findFirst({
            where: { name: { contains: folio.fund_name.slice(0, 20), mode: "insensitive" } },
          });

      if (!fund) continue;

      const holding = await prisma.portfolioHoldings.upsert({
        where: {
          portfolio_id_fund_isin_folio_number: {
            portfolioId: id,
            fundIsin: fund.isin,
            folioNumber: folio.folio,
          },
        },
        create: {
          portfolioId:    id,
          fundIsin:       fund.isin,
          folioNumber:    folio.folio,
          units:          folio.units,
          avgBuyNav:      folio.avg_buy_nav,
          investedAmount: folio.invested,
        },
        update: {
          units:          folio.units,
          avgBuyNav:      folio.avg_buy_nav,
          investedAmount: folio.invested,
        },
      });

      // Insert transactions
      await prisma.portfolioTransactions.createMany({
        data: folio.transactions.map((t: any) => ({
          holdingId:   holding.id,
          portfolioId: id,
          fundIsin:    fund.isin,
          txnDate:     new Date(t.date),
          txnType:     t.type,
          units:       t.units,
          nav:         t.nav,
          amount:      t.amount,
          note:        t.note,
        })),
        skipDuplicates: true,
      });

      imported++;
    }

    // Update portfolio
    await prisma.portfolios.update({
      where: { id },
      data: { casImported: true, updatedAt: new Date() },
    });

    // Invalidate analytics cache
    await redis.del(`portfolio:${id}:analytics`);

    res.json({ imported, total: folios.length });
  }
);

// ─────────────────────────────────────────────────────────────
// GET /portfolios/:id/history — time-series for charts
// ─────────────────────────────────────────────────────────────
router.get(
  "/:id/history",
  requireAuth,
  async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const days = Math.min(Number(req.query.days) || 365, 1825);
    const since = new Date(Date.now() - days * 86400_000);

    // Get all holdings with transaction history
    const holdings = await prisma.portfolioHoldings.findMany({
      where: { portfolioId: id },
      include: {
        portfolioTransactions: {
          where: { txnDate: { gte: since } },
          orderBy: { txnDate: "asc" },
        },
      },
    });

    // Get NAV history for each fund
    const isins = holdings.map((h) => h.fundIsin);
    const navHistory = await prisma.navHistory.findMany({
      where: { fundIsin: { in: isins }, navDate: { gte: since } },
      orderBy: { navDate: "asc" },
    });

    // Build daily portfolio values
    const navByFundDate = new Map<string, number>();
    for (const n of navHistory) {
      navByFundDate.set(`${n.fundIsin}:${n.navDate.toISOString().split("T")[0]}`, Number(n.nav));
    }

    // Generate dates
    const dates: string[] = [];
    const d = new Date(since);
    while (d <= new Date()) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }

    const timeSeries = dates.map((date) => {
      let value = 0;
      for (const h of holdings) {
        const nav = navByFundDate.get(`${h.fundIsin}:${date}`) || 0;
        value += Number(h.units) * nav;
      }
      return { date, value: Math.round(value) };
    });

    res.json({ history: timeSeries });
  }
);

export default router;
