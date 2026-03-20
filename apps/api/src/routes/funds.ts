// apps/api/src/routes/funds.ts — screener becomes a parameterized view query
router.get('/discover', async (req, res) => {
  const { category, sort = 'composite_score', order = 'desc', limit = 30, offset = 0 } = req.query;

  // Cache: same params = same result for 60min
  const cacheKey = `screener:${category}:${sort}:${order}:${limit}:${offset}`;
  const hit = await redis.get(cacheKey);
  if (hit) return res.json(JSON.parse(hit));

  // One indexed query against the materialized view
  const allowed = ['composite_score', 'r3y', 'r1y', 'expense_ratio', 'aum_cr', 'sharpe_ratio'];
  const col = allowed.includes(sort as string) ? sort : 'composite_score';
  const dir = order === 'asc' ? 'ASC' : 'DESC';

  const funds = await prisma.$queryRaw`
    SELECT * FROM fund_scores
    WHERE (${category}::text IS NULL OR category = ${category}::text)
    ORDER BY ${Prisma.raw(`${col} ${dir}`)}
    LIMIT ${Number(limit)} OFFSET ${Number(offset)}
  `;

  await redis.setex(cacheKey, 3600, JSON.stringify(funds));
  res.json(funds);
});
