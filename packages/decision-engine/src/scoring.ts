// packages/decision-engine/src/scoring.ts

export interface ScoreWeights {
  severity:  number;  // default 0.4
  exposure:  number;  // default 0.3
  urgency:   number;  // default 0.2
  taxImpact: number;  // default 0.1
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  severity: 0.4, exposure: 0.3, urgency: 0.2, taxImpact: 0.1
};

export function scoreIssue(issue: Issue, weights = DEFAULT_WEIGHTS): number {
  const raw =
    issue.severity  * weights.severity  +
    issue.exposure  * weights.exposure  +
    issue.urgency   * weights.urgency   +
    issue.taxImpact * weights.taxImpact;

  // Normalize to 0–100
  const maxPossible =
    100 * weights.severity + 100 * weights.exposure +
    100 * weights.urgency  + 100 * weights.taxImpact;

  return Math.round((raw / maxPossible) * 100);
}

// Explainability: which component drove the score
export function explainScore(issue: Issue, weights = DEFAULT_WEIGHTS) {
  const components = [
    { name: 'severity',   value: issue.severity,   weight: weights.severity,   contribution: issue.severity  * weights.severity  },
    { name: 'exposure',   value: issue.exposure,   weight: weights.exposure,   contribution: issue.exposure  * weights.exposure  },
    { name: 'urgency',    value: issue.urgency,     weight: weights.urgency,    contribution: issue.urgency   * weights.urgency   },
    { name: 'tax impact', value: issue.taxImpact,   weight: weights.taxImpact,  contribution: issue.taxImpact * weights.taxImpact },
  ].sort((a, b) => b.contribution - a.contribution);

  return {
    totalScore:   scoreIssue(issue, weights),
    topDriver:    components[0].name,
    breakdown:    components,
  };
}

// Future ML hook: weights can be loaded from DB per user segment
export async function loadUserWeights(userId: string): Promise<ScoreWeights> {
  // Phase 1: return defaults
  // Phase 2: query user_weight_profiles table trained on recommendation_outcomes
  return DEFAULT_WEIGHTS;
}
