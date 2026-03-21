// packages/decision-engine/src/engine.ts

import { Issue, Action, Decision, IssueType } from './types';
import { scoreIssue, loadUserWeights } from './scoring';
import { getUserMemory } from './memory';
import { redis } from '../cache';

// ── Deterministic issue detection ───────────────────────────────
export function detectIssues(analytics: PortfolioAnalytics): Issue[] {
  const issues: Issue[] = [];
  const now = new Date();
  const daysToMarch31 = Math.max(0,
    Math.round((new Date(now.getFullYear(), 2, 31).getTime() - now.getTime()) / 864e5)
  );

  // Issue: fund overlap
  for (const [pairKey, overlapPct] of Object.entries(analytics.overlapMatrix)) {
    if (overlapPct > 60) {
      const [fundA, fundB] = pairKey.split('::');
      issues.push({
        type: 'high_overlap',
        severity: Math.min(100, overlapPct),
        exposure: analytics.fundWeights[fundA] + analytics.fundWeights[fundB],
        urgency: 20,
        taxImpact: 10,
        metadata: { fundA, fundB, overlapPct },
      });
    }
  }

  // Issue: high expense ratio
  if (analytics.weightedER > 1.0) {
    issues.push({
      type: 'high_cost',
      severity: Math.min(100, (analytics.weightedER - 0.5) * 60),
      exposure: 100,
      urgency: 15,
      taxImpact: 5,
      metadata: { currentER: analytics.weightedER, savingsEstimate: (analytics.weightedER - 0.5) * analytics.totalValue / 100 },
    });
  }

  // Issue: tax harvest window (March deadline)
  if (analytics.harvestableAmount > 10000) {
    const urgency = daysToMarch31 < 30 ? 90 : daysToMarch31 < 60 ? 60 : 30;
    const taxSaving = Math.round(analytics.harvestableAmount * 0.20); // STCG rate
    issues.push({
      type: 'tax_harvest',
      severity: 70,
      exposure: analytics.harvestableAmount / analytics.totalValue * 100,
      urgency,
      taxImpact: Math.min(100, taxSaving / 1000),
      metadata: { harvestableAmount: analytics.harvestableAmount, taxSaving, daysToMarch31 },
    });
  }

  // Issue: allocation drift
  for (const [fund, drift] of Object.entries(analytics.allocationDrift)) {
    if (Math.abs(drift) > 10) {
      issues.push({
        type: 'allocation_drift',
        severity: Math.min(100, Math.abs(drift) * 4),
        exposure: analytics.fundWeights[fund],
        urgency: 25,
        taxImpact: 5,
        metadata: { fund, drift, currentWeight: analytics.fundWeights[fund] },
      });
    }
  }

  // Issue: health decline
  if (analytics.healthScoreDelta !== undefined && analytics.healthScoreDelta < -10) {
    issues.push({
      type: 'health_decline',
      severity: Math.min(100, Math.abs(analytics.healthScoreDelta) * 5),
      exposure: 100,
      urgency: 50,
      taxImpact: 0,
      metadata: { currentScore: analytics.healthScore, delta: analytics.healthScoreDelta },
    });
  }

  return issues;
}

// ── Action generation (deterministic) ───────────────────────────
const ACTION_MAP: Record<IssueType, (issue: Issue, analytics: PortfolioAnalytics) => Action[]> = {
  high_overlap: (issue, analytics) => {
    const { fundA, fundB, overlapPct } = issue.metadata as any;
    const fundAWeight = analytics.fundWeights[fundA] || 0;
    const fundBWeight = analytics.fundWeights[fundB] || 0;
    const weaker = fundAWeight <= fundBWeight ? fundA : fundB;
    const replacement = suggestReplacement(weaker, analytics);
    return [
      { id: crypto.randomUUID(), verb: 'SWITCH', fundFrom: weaker, fundTo: replacement,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: `Reduce overlap from ${overlapPct}% to est. <30%`,
        confidence: 82 },
      { id: crypto.randomUUID(), verb: 'REDEEM', fundFrom: weaker, fundTo: null,
        amountINR: Math.round(analytics.fundValues[weaker] * 0.5), sipDeltaINR: null,
        expectedImpact: `Reduce ${weaker} weight from ${Math.round(fundAWeight)}% to ${Math.round(fundAWeight/2)}%`,
        confidence: 68 },
      { id: crypto.randomUUID(), verb: 'HOLD', fundFrom: null, fundTo: null,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: 'No change — monitor for 90 days',
        confidence: 30 },
    ];
  },

  high_cost: (issue, analytics) => {
    const { savingsEstimate } = issue.metadata as any;
    const highCostFund = Object.entries(analytics.fundExpenseRatios)
      .sort(([,a],[,b]) => b - a)[0][0];
    const indexAlternative = 'UTI Nifty 50 Index Fund';
    return [
      { id: crypto.randomUUID(), verb: 'SWITCH', fundFrom: highCostFund, fundTo: indexAlternative,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: `Save est. ₹${Math.round(savingsEstimate).toLocaleString('en-IN')}/yr in ER`,
        confidence: 88 },
      { id: crypto.randomUUID(), verb: 'REDUCE_SIP', fundFrom: highCostFund, fundTo: indexAlternative,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: 'Gradually shift SIP to lower-cost alternative',
        confidence: 74 },
      { id: crypto.randomUUID(), verb: 'HOLD', fundFrom: null, fundTo: null,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: 'Hold — review at next statement',
        confidence: 25 },
    ];
  },

  tax_harvest: (issue, analytics) => {
    const { harvestableAmount, taxSaving, daysToMarch31 } = issue.metadata as any;
    const lossPositions = analytics.lossMakingFunds.slice(0, 2);
    return [
      { id: crypto.randomUUID(), verb: 'HARVEST', fundFrom: lossPositions[0], fundTo: suggestReplacement(lossPositions[0], analytics),
        amountINR: harvestableAmount, sipDeltaINR: null,
        expectedImpact: `Save ₹${taxSaving.toLocaleString('en-IN')} in STCG tax before 31 March`,
        confidence: 91 },
      { id: crypto.randomUUID(), verb: 'REDEEM', fundFrom: lossPositions[0], fundTo: null,
        amountINR: harvestableAmount, sipDeltaINR: null,
        expectedImpact: `Partial redemption to crystallize ₹${harvestableAmount.toLocaleString('en-IN')} loss`,
        confidence: 70 },
      { id: crypto.randomUUID(), verb: 'HOLD', fundFrom: null, fundTo: null,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: `Wait — only ${daysToMarch31} days left to act`,
        confidence: 15 },
    ];
  },

  allocation_drift: (issue, analytics) => {
    const { fund, drift } = issue.metadata as any;
    return [
      { id: crypto.randomUUID(), verb: drift > 0 ? 'REDEEM' : 'INCREASE_SIP',
        fundFrom: drift > 0 ? fund : null, fundTo: drift < 0 ? fund : null,
        amountINR: Math.abs(drift) / 100 * analytics.totalValue, sipDeltaINR: null,
        expectedImpact: `Restore ${fund} to target weight`,
        confidence: 85 },
      { id: crypto.randomUUID(), verb: 'HOLD', fundFrom: null, fundTo: null,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: 'Drift within acceptable range — review in 30 days',
        confidence: 50 },
      { id: crypto.randomUUID(), verb: 'SWITCH', fundFrom: fund, fundTo: null,
        amountINR: null, sipDeltaINR: null,
        expectedImpact: 'Rebalance via next SIP allocation',
        confidence: 65 },
    ];
  },

  // ... remaining issue types follow same pattern
  high_drawdown: () => [],
  large_cap_heavy: () => [],
  small_cap_excess: () => [],
  health_decline: () => [],
  goal_off_track: () => [],
  inactivity: () => [],
};

// ── Main decision function ───────────────────────────────────────
export async function runDecisionEngine(
  portfolioId: string,
  userId: string,
  analytics: PortfolioAnalytics
): Promise<Decision[]> {

  const cacheKey = `decision:${portfolioId}:${analytics.hash}`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const [issues, weights, memory] = await Promise.all([
    Promise.resolve(detectIssues(analytics)),
    loadUserWeights(userId),
    getUserMemory(userId),
  ]);

  // Score and rank all issues
  const scored = issues
    .map(issue => ({ issue, score: scoreIssue(issue, weights) }))
    .sort((a, b) => b.score - a.score);

  // Build decisions for top 3 issues only
  const decisions: Decision[] = scored.slice(0, 3).map(({ issue, score }) => {
    const actionFn = ACTION_MAP[issue.type];
    const actions = actionFn ? actionFn(issue, analytics) : [];

    // Memory adjustment: downrank actions user has previously ignored
    const rankedActions = rankByMemory(actions, memory, issue.type);

    // Deterministic reason (no LLM)
    const reason = buildReason(issue, score, analytics);

    return {
      portfolioId,
      userId,
      computedAt: new Date(),
      topAction: rankedActions[0],
      alternatives: rankedActions.slice(1, 3),
      reason,
      explanation: '',          // filled async by LLM worker
      issueScore: score,
      issue,
    };
  });

  await redis.setex(cacheKey, 1800, JSON.stringify(decisions));

  // Async: trigger LLM explanation worker (non-blocking)
  await explanationQueue.add('explain', { decisions, analytics, userId }, { priority: 3 });

  return decisions;
}

function buildReason(issue: Issue, score: number, analytics: PortfolioAnalytics): string {
  const templates: Record<IssueType, (i: Issue) => string> = {
    high_overlap: (i) => {
      const { fundA, fundB, overlapPct } = i.metadata as any;
      return `${fundA} and ${fundB} share ${overlapPct}% holdings — you are paying two expense ratios for near-identical exposure.`;
    },
    high_cost: (i) => {
      const { currentER, savingsEstimate } = i.metadata as any;
      return `Portfolio weighted ER is ${currentER.toFixed(2)}% — switching to an index alternative saves est. ₹${Math.round(savingsEstimate).toLocaleString('en-IN')} annually.`;
    },
    tax_harvest: (i) => {
      const { harvestableAmount, taxSaving, daysToMarch31 } = i.metadata as any;
      return `₹${harvestableAmount.toLocaleString('en-IN')} in paper losses can be crystallized to save ₹${taxSaving.toLocaleString('en-IN')} STCG tax. ${daysToMarch31} days left before March 31.`;
    },
    allocation_drift: (i) => {
      const { fund, drift } = i.metadata as any;
      return `${fund} has drifted ${Math.abs(drift).toFixed(1)}% ${drift > 0 ? 'above' : 'below'} target — portfolio risk profile is misaligned.`;
    },
    health_decline:   (i) => `Health score dropped ${Math.abs((i.metadata as any).delta)} points — portfolio quality is deteriorating.`,
    goal_off_track:   (i) => `Current SIP will miss goal by est. ₹${((i.metadata as any).shortfall).toLocaleString('en-IN')}.`,
    large_cap_heavy:  (i) => `${(i.metadata as any).largePct}% large-cap concentration reduces diversification upside.`,
    small_cap_excess: (i) => `${(i.metadata as any).smallPct}% small-cap exceeds your risk profile limit of 25%.`,
    high_drawdown:    (i) => `Max drawdown of ${(i.metadata as any).drawdown}% exceeds moderate risk threshold.`,
    inactivity:       (i) => `No portfolio review in ${(i.metadata as any).days} days — market conditions may have changed.`,
  };
  return templates[issue.type]?.(issue) ?? 'Issue detected in portfolio.';
}
