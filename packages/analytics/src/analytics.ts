export function computeAnalytics(holdings: any[], navMap: any) {
  return { total: 0, pnl: 0, pnlPct: 0, xirr: 0, healthScore: 70, diversityScore: 60 };
}
export function runMonteCarlo(params: any) {
  return { p50: 0, p10: 0, p90: 0, goalProb: null, paths: [] };
}
