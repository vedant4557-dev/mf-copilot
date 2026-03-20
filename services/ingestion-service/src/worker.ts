// services/alert-service/src/worker.ts — new file
import { createClient } from 'redis';
const sub = createClient({ url: process.env.REDIS_URL });

sub.subscribe('nav.refreshed', async (message) => {
  const { isins } = JSON.parse(message);

  // Only process portfolios that hold affected ISINs
  // This SQL is the key — don't scan all portfolios
  const affectedPortfolios = await prisma.$queryRaw<{ portfolio_id: string }[]>`
    SELECT DISTINCT ph.portfolio_id
    FROM portfolio_holdings ph
    WHERE ph.fund_isin = ANY(${isins}::text[])
      AND ph.portfolio_id IN (
        SELECT id FROM portfolios WHERE user_id IN (
          SELECT id FROM users WHERE plan != 'churned'
        )
      )
  `;

  // Batch into queue — don't evaluate synchronously
  await alertQueue.addBulk(
    affectedPortfolios.map(p => ({
      name: 'check-alerts',
      data: { portfolioId: p.portfolio_id },
      opts: { priority: 3, attempts: 2 }
    }))
  );
});

// Alert evaluation worker
new Worker('alerts', async (job) => {
  const { portfolioId } = job.data;

  const [analytics, prevAnalytics] = await Promise.all([
    getLatestAnalytics(portfolioId),
    getPreviousAnalytics(portfolioId, 7),  // vs 7 days ago
  ]);

  const triggered: Alert[] = ALERT_RULES
    .filter(rule => rule.check(analytics, prevAnalytics))
    .filter(async rule => !(await isOnCooldown(portfolioId, rule.id, rule.cooldown)))
    .map(rule => ({
      portfolioId,
      type: rule.id,
      message: rule.message(analytics),
      severity: rule.severity,
    }));

  if (triggered.length === 0) return;

  await prisma.clientAlerts.createMany({ data: triggered });
  await markCooldowns(portfolioId, triggered.map(a => a.type));

  // Only push notification for HIGH severity — no notification spam
  const high = triggered.filter(a => a.severity === 'HIGH');
  if (high.length > 0) {
    await pubClient.publish('alert.triggered', JSON.stringify({
      userId: await getPortfolioOwner(portfolioId),
      alerts: high,
    }));
  }
}, { connection: redisConn, concurrency: 50 });
// services/analytics-engine/src/worker.ts
import { Worker, Queue } from 'bullmq';
import { computeAnalytics } from '@mf-copilot/analytics';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const redis = { host: process.env.REDIS_HOST!, port: 6379 };

// This worker is the ONLY place analytics is computed
new Worker('analytics', async (job) => {
  const { portfolioId } = job.data;

  const [holdings, latestNavs] = await Promise.all([
    prisma.portfolioHoldings.findMany({
      where: { portfolioId },
      include: { portfolioTransactions: { orderBy: { txnDate: 'asc' } } }
    }),
    prisma.navHistory.findMany({
      where: { fundIsin: { in: holdings.map(h => h.fundIsin) } },
      orderBy: { navDate: 'desc' },
      distinct: ['fundIsin'],
    })
  ]);

  const navMap = Object.fromEntries(latestNavs.map(n => [n.fundIsin, Number(n.nav)]));
  const result = computeAnalytics(holdings, navMap);   // the heavy computation

  // Upsert — replace previous result for this portfolio
  await prisma.analyticsResults.upsert({
    where: { portfolioId_computedAt: { portfolioId, computedAt: new Date() } },
    create: { portfolioId, ...result, computedAt: new Date() },
    update: { ...result, computedAt: new Date() },
  });

  // Invalidate AI cache for this portfolio (analytics changed)
  const holdings2 = await prisma.portfolioHoldings.findMany({ where: { portfolioId } });
  const hash = portfolioHash(holdings2.map(h => ({ fundIsin: h.fundIsin, units: Number(h.units), avgBuyNav: Number(h.avgBuyNav) })), '*');
  await redis.del(`ai:*:${hash}`); // pattern delete via SCAN in production

  // Notify frontend
  await pubClient.publish('analytics.ready', JSON.stringify({ portfolioId }));

}, { connection: redis, concurrency: 8 });
