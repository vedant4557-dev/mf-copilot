// packages/ai/src/cost-tracker.ts
// Writes to a cost_tracking table — lets you see spend per user, per mode
async function trackLLMCost(data: LLMCostEvent) {
  const SONNET_INPUT  = 0.000003;   // $3 per 1M input tokens
  const SONNET_OUTPUT = 0.000015;   // $15 per 1M output tokens
  const HAIKU_INPUT   = 0.00000025; // $0.25 per 1M
  const HAIKU_OUTPUT  = 0.00000125; // $1.25 per 1M

  const isHaiku = data.model.includes('haiku');
  const costUSD = isHaiku
    ? data.inputTokens * HAIKU_INPUT + data.outputTokens * HAIKU_OUTPUT
    : data.inputTokens * SONNET_INPUT + data.outputTokens * SONNET_OUTPUT;

  await redis.incrByFloat(`cost:daily:${new Date().toISOString().slice(0,10)}`, costUSD);
  await redis.incrByFloat(`cost:user:${data.userId}:monthly`, costUSD);
}
