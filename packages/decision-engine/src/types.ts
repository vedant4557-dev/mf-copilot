// packages/decision-engine/src/types.ts

export type IssueType =
  | 'high_overlap'      // Jaccard > 60% between two funds
  | 'high_cost'         // weighted ER > 1.0%
  | 'large_cap_heavy'   // >65% in large-cap
  | 'small_cap_excess'  // >30% in small-cap (risk for conservative profiles)
  | 'health_decline'    // health score dropped >10pts in 7d
  | 'goal_off_track'    // SIP needed > SIP current by >20%
  | 'tax_harvest'       // harvestable loss > ₹10,000
  | 'allocation_drift'  // fund drifted >10% from target
  | 'inactivity'        // no login >21 days
  | 'high_drawdown';    // max drawdown > -25%

export interface Issue {
  type:         IssueType;
  severity:     number;     // 0–100
  exposure:     number;     // portfolio % affected, 0–100
  urgency:      number;     // 0–100 (tax deadline, fiscal year end, etc.)
  taxImpact:    number;     // estimated ₹ tax saving or cost, normalized 0–100
  metadata:     Record<string, unknown>;  // fund names, amounts, exact values
}

export interface Action {
  id:             string;
  verb:           'REDEEM' | 'SWITCH' | 'INCREASE_SIP' | 'REDUCE_SIP' | 'HOLD' | 'HARVEST';
  fundFrom:       string | null;
  fundTo:         string | null;
  amountINR:      number | null;
  sipDeltaINR:    number | null;
  expectedImpact: string;   // deterministic: "+1.2% CAGR est."
  confidence:     number;   // 0–100
}

export interface Decision {
  portfolioId:  string;
  userId:       string;
  computedAt:   Date;
  topAction:    Action;
  alternatives: Action[];   // exactly 2
  reason:       string;     // deterministic sentence, no LLM
  explanation:  string;     // LLM-generated, cached
  issueScore:   number;     // composite 0–100
  issue:        Issue;
}
