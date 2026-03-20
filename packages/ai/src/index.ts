// packages/ai/src/index.ts

type AIMode = 'diagnose' | 'optimize' | 'chat' | 'classify' | 'summarize' | 'tax' | 'report';

const MODEL_ROUTING: Record<AIMode, { model: string; maxTokens: number }> = {
  // Haiku: fast classification, extraction, short answers
  classify:  { model: 'claude-haiku-4-5-20251001', maxTokens: 150  },
  summarize: { model: 'claude-haiku-4-5-20251001', maxTokens: 300  },
  tax:       { model: 'claude-haiku-4-5-20251001', maxTokens: 500  },

  // Sonnet: complex reasoning, user-facing, multi-step
  diagnose:  { model: 'claude-sonnet-4-6', maxTokens: 600  },
  optimize:  { model: 'claude-sonnet-4-6', maxTokens: 800  },
  chat:      { model: 'claude-sonnet-4-6', maxTokens: 700  },
  report:    { model: 'claude-sonnet-4-6', maxTokens: 1000 },
};

export async function callClaude(
  messages: MessageParam[],
  mode: AIMode,
  systemPrompt: string
): Promise<string> {
  const { model, maxTokens } = MODEL_ROUTING[mode];

  // Hard token budget enforcement — prevent runaway costs
  const truncatedSystem = systemPrompt.slice(0, 4000); // cap system prompt
  const truncatedMessages = messages.map(m => ({
    ...m,
    content: typeof m.content === 'string' ? m.content.slice(0, 2000) : m.content
  }));

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    system: truncatedSystem,
    messages: truncatedMessages,
  });

  // Track cost per mode — emit to your analytics
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  await trackLLMCost({ mode, model, inputTokens, outputTokens, userId: ctx.userId });

  return response.content[0].type === 'text' ? response.content[0].text : '';
}
