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
