/**
 * apps/api/src/routes/ai.ts
 * AI Advisor — RAG-augmented portfolio intelligence
 * Uses Anthropic Claude API + vector search over SEBI / AMFI knowledge base
 */

import { Router, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import Redis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { ragSearch, buildPortfolioContext } from "@mf-copilot/ai";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { validate } from "../middleware/validate";

const router  = Router();
const claude  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const redis   = new Redis(process.env.REDIS_URL!);
const prisma  = new PrismaClient();

const AI_CACHE_TTL = 1800; // 30 min

// ─────────────────────────────────────────────────────────────
// System prompt builder
// ─────────────────────────────────────────────────────────────
function buildSystemPrompt(ragDocs: any[], portfolioCtx: string): string {
  const ragCtx = ragDocs
    .map((d) => `[${d.type.toUpperCase()} — ${d.src}]\n${d.title}: ${d.content}`)
    .join("\n\n");

  return `You are an expert Indian mutual fund analyst and SEBI-compliant AI advisor embedded in the MF Copilot platform.

RULES:
- Always ground your answers in the retrieved documents and portfolio data below.
- Cite specific funds by name (e.g., "Axis Bluechip Fund has an ER of 0.55%").
- Use Indian number format (₹, L, Cr).
- Be concise — max 250 words per response.
- End each response with one concrete, actionable recommendation.
- Never promise specific returns. Add SEBI disclaimer if giving investment advice.

RETRIEVED KNOWLEDGE BASE:
${ragCtx}

USER PORTFOLIO CONTEXT:
${portfolioCtx}`;
}

// ─────────────────────────────────────────────────────────────
// POST /ai/chat — main conversational endpoint
// ─────────────────────────────────────────────────────────────
const ChatSchema = z.object({
  message:      z.string().min(1).max(1000),
  portfolioId:  z.string().uuid().optional(),
  mode:         z.enum(["diagnose", "optimize", "compare", "goal", "tax", "chat"]).default("chat"),
  history:      z.array(z.object({
    role:    z.enum(["user", "assistant"]),
    content: z.string(),
  })).max(20).default([]),
  compareWith:  z.string().optional(), // fund name for comparison
});

router.post(
  "/chat",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 20 }),
  validate(ChatSchema),
  async (req: AuthRequest, res: Response) => {
    const { message, portfolioId, mode, history, compareWith } = req.body;

    // Cache key
    const cacheKey = `ai:${req.user!.id}:${Buffer.from(message).toString("base64").slice(0, 40)}`;
    if (mode !== "chat") {  // don't cache freeform chat
      const cached = await redis.get(cacheKey);
      if (cached) {
        return res.json({ ...JSON.parse(cached), fromCache: true });
      }
    }

    // Build portfolio context
    let portfolioCtx = "No portfolio imported yet.";
    if (portfolioId) {
      const analytics = await redis.get(`portfolio:${portfolioId}:analytics`);
      if (analytics) {
        portfolioCtx = buildPortfolioContext(JSON.parse(analytics));
      }
    }

    // RAG retrieval
    const enrichedQuery = compareWith ? `${message} ${compareWith}` : message;
    const ragDocs = ragSearch(enrichedQuery, 4);

    const systemPrompt = buildSystemPrompt(ragDocs, portfolioCtx);

    // Mode-specific system prompt prefix
    const modePrefix: Record<string, string> = {
      diagnose: "Diagnose this portfolio thoroughly. Cover: strengths, risks, hidden inefficiencies, and 2 specific action items.\n\n",
      optimize: "Recommend specific rebalancing. Format: REMOVE [fund]—reason, KEEP [fund]—reason, ADD [fund] (~X%)—reason.\n\n",
      compare:  `Compare ${compareWith || "the mentioned fund"} against the user's holdings. Cover: returns, cost, overlap, risk.\n\n`,
      goal:     "For the user's stated financial goal, calculate: required monthly SIP, probability of success, fund mix recommendation.\n\n",
      tax:      "Analyze the portfolio for tax efficiency. Identify LTCG/STCG positions, harvesting opportunities, and estimated savings.\n\n",
      chat:     "",
    };

    const finalMessage = (modePrefix[mode] || "") + message;

    // Call Claude
    const response = await claude.messages.create({
      model:      "claude-sonnet-4-20250514",
      max_tokens: 800,
      system:     systemPrompt,
      messages:   [
        ...history,
        { role: "user", content: finalMessage },
      ],
    });

    const text    = response.content[0]?.type === "text" ? response.content[0].text : "";
    const sources = ragDocs.map((d) => ({ title: d.title, src: d.src, type: d.type }));

    const result = { text, sources, mode, tokensUsed: response.usage.output_tokens };

    if (mode !== "chat") {
      await redis.setex(cacheKey, AI_CACHE_TTL, JSON.stringify(result));
    }

    res.json({ ...result, fromCache: false });
  }
);

// ─────────────────────────────────────────────────────────────
// POST /ai/monte-carlo — goal simulation
// ─────────────────────────────────────────────────────────────
const MonteCarloSchema = z.object({
  initial:      z.number().positive(),
  monthlySIP:   z.number().min(0).default(0),
  annualReturn: z.number().min(1).max(50),
  annualVol:    z.number().min(1).max(60),
  years:        z.number().int().min(1).max(30),
  goal:         z.number().positive().optional(),
  sims:         z.number().int().min(1000).max(10000).default(3000),
});

router.post(
  "/monte-carlo",
  requireAuth,
  rateLimit({ windowMs: 60_000, max: 10 }),
  validate(MonteCarloSchema),
  async (req: AuthRequest, res: Response) => {
    // Monte Carlo logic is in the analytics package — imported here
    const { runMonteCarlo } = await import("@mf-copilot/analytics");
    const result = runMonteCarlo(req.body);
    res.json(result);
  }
);

// ─────────────────────────────────────────────────────────────
// GET /ai/knowledge — list RAG knowledge base entries
// ─────────────────────────────────────────────────────────────
router.get(
  "/knowledge",
  requireAuth,
  (req: AuthRequest, res: Response) => {
    const { KNOWLEDGE_BASE } = require("@mf-copilot/ai");
    res.json({
      count: KNOWLEDGE_BASE.length,
      sources: KNOWLEDGE_BASE.map((d: any) => ({
        id: d.id, type: d.type, src: d.src, title: d.title, tags: d.tags,
      })),
    });
  }
);

export default router;
// apps/api/src/routes/ai.ts — replace the handler body
router.post('/chat', requireAuth, validate(ChatSchema), async (req, res) => {
  const { message, portfolioId, mode } = req.body;

  let hash = 'anon';
  if (portfolioId && mode !== 'chat') {
    const holdings = await getHoldings(portfolioId);            // cheap DB read
    hash = portfolioHash(holdings, mode);
  }

  const { result, fromCache } = await cachedAI(hash, mode, () =>
    callClaude(buildPrompt(mode, message, portfolioCtx))
  );

  res.json({ ...result, fromCache, cacheKey: `ai:${mode}:${hash}` });
});
// apps/api/src/routes/ai.ts — add streaming endpoint
router.post('/chat/stream', requireAuth, validate(ChatSchema), async (req, res) => {
  // Check cache first — if hit, stream the cached response (instant)
  const { portfolioId, mode, message } = req.body;
  const hash = portfolioId ? portfolioHash(await getHoldings(portfolioId), mode) : 'anon';
  const cacheKey = `ai:${mode}:${hash}`;
  const cached = await redis.get(cacheKey);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  if (cached) {
    // Stream cached response word by word for natural feel
    const words = JSON.parse(cached).text.split(' ');
    for (const word of words) {
      res.write(`data: ${JSON.stringify({ delta: word + ' ' })}\n\n`);
      await new Promise(r => setTimeout(r, 20)); // 20ms per word ≈ reading speed
    }
    res.write(`data: ${JSON.stringify({ done: true, fromCache: true })}\n\n`);
    res.end();
    return;
  }

  // Live stream from Claude
  const { model, maxTokens } = MODEL_ROUTING[mode];
  const stream = await anthropic.messages.stream({
    model, max_tokens: maxTokens,
    system: buildSystemPrompt(portfolioCtx, ragDocs),
    messages: [{ role: 'user', content: message }],
  });

  let fullText = '';
  stream.on('text', (delta) => {
    fullText += delta;
    res.write(`data: ${JSON.stringify({ delta })}\n\n`);
  });

  stream.on('finalMessage', async () => {
    // Cache the full response for next time
    if (TTL[mode] > 0) await redis.setex(cacheKey, TTL[mode], JSON.stringify({ text: fullText }));
    res.write(`data: ${JSON.stringify({ done: true, fromCache: false })}\n\n`);
    res.end();
  });
});
