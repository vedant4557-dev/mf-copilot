// packages/decision-engine/src/output.ts — the API response shape

export interface DecisionResponse {
  portfolioId:   string;
  generatedAt:   string;
  totalIssues:   number;
  decisions: Array<{
    rank:         number;
    issueScore:   number;
    issueType:    string;
    topAction: {
      verb:           string;
      fundFrom:       string | null;
      fundTo:         string | null;
      amountINR:      number | null;
      expectedImpact: string;
      confidence:     number;
    };
    alternatives: Array<{
      verb:           string;
      expectedImpact: string;
      confidence:     number;
    }>;
    reason:       string;      // deterministic — always populated
    explanation:  string;      // LLM — may be empty if not yet computed
    issueDetail:  object;
  }>;
}

// Example real response — NOT vague, always tied to numbers:
const EXAMPLE_RESPONSE: DecisionResponse = {
  portfolioId:  "uuid-here",
  generatedAt:  "2024-10-31T18:00:00Z",
  totalIssues:  5,
  decisions: [
    {
      rank:       1,
      issueScore: 87,
      issueType:  "tax_harvest",
      topAction: {
        verb:           "HARVEST",
        fundFrom:       "ICICI Pru Technology Fund",
        fundTo:         "Mirae Asset Large Cap Fund",
        amountINR:      48500,
        expectedImpact: "Save ₹9,700 in STCG tax before March 31. 12 days remaining.",
        confidence:     94,
      },
      alternatives: [
        { verb: "REDEEM",   expectedImpact: "Crystallize loss, park in liquid fund",      confidence: 71 },
        { verb: "HOLD",     expectedImpact: "Miss March 31 deadline — opportunity expires", confidence: 12 },
      ],
      reason:      "₹48,500 in paper losses can be crystallized to save ₹9,700 STCG tax. 12 days left before March 31.",
      explanation: "Your technology fund has underperformed its benchmark by 18% this year. Harvesting this loss and rotating into a large-cap fund maintains equity exposure while locking in the tax benefit. The 30-day wash-sale equivalent requires choosing a different category, which Mirae Asset satisfies.",
      issueDetail: { harvestableAmount: 48500, taxSaving: 9700, daysToMarch31: 12 },
    },
  ],
};
