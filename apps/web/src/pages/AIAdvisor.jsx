// apps/web/src/pages/AIAdvisor.jsx — streaming consumer
async function streamAIResponse(payload, onDelta, onDone) {
  const res = await fetch('/api/ai/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split('\n').filter(l => l.startsWith('data: '));
    for (const line of lines) {
      const data = JSON.parse(line.slice(6));
      if (data.delta) onDelta(data.delta);
      if (data.done) onDone(data.fromCache);
    }
  }
}

// In component:
const [aiText, setAiText] = useState('');
const [streaming, setStreaming] = useState(false);

async function sendMessage(msg) {
  setAiText('');
  setStreaming(true);
  await streamAIResponse(
    { message: msg, portfolioId, mode },
    (delta) => setAiText(prev => prev + delta),
    (fromCache) => setStreaming(false)
  );
}
