/**
 * Smoke test: end-to-end check of the Prompt Memory + Upgrader.
 *
 * Usage (with dev server running on localhost:3000):
 *   npx ts-node --esm scripts/smoke-test.ts
 *   BASE_URL=http://localhost:3001 npx ts-node --esm scripts/smoke-test.ts
 */

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'

const QA_ITEMS = [
  {
    source: 'OpenAI docs',
    question: 'What is RAG (Retrieval-Augmented Generation)?',
    answer:
      'RAG is a technique that augments a language model with a retrieval system. At inference time, the model retrieves relevant documents from a knowledge base and uses them as context to produce more accurate, grounded responses—without retraining the model.',
    tags: ['RAG', 'retrieval', 'embeddings'],
  },
  {
    source: 'Supabase docs',
    question: 'What is pgvector and how does it enable similarity search?',
    answer:
      'pgvector is a PostgreSQL extension that adds a VECTOR data type and similarity operators (<=> for cosine distance, <-> for Euclidean). It lets you store embedding vectors alongside your data and run nearest-neighbour queries directly in SQL.',
    tags: ['pgvector', 'supabase', 'vector-search'],
  },
  {
    source: 'Prompting guide',
    question: 'What makes a system prompt effective?',
    answer:
      'An effective system prompt: (1) clearly defines the AI role and persona, (2) specifies the desired output format, (3) provides necessary background context, (4) states constraints and guardrails, and (5) optionally includes a short example. Specificity beats length.',
    tags: ['system-prompt', 'prompting', 'LLM'],
  },
]

// ── Helpers ────────────────────────────────────────────────────────────────────

async function saveQA(qa: (typeof QA_ITEMS)[0]) {
  const res = await fetch(`${BASE_URL}/api/qa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(qa),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Save Q&A failed: ${err.error}`)
  }
  return res.json() as Promise<{ id: string; question: string }>
}

async function upgrade(prompt: string) {
  const res = await fetch(`${BASE_URL}/api/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Upgrade failed: ${err.error}`)
  }
  return res.json() as Promise<{
    upgraded: string
    rationale: string[]
    usedMemory: Array<{ id: string; question: string }>
  }>
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Prompt Memory + Upgrader — Smoke Test ===')
  console.log(`Target: ${BASE_URL}\n`)

  // Step 1 — Save Q&A items
  console.log('1. Saving 3 Q&A items to memory...')
  for (const qa of QA_ITEMS) {
    const saved = await saveQA(qa)
    console.log(`   ✓ "${qa.question.slice(0, 55)}…" → id: ${saved.id.slice(0, 8)}…`)
  }

  // Step 2 — Upgrade a prompt
  const testPrompt =
    'Write code that searches a database for items similar to a text query.'
  console.log(`\n2. Upgrading prompt:\n   "${testPrompt}"\n`)

  const result = await upgrade(testPrompt)

  // Output
  console.log('── A) UPGRADED PROMPT ──────────────────────────────────────────')
  console.log(result.upgraded)

  console.log('\n── B) RATIONALE ────────────────────────────────────────────────')
  result.rationale.forEach((r, i) => console.log(`  ${i + 1}. ${r}`))

  console.log('\n── C) USED MEMORY ──────────────────────────────────────────────')
  if (result.usedMemory.length === 0) {
    console.log('  (none)')
  } else {
    result.usedMemory.forEach((m) =>
      console.log(`  [${m.id.slice(0, 8)}…] ${m.question}`)
    )
  }

  console.log('\n✅ Smoke test passed!')
}

main().catch((e: Error) => {
  console.error('\n❌ Smoke test failed:', e.message)
  process.exit(1)
})
