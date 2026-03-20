// packages/ai/src/rag.ts

// PRECOMPUTED AT SERVER STARTUP — not per request
let EMBEDDED_KB: { doc: KBDoc; vector: number[] }[] = [];

export async function initRAG() {
  // Called once in apps/api/src/index.ts on startup
  // Vectors stored in Redis, loaded into memory
  const cached = await redis.get('rag:vectors:v2');
  if (cached) {
    EMBEDDED_KB = JSON.parse(cached);
    return;
  }
  // First-time embed all documents
  EMBEDDED_KB = await Promise.all(
    KNOWLEDGE_BASE.map(async (doc) => ({
      doc,
      vector: await getEmbedding(`${doc.title} ${doc.content}`)
    }))
  );
  await redis.setex('rag:vectors:v2', 30 * 86400, JSON.stringify(EMBEDDED_KB)); // 30d cache
  console.log('RAG vectors initialized:', EMBEDDED_KB.length, 'documents');
}

// BM25 pre-filter — runs in <1ms, no I/O
function bm25Score(query: string, doc: KBDoc): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  const docTerms = `${doc.title} ${doc.tags.join(' ')} ${doc.content}`.toLowerCase().split(/\s+/);
  return queryTerms.reduce((score, term) => {
    const freq = docTerms.filter(t => t.includes(term)).length;
    return score + (freq > 0 ? 1 + Math.log(freq) : 0);
  }, 0);
}

export async function ragSearch(query: string, k = 4): Promise<KBDoc[]> {
  // Stage 1: BM25 keyword filter — sync, <1ms, narrows 12 → 5 candidates
  const candidates = EMBEDDED_KB
    .map(e => ({ ...e, bm25: bm25Score(query, e.doc) }))
    .filter(e => e.bm25 > 0)
    .sort((a, b) => b.bm25 - a.bm25)
    .slice(0, 6);

  if (candidates.length === 0) return EMBEDDED_KB.slice(0, k).map(e => e.doc);

  // Stage 2: Cosine on reduced candidate set only (5 vectors, not 12)
  const queryVector = await getEmbedding(query);  // ~180ms, only call now
  return candidates
    .map(c => ({ doc: c.doc, sim: cosineSim(queryVector, c.vector) }))
    .sort((a, b) => b.sim - a.sim)
    .slice(0, k)
    .map(c => c.doc);
}

// In the AI call: run RAG and portfolio context fetch IN PARALLEL
export async function callRAGAI(query: string, portfolioId: string, mode: string) {
  const [ragDocs, portfolioCtx] = await Promise.all([
    ragSearch(query),                          // RAG (was serial before)
    getPortfolioContext(portfolioId),          // DB read (was serial before)
  ]);
  // Now inject both into prompt simultaneously
  return callClaude(buildPrompt(mode, query, portfolioCtx, ragDocs));
}
