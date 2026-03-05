# Agent Observability

Instrument, monitor, and debug the prompt-upgrader pipeline with structured logging and tracing.

## What to observe

The pipeline has three stages that can each fail independently:

```
User prompt → [EMBED] → [RETRIEVE] → [GENERATE] → Upgraded prompt
```

For each stage, capture: input, output, latency, cost, and error state.

## Structured trace logging

Add trace logging to `app/api/upgrade/route.ts`:

```typescript
interface PipelineTrace {
  traceId: string
  timestamp: string
  stage: 'embed' | 'retrieve' | 'generate'
  input: unknown
  output: unknown
  latencyMs: number
  error?: string
  meta?: Record<string, unknown>
}

// Write to traces/ directory (gitignored)
async function logTrace(trace: PipelineTrace) {
  const file = `traces/${new Date().toISOString().slice(0,10)}.jsonl`
  await fs.appendFile(file, JSON.stringify(trace) + '\n')
}
```

## Stage 1: Embedding observability

```typescript
const embedStart = Date.now()
let embedding: number[]
try {
  embedding = await embed(prompt)
  await logTrace({
    traceId, timestamp: new Date().toISOString(),
    stage: 'embed',
    input: { text: prompt.slice(0, 100), length: prompt.length },
    output: { dimensions: embedding.length },
    latencyMs: Date.now() - embedStart,
  })
} catch (err) {
  await logTrace({ traceId, timestamp: ..., stage: 'embed',
    input: { text: prompt.slice(0,100) }, output: null,
    latencyMs: Date.now() - embedStart, error: String(err) })
  throw err
}
```

**Key metrics to watch:**
- `dimensions`: should always be 3072 — alert if different (model change broke embedding)
- `latencyMs`: Gemini embedding is typically 200-500ms; > 2000ms = degraded service
- Error rate: any non-zero rate needs investigation

## Stage 2: Retrieval observability

```typescript
const retrieveStart = Date.now()
const { data: matches, error } = await supabase.rpc('match_qa_items', {
  query_embedding: embedding,
  match_count: 3,
})

await logTrace({
  traceId, timestamp: new Date().toISOString(),
  stage: 'retrieve',
  input: { embeddingDimensions: embedding.length },
  output: {
    count: matches?.length ?? 0,
    topSimilarity: matches?.[0]?.similarity ?? null,
    bottomSimilarity: matches?.[matches.length-1]?.similarity ?? null,
    ids: matches?.map(m => m.id.slice(0,8)) ?? [],
  },
  latencyMs: Date.now() - retrieveStart,
  error: error?.message,
})
```

**Key metrics to watch:**
- `count` < 3: database has fewer than 3 items — add seed Q&As
- `topSimilarity` < 0.6: poor match quality — run `/evals-skills:evaluate-rag`
- `topSimilarity` > 0.99: possible duplicate items in database — run `scripts/cleanup-duplicates.ts`
- `latencyMs` > 500ms: check pgvector index (see `/rag-architect`)

## Stage 3: Generation observability

```typescript
const genStart = Date.now()
const result = await upgradePrompt(rawPrompt, matches ?? [])

await logTrace({
  traceId, timestamp: new Date().toISOString(),
  stage: 'generate',
  input: {
    promptLength: rawPrompt.length,
    retrievedCount: matches?.length ?? 0,
    model: process.env.GEMINI_MODEL,
  },
  output: {
    upgradedLength: result.upgraded.length,
    rationaleCount: result.rationale.length,
    usedMemoryCount: result.usedMemory.length,
    citedCount: result.rationale.filter(b =>
      /^\[[0-9a-f-]{36}\]/i.test(b)
    ).length,
  },
  latencyMs: Date.now() - genStart,
})
```

**Key metrics to watch:**
- `usedMemoryCount` = 0 despite good retrieval: model is ignoring context
- `citedCount` / `rationaleCount` < 0.5: low citation rate (see `/evals-skills:evaluate-rag`)
- `upgradedLength` < 100: model may have returned empty or malformed output
- `latencyMs` > 10000ms: Gemini under load; consider retry with backoff

## Trace analysis script

Add `scripts/trace-analysis.ts`:

```typescript
// npm run traces
// Reads all JSONL trace files and prints a summary dashboard

const stages = ['embed', 'retrieve', 'generate'] as const

for (const stage of stages) {
  const traces = allTraces.filter(t => t.stage === stage)
  const errors = traces.filter(t => t.error)
  const avgLatency = traces.reduce((sum, t) => sum + t.latencyMs, 0) / traces.length

  console.log(`\n── ${stage} ──`)
  console.log(`  Total: ${traces.length}  Errors: ${errors.length} (${Math.round(errors.length/traces.length*100)}%)`)
  console.log(`  Avg latency: ${Math.round(avgLatency)}ms`)

  if (stage === 'retrieve') {
    const avgTopSim = traces.reduce((sum, t) => sum + (t.output?.topSimilarity ?? 0), 0) / traces.length
    console.log(`  Avg top similarity: ${avgTopSim.toFixed(3)}`)
  }

  if (stage === 'generate') {
    const avgCitationRate = traces.reduce((sum, t) =>
      sum + (t.output?.citedCount / t.output?.rationaleCount || 0), 0) / traces.length
    console.log(`  Avg citation rate: ${Math.round(avgCitationRate * 100)}%`)
  }
}
```

## Add to package.json

```json
"scripts": {
  "traces": "tsx scripts/trace-analysis.ts"
}
```

## Gitignore traces directory

```bash
echo "traces/" >> .gitignore
mkdir -p traces
echo "# Trace logs (generated at runtime)" > traces/.gitkeep
```

## Alert conditions

These conditions should surface in the trace summary and trigger investigation:

| Condition | Threshold | Action |
|---|---|---|
| Embed error rate | > 1% | Check Gemini API key, quota |
| Retrieve count < 3 | > 5% of requests | Add Q&A items to database |
| Top similarity < 0.6 | > 30% of requests | Run `/evals-skills:evaluate-rag` |
| Generation latency | > 15s | Check Gemini model availability |
| Citation rate | < 40% overall | Run `/evals-skills:error-analysis` |
| usedMemory = 0 | > 20% of requests | Inspect generation prompt |

_Synthesized from nexus-labs-automation agent-observability patterns, adapted for this stack_
