// packages/ai/src/cache.ts
import { createHash } from 'crypto';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export function portfolioHash(holdings: HoldingInput[], mode: string): string {
  // Deterministic: sorted by ISIN, rounded nav to 2dp (tiny fluctuations don't bust cache)
  const normalized = holdings
    .sort((a, b) => a.fundIsin.localeCompare(b.fundIsin))
    .map(h => `${h.fundIsin}:${h.units.toFixed(3)}:${Math.round(h.avgBuyNav)}`)
    .join('|');
  return createHash('sha256').update(`${normalized}:${mode}`).digest('hex').slice(0, 16);
}

const TTL: Record<string, number> = {
  diagnose:  1800,   // 30min — portfolio doesn't change that fast
  optimize:  3600,   // 1hr
  tax:       86400,  // 24hr — tax position changes only on transactions
  insights:  1800,
  chat:      0,      // never cache freeform chat
};

export async function cachedAI<T>(
  key: string,
  mode: string,
  fn: () => Promise<T>
): Promise<{ result: T; fromCache: boolean }> {
  const ttl = TTL[mode];
  if (ttl === 0) return { result: await fn(), fromCache: false };

  const cacheKey = `ai:${mode}:${key}`;
  const hit = await redis.get(cacheKey);
  if (hit) return { result: JSON.parse(hit), fromCache: true };

  const result = await fn();
  await redis.setex(cacheKey, ttl, JSON.stringify(result));
  return { result, fromCache: false };
}
