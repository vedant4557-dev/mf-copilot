// services/digest-service/src/weekly.ts

export interface WeeklyDigest {
  userId:         string;
  weekEnding:     string;
  portfolioValue: number;
  weeklyChange:   number;
  weeklyChangePct:number;
  topGainer:      { fund: string; returnPct: number };
  topLoser:       { fund: string; returnPct: number };
  keyAction:      { verb: string; fund: string; reason: string; impact: string };
  warning:        { type: string; message: string } | null;
  goalProgress:   Array<{ goalName: string; currentPct: number; onTrack: boolean }>;
  emailReady:     EmailTemplate;
}

export async function buildWeeklyDigest(userId: string, portfolioId: string): Promise<WeeklyDigest> {
  const [analytics, decisions, goals, navWeekly] = await Promise.all([
    getLatestAnalytics(portfolioId),
    runDecisionEngine(portfolioId, userId, analytics),
    getGoals(userId),
    getWeeklyNavChanges(portfolioId),
  ]);

  const topGainer = [...navWeekly].sort((a,b) => b.changePct - a.changePct)[0];
  const topLoser  = [...navWeekly].sort((a,b) => a.changePct - b.changePct)[0];

  const keyAction = decisions[0]?.topAction ?? null;
  const warning   = decisions.find(d => d.issueScore > 80) ?? null;

  const digest: WeeklyDigest = {
    userId,
    weekEnding:      new Date().toISOString().slice(0,10),
    portfolioValue:  analytics.totalValue,
    weeklyChange:    analytics.weeklyPnL,
    weeklyChangePct: analytics.weeklyPnLPct,
    topGainer:       { fund: topGainer.fund, returnPct: topGainer.changePct },
    topLoser:        { fund: topLoser.fund,  returnPct: topLoser.changePct  },
    keyAction: keyAction ? {
      verb:   keyAction.verb,
      fund:   keyAction.fundFrom ?? keyAction.fundTo ?? '',
      reason: decisions[0].reason,
      impact: keyAction.expectedImpact,
    } : { verb: 'HOLD', fund: 'all funds', reason: 'Portfolio is healthy.', impact: 'No action needed.' },
    warning: warning ? { type: warning.issue.type, message: warning.reason } : null,
    goalProgress: goals.map(g => ({
      goalName:   g.name,
      currentPct: Math.round(g.current / g.target * 100),
      onTrack:    g.sipAmount >= g.sipNeeded,
    })),
    emailReady: buildEmailTemplate(digest),
  };

  await prisma.weeklyDigests.create({ data: { userId, digest, sentAt: null } });
  return digest;
}

// Email-ready template (Resend-compatible)
function buildEmailTemplate(digest: WeeklyDigest): EmailTemplate {
  const sign = digest.weeklyChangePct >= 0 ? '+' : '';
  return {
    subject: `Your portfolio ${sign}${digest.weeklyChangePct.toFixed(1)}% this week — ${digest.keyAction.verb} ${digest.keyAction.fund}`,
    preheader: digest.warning?.message ?? `Top gainer: ${digest.topGainer.fund} +${digest.topGainer.returnPct.toFixed(1)}%`,
    sections: [
      { type: 'metric',  label: 'Portfolio value',    value: `₹${(digest.portfolioValue/1e5).toFixed(2)}L` },
      { type: 'metric',  label: 'This week',          value: `${sign}${digest.weeklyChangePct.toFixed(2)}%` },
      { type: 'fund',    label: 'Top gainer',         fund: digest.topGainer.fund, value: `+${digest.topGainer.returnPct.toFixed(1)}%` },
      { type: 'fund',    label: 'Watch',              fund: digest.topLoser.fund,  value: `${digest.topLoser.returnPct.toFixed(1)}%` },
      { type: 'action',  label: 'Recommended action', verb: digest.keyAction.verb,  reason: digest.keyAction.reason, impact: digest.keyAction.impact },
      ...(digest.warning ? [{ type: 'warning', message: digest.warning.message }] : []),
      ...digest.goalProgress.map(g => ({ type: 'goal', name: g.goalName, pct: g.currentPct, onTrack: g.onTrack })),
    ],
  };
}
