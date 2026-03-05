/**
 * Eval: measures retrieval accuracy and rubric adherence across test prompts.
 *
 * Usage (with dev server running on localhost:3000):
 *   npx tsx scripts/eval.ts
 *   BASE_URL=http://localhost:3001 npx tsx scripts/eval.ts
 *
 * Requires .env.local + dev server running.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000'
const EMBED_MODEL = 'gemini-embedding-001'

// ── Test cases ────────────────────────────────────────────────────────────────
// Each test case lists the prompt and the Q&A question substrings we expect in top-3.
// Substrings are matched case-insensitively against the question field.

const TEST_CASES = [
  {
    label: 'T1: meta-prompt',
    prompt: 'Write a prompt that asks an AI to improve another prompt',
    expectedQuestions: ['what makes an AI prompt effective'],
  },
  {
    label: 'T2: debug-assistant',
    prompt: 'Write a system prompt for a coding assistant that helps developers debug Python code',
    expectedQuestions: ['what is a system prompt', 'when should you include an example'],
  },
  {
    label: 'T3: search-docs',
    prompt: 'Write a prompt to search and summarize relevant documents',
    expectedQuestions: ['write a prompt for a system that searches and retrieves'],
  },
  {
    label: 'T4: memory-tool',
    prompt: "Help me design a tool that remembers things I've learned",
    expectedQuestions: ['design a system that stores and retrieves', 'how many Q&A items'],
  },
  {
    label: 'T5: email-helper',
    prompt: 'Make this better: help me write emails',
    expectedQuestions: ['what makes an AI prompt effective'],
  },
]

// Rubric elements to check in the upgraded prompt (case-insensitive keyword heuristics)
const RUBRIC_CHECKS = [
  { name: 'Objective', patterns: ['objective', 'goal', 'your task', 'your job', 'you are'] },
  { name: 'Constraints', patterns: ['constraint', 'do not', "don't", 'avoid', 'must', 'only'] },
  { name: 'Output format', patterns: ['output format', 'return', 'format:', 'structure', 'json', 'bullets', 'prose'] },
  { name: 'Eval criteria', patterns: ['evaluation criteria', 'a good', 'good response', 'success', 'quality'] },
  { name: 'Assumptions', patterns: ['assumption', 'assume', 'assuming'] },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  })
  if (!res.ok) throw new Error(`Embed error ${res.status}: ${await res.text()}`)
  const data = (await res.json()) as { embedding: { values: number[] } }
  return data.embedding.values
}

async function upgradeViaApi(prompt: string) {
  const res = await fetch(`${BASE_URL}/api/upgrade`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
  if (!res.ok) {
    const err = await res.json() as { error: string }
    throw new Error(`Upgrade API error: ${err.error}`)
  }
  return res.json() as Promise<{
    upgraded: string
    rationale: string[]
    usedMemory: Array<{ id: string; question: string }>
  }>
}

function checkRubric(upgradedText: string): { name: string; pass: boolean }[] {
  const lower = upgradedText.toLowerCase()
  return RUBRIC_CHECKS.map(({ name, patterns }) => ({
    name,
    pass: patterns.some((p) => lower.includes(p.toLowerCase())),
  }))
}

function matchesExpected(retrieved: Array<{ question: string }>, expectedSubstrings: string[]): string[] {
  return expectedSubstrings.filter((expected) =>
    retrieved.some((r) => r.question.toLowerCase().includes(expected.toLowerCase()))
  )
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('=== Eval: Retrieval Accuracy + Rubric Adherence ===\n')
  console.log(`Target: ${BASE_URL}\n`)

  let totalRetrievalExpected = 0
  let totalRetrievalHit = 0
  let totalRubricChecks = 0
  let totalRubricPass = 0
  let totalCitedBullets = 0
  let totalBullets = 0

  for (const tc of TEST_CASES) {
    console.log(`\n── ${tc.label} ──`)
    console.log(`   Prompt: "${tc.prompt}"`)

    // 1. Retrieval accuracy
    const embedding = await embed(tc.prompt)
    const { data: matches, error } = await supabase.rpc('match_qa_items', {
      query_embedding: embedding,
      match_count: 3,
    })
    if (error) throw new Error(`Supabase error: ${error.message}`)

    const hits = matchesExpected(matches ?? [], tc.expectedQuestions)
    const retrievalScore = `${hits.length}/${tc.expectedQuestions.length}`

    console.log(`\n   Retrieval  ${retrievalScore}`)
    for (const expected of tc.expectedQuestions) {
      const hit = hits.includes(expected)
      console.log(`     ${hit ? '✓' : '✗'} "${expected}"`)
    }

    totalRetrievalExpected += tc.expectedQuestions.length
    totalRetrievalHit += hits.length

    // 2. Run upgrade via API
    let upgraded: Awaited<ReturnType<typeof upgradeViaApi>> | null = null
    try {
      upgraded = await upgradeViaApi(tc.prompt)
    } catch (e) {
      console.log(`\n   Upgrade API: FAILED — ${(e as Error).message}`)
      console.log('   (Is the dev server running? Start it with: npm run dev)')
      continue
    }

    // 3. Rubric adherence
    const rubricResults = checkRubric(upgraded.upgraded)
    const rubricPass = rubricResults.filter((r) => r.pass).length
    console.log(`\n   Rubric     ${rubricPass}/${rubricResults.length}`)
    for (const { name, pass } of rubricResults) {
      console.log(`     ${pass ? '✓' : '✗'} ${name}`)
    }
    totalRubricChecks += rubricResults.length
    totalRubricPass += rubricPass

    // 4. Citation traceability — how many rationale bullets cite a memory item
    // The model uses [uuid] or [memory_id: uuid] format; match either
    const UUID_PATTERN = /^\[[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\]/i
    const bullets = upgraded.rationale
    const citedCount = bullets.filter(
      (b) => UUID_PATTERN.test(b) || b.toLowerCase().startsWith('[memory_id:')
    ).length
    console.log(`\n   Rationale  ${citedCount}/${bullets.length} bullets cite a memory item`)
    totalBullets += bullets.length
    totalCitedBullets += citedCount

    // Show used memory
    if (upgraded.usedMemory.length > 0) {
      console.log(`   Used memory: ${upgraded.usedMemory.map((m) => m.id.slice(0, 8) + '…').join(', ')}`)
    }
  }

  // Summary scorecard
  const retrievalPct = Math.round((totalRetrievalHit / totalRetrievalExpected) * 100)
  const rubricPct = Math.round((totalRubricPass / totalRubricChecks) * 100)
  const citationPct = totalBullets > 0 ? Math.round((totalCitedBullets / totalBullets) * 100) : 0

  console.log('\n' + '═'.repeat(50))
  console.log('SCORECARD')
  console.log('═'.repeat(50))
  console.log(`  Retrieval accuracy   ${totalRetrievalHit}/${totalRetrievalExpected}  ${retrievalPct}%  (target: ≥70%)`)
  console.log(`  Rubric adherence     ${totalRubricPass}/${totalRubricChecks}  ${rubricPct}%   (target: ≥85%)`)
  console.log(`  Citation rate        ${totalCitedBullets}/${totalBullets}  ${citationPct}%   (target: ≥60%)`)
  console.log('═'.repeat(50))

  const allPass = retrievalPct >= 70 && rubricPct >= 85 && citationPct >= 60
  console.log(allPass ? '\n✅ All targets met.' : '\n⚠  Some targets not met. See details above.')
}

main().catch((e: Error) => {
  console.error('\n❌ Eval failed:', e.message)
  process.exit(1)
})
