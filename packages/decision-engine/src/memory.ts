// packages/decision-engine/src/memory.ts

export interface UserMemory {
  riskInferred:     string;
  behaviorScore:    number;
  avgHoldMonths:    number;
  preferredCats:    string[];
  avoidedCats:      string[];
  ltcgSensitivity:  number;
  dismissedTypes:   Record<string, number>;  // issue_type → times dismissed
  followedTypes:    Record<string, number>;  // issue_type → times followed
}

export async function getUserMemory(userId: string): Promise<UserMemory> {
  const cacheKey = `memory:${userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [base, history] = await Promise.all([
    prisma.userMemory.findUnique({ where: { userId } }),
    prisma.recommendationHistory.findMany({
      where: { userId, outcome: { not: null } },
      select: { issueType: true, outcome: true },
      orderBy: { shownAt: 'desc' },
      take: 50,
    }),
  ]);

  const dismissedTypes: Record<string, number> = {};
  const followedTypes:  Record<string, number> = {};
  for (const r of history) {
    if (r.outcome === 'dismissed') dismissedTypes[r.issueType] = (dismissedTypes[r.issueType] || 0) + 1;
    if (r.outcome === 'followed')  followedTypes[r.issueType]  = (followedTypes[r.issueType]  || 0) + 1;
  }

  const memory: UserMemory = {
    riskInferred:    base?.riskInferred   ?? 'moderate',
    behaviorScore:   base?.behaviorScore  ?? 50,
    avgHoldMonths:   Number(base?.avgHoldMonths ?? 18),
    preferredCats:   base?.preferredCats  ?? [],
    avoidedCats:     base?.avoidedCats    ?? [],
    ltcgSensitivity: base?.ltcgSensitivity ?? 50,
    dismissedTypes,
    followedTypes,
  };

  await redis.setex(cacheKey, 3600, JSON.stringify(memory));
  return memory;
}

// Action ranking adjusted by memory
export function rankByMemory(actions: Action[], memory: UserMemory, issueType: string): Action[] {
  return actions.map(action => {
    let adjustedConfidence = action.confidence;
    const dismissCount = memory.dismissedTypes[issueType] || 0;
    const followCount  = memory.followedTypes[issueType]  || 0;

    // Downrank if user has dismissed this type before
    adjustedConfidence -= dismissCount * 8;
    // Uprank if user has followed this type before
    adjustedConfidence += followCount * 5;

    // Downrank HARVEST for users with low tax sensitivity
    if (action.verb === 'HARVEST' && memory.ltcgSensitivity < 30) {
      adjustedConfidence -= 20;
    }

    return { ...action, confidence: Math.max(0, Math.min(100, adjustedConfidence)) };
  }).sort((a, b) => b.confidence - a.confidence);
}

// Write memory after user acts
export async function recordOutcome(
  recommendationId: string,
  outcome: 'followed' | 'dismissed' | 'deferred',
  userId: string
) {
  await prisma.recommendationHistory.update({
    where: { id: recommendationId },
    data: { outcome, outcomeAt: new Date() },
  });

  // Update behavior score
  const delta = outcome === 'followed' ? +3 : outcome === 'dismissed' ? -1 : 0;
  await prisma.userMemory.upsert({
    where: { userId },
    create: { userId, behaviorScore: 50 + delta },
    update: { behaviorScore: { increment: delta }, lastActionAt: new Date(), updatedAt: new Date() },
  });

  await redis.del(`memory:${userId}`); // invalidate memory cache
}

// Schedule 90-day impact measurement
export async function scheduleImpactCheck(recommendationId: string, userId: string, portfolioId: string) {
  await impactQueue.add('measure-impact', {
    recommendationId, userId, portfolioId,
    measureAt: Date.now() + 90 * 864e5,
  }, { delay: 90 * 864e5 });
}
