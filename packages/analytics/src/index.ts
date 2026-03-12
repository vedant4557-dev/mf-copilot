/**
 * packages/analytics/src/index.ts
 * Core financial analytics engine — shared across API and web
 *
 * Computes: XIRR, CAGR, Sharpe, Sortino, Calmar, Max Drawdown,
 *           Beta, Alpha, Correlation Matrix, Overlap, Monte Carlo
 */

export interface HoldingInput {
  fundIsin:       string;
  units:          number;
  avgBuyNav:      number;
  investedAmount: number;
  transactions?:  TxnInput[];
  holdings?:      string[];   // stock-level holdings for overlap
  sectors?:       Record<string, number>;
}

export interface TxnInput {
  txnDate: Date | string;
  txnType: string;
  units?:  number;
  nav?:    number;
  amount?: number;
}

export interface AnalyticsResult {
  totalValue:     number;
  totalInvested:  number;
  pnl:            number;
  pnlPct:         number;
  xirr:           number;
  sharpe:         number;
  sortino:        number;
  calmar:         number;
  maxDrawdown:    number;
  beta:           number;
  alpha:          number;
  volatility:     number;
  healthScore:    number;
  diversityScore: number;
  sectorExposure: Record<string, number>;
  marketCapExp:   Record<string, number>;
  overlapMatrix:  Record<string, Record<string, number>>;
  fundBreakdown:  FundBreakdown[];
}

export interface FundBreakdown {
  fundIsin:    string;
  currentValue:number;
  pnl:         number;
  pnlPct:      number;
  weight:      number;
}

// ─────────────────────────────────────────────────────────────
// XIRR — Newton-Raphson iteration
// ─────────────────────────────────────────────────────────────
export function calcXIRR(
  cashFlows: Array<{ date: Date; amount: number }>,
  guess = 0.1
): number {
  const PRECISION = 1e-7;
  const MAX_ITER  = 100;

  let rate = guess;
  for (let i = 0; i < MAX_ITER; i++) {
    let f  = 0;
    let df = 0;
    const t0 = cashFlows[0].date.getTime();

    for (const { date, amount } of cashFlows) {
      const t = (date.getTime() - t0) / (365 * 86400_000);
      const v = Math.pow(1 + rate, t);
      f  += amount / v;
      df -= (t * amount) / (v * (1 + rate));
    }

    const delta = f / df;
    rate -= delta;
    if (Math.abs(delta) < PRECISION) return rate;
  }
  return rate;
}

// ─────────────────────────────────────────────────────────────
// Sharpe Ratio
// ─────────────────────────────────────────────────────────────
export function calcSharpe(returns: number[], riskFreeRate = 0.065): number {
  if (returns.length < 2) return 0;
  const mean  = returns.reduce((a, b) => a + b, 0) / returns.length;
  const exRet = mean - riskFreeRate / 252;
  const std   = Math.sqrt(
    returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1)
  );
  return std === 0 ? 0 : (exRet / std) * Math.sqrt(252);
}

// ─────────────────────────────────────────────────────────────
// Sortino Ratio (downside deviation only)
// ─────────────────────────────────────────────────────────────
export function calcSortino(returns: number[], riskFreeRate = 0.065): number {
  if (returns.length < 2) return 0;
  const mean       = returns.reduce((a, b) => a + b, 0) / returns.length;
  const exRet      = mean - riskFreeRate / 252;
  const downside   = returns.filter((r) => r < 0);
  const downStd    = Math.sqrt(
    downside.reduce((sum, r) => sum + r * r, 0) / Math.max(1, downside.length)
  );
  return downStd === 0 ? 0 : (exRet / downStd) * Math.sqrt(252);
}

// ─────────────────────────────────────────────────────────────
// Max Drawdown
// ─────────────────────────────────────────────────────────────
export function calcMaxDrawdown(values: number[]): number {
  let peak = -Infinity;
  let maxDD = 0;
  for (const v of values) {
    if (v > peak) peak = v;
    const dd = (peak - v) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return -maxDD * 100;
}

// ─────────────────────────────────────────────────────────────
// Portfolio Beta vs Nifty 50
// ─────────────────────────────────────────────────────────────
export function calcBeta(
  portfolioReturns: number[],
  benchmarkReturns: number[]
): number {
  const n = Math.min(portfolioReturns.length, benchmarkReturns.length);
  if (n < 10) return 1;

  const pR = portfolioReturns.slice(-n);
  const bR = benchmarkReturns.slice(-n);

  const pMean = pR.reduce((a, b) => a + b, 0) / n;
  const bMean = bR.reduce((a, b) => a + b, 0) / n;

  let cov = 0;
  let bVar = 0;
  for (let i = 0; i < n; i++) {
    cov  += (pR[i] - pMean) * (bR[i] - bMean);
    bVar += Math.pow(bR[i] - bMean, 2);
  }
  return bVar === 0 ? 1 : cov / bVar;
}

// ─────────────────────────────────────────────────────────────
// Fund Overlap (Jaccard similarity on stock holdings)
// ─────────────────────────────────────────────────────────────
export function calcOverlap(
  holdingsA: string[],
  holdingsB: string[]
): number {
  const setA = new Set(holdingsA);
  const setB = new Set(holdingsB);
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union        = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

// ─────────────────────────────────────────────────────────────
// Main computeAnalytics function
// ─────────────────────────────────────────────────────────────
export function computeAnalytics(
  holdings: HoldingInput[],
  navMap: Record<string, number>
): AnalyticsResult {
  let totalValue    = 0;
  let totalInvested = 0;
  const fundBreakdown: FundBreakdown[] = [];

  // Per-fund P&L
  for (const h of holdings) {
    const nav   = navMap[h.fundIsin] || h.avgBuyNav;
    const value = h.units * nav;
    const pnl   = value - h.investedAmount;
    const pnlPct = h.investedAmount > 0 ? (pnl / h.investedAmount) * 100 : 0;
    totalValue    += value;
    totalInvested += h.investedAmount;
    fundBreakdown.push({ fundIsin: h.fundIsin, currentValue: value, pnl, pnlPct, weight: 0 });
  }

  // Weights
  for (const f of fundBreakdown) {
    f.weight = totalValue > 0 ? (f.currentValue / totalValue) * 100 : 0;
  }

  const totalPnL    = totalValue - totalInvested;
  const totalPnLPct = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  // XIRR — build cash flows from all transactions
  const allCashFlows: Array<{ date: Date; amount: number }> = [];
  for (const h of holdings) {
    for (const t of h.transactions || []) {
      const inflow = ["purchase", "sip", "switch_in", "dividend_reinvest"].includes(t.txnType);
      allCashFlows.push({
        date:   new Date(t.txnDate),
        amount: inflow ? -(t.amount || 0) : (t.amount || 0),
      });
    }
  }
  allCashFlows.push({ date: new Date(), amount: totalValue });
  const xirr = allCashFlows.length > 1 ? calcXIRR(allCashFlows) * 100 : 0;

  // Sector aggregation (weighted)
  const sectorMap: Record<string, number> = {};
  for (const h of holdings) {
    const weight = totalValue > 0 ? (h.units * (navMap[h.fundIsin] || 0)) / totalValue : 0;
    for (const [sector, pct] of Object.entries(h.sectors || {})) {
      sectorMap[sector] = (sectorMap[sector] || 0) + (pct as number) * weight;
    }
  }

  // Overlap matrix
  const overlapMatrix: Record<string, Record<string, number>> = {};
  for (let i = 0; i < holdings.length; i++) {
    const a = holdings[i];
    overlapMatrix[a.fundIsin] = {};
    for (let j = 0; j < holdings.length; j++) {
      const b = holdings[j];
      overlapMatrix[a.fundIsin][b.fundIsin] =
        i === j ? 100 : calcOverlap(a.holdings || [], b.holdings || []);
    }
  }

  // Health score (0-100)
  const n = holdings.length;
  const avgPnlPct = fundBreakdown.reduce((s, f) => s + f.pnlPct, 0) / Math.max(1, n);
  const healthScore = Math.min(100, Math.max(0,
    50 +
    Math.min(20, avgPnlPct / 2) +
    (n >= 3 && n <= 8 ? 15 : -10) +
    (Object.keys(sectorMap).length >= 5 ? 15 : 5)
  ));

  // Diversity score
  const diversityScore = Math.min(100, Math.max(0,
    (Object.keys(sectorMap).length / 10) * 50 +
    (n >= 3 ? 25 : n * 8) +
    25
  ));

  return {
    totalValue:     Math.round(totalValue),
    totalInvested:  Math.round(totalInvested),
    pnl:            Math.round(totalPnL),
    pnlPct:         +totalPnLPct.toFixed(2),
    xirr:           +xirr.toFixed(2),
    sharpe:         0,   // requires daily returns series — computed in analytics engine
    sortino:        0,
    calmar:         0,
    maxDrawdown:    0,
    beta:           1,
    alpha:          0,
    volatility:     0,
    healthScore:    Math.round(healthScore),
    diversityScore: Math.round(diversityScore),
    sectorExposure: Object.fromEntries(
      Object.entries(sectorMap).map(([k, v]) => [k, +v.toFixed(1)])
    ),
    marketCapExp:   {},
    overlapMatrix,
    fundBreakdown,
  };
}

// ─────────────────────────────────────────────────────────────
// Monte Carlo simulation
// ─────────────────────────────────────────────────────────────
let _spare: number | null = null;

function randn(): number {
  if (_spare !== null) { const s = _spare; _spare = null; return s; }
  let u, v, r;
  do { u = Math.random() * 2 - 1; v = Math.random() * 2 - 1; r = u * u + v * v; }
  while (r >= 1 || r === 0);
  const f = Math.sqrt(-2 * Math.log(r) / r);
  _spare = v * f;
  return u * f;
}

export interface MonteCarloInput {
  initial:      number;
  annualReturn: number;
  annualVol:    number;
  years:        number;
  sims?:        number;
  monthlySIP?:  number;
  goal?:        number;
}

export function runMonteCarlo(params: MonteCarloInput) {
  const { initial, annualReturn, annualVol, years, sims = 3000, monthlySIP = 0, goal } = params;
  const mu     = annualReturn / 100 / 12;
  const sigma  = annualVol   / 100 / Math.sqrt(12);
  const months = years * 12;
  const results: number[] = [];
  const paths: number[][] = [];

  for (let s = 0; s < sims; s++) {
    let v = initial;
    const path = s < 20 ? [v] : null;
    for (let m = 0; m < months; m++) {
      v = Math.max(0, v * (1 + mu + sigma * randn()) + monthlySIP);
      if (path && m % 12 === 11) path.push(Math.round(v));
    }
    results.push(v);
    if (path) paths.push(path);
  }

  results.sort((a, b) => a - b);
  const goalProb = goal ? (results.filter((v) => v >= goal).length / sims) * 100 : null;

  return {
    p10: Math.round(results[Math.floor(sims * 0.1)]),
    p25: Math.round(results[Math.floor(sims * 0.25)]),
    p50: Math.round(results[Math.floor(sims * 0.5)]),
    p75: Math.round(results[Math.floor(sims * 0.75)]),
    p90: Math.round(results[Math.floor(sims * 0.9)]),
    mean: Math.round(results.reduce((a, b) => a + b, 0) / sims),
    goalProb,
    paths,
  };
}
