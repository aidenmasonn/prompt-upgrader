/**
 * Retrieval Diagnostic: shows similarity scores for all Q&A items against test prompts.
 *
 * Usage (from project root):
 *   npx tsx scripts/retrieval-diagnostic.ts
 *
 * Requires .env.local with GEMINI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

// ── Config ───────────────────────────────────────────────────────────────────

const EMBED_MODEL = 'gemini-embedding-001'

const TEST_PROMPTS = [
  'Write a prompt that asks an AI to improve another prompt',
  'Write a system prompt for a coding assistant that helps developers debug Python code',
  'Write a prompt to search and summarize relevant documents',
  'Help me design a tool that remembers things I\'ve learned',
  'Make this better: help me write emails',
]

// Short labels for the table
const PROMPT_LABELS = ['T1:meta-prompt', 'T2:debug-assistant', 'T3:search-docs', 'T4:memory-tool', 'T5:email-helper']

// ── Embed helper (standalone, no Next.js imports) ────────────────────────────

async function embed(text: string): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY!
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: { parts: [{ text }] } }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Gemini embed error ${res.status}: ${err}`)
  }

  const data = (await res.json()) as { embedding: { values: number[] } }
  return data.embedding.values
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // 1. Fetch all Q&A items from the database
  console.log('=== Retrieval Diagnostic ===\n')
  console.log('1. Fetching all Q&A items from database...\n')

  const { data: allItems, error } = await supabase
    .from('qa_items')
    .select('id, source, question, tags, created_at')
    .order('created_at', { ascending: true })

  if (error) throw new Error(`Supabase error: ${error.message}`)
  if (!allItems || allItems.length === 0) {
    console.log('No Q&A items found in database. Nothing to diagnose.')
    return
  }

  console.log(`Found ${allItems.length} Q&A items:\n`)
  console.log('─'.repeat(90))
  for (const item of allItems) {
    const id = item.id.slice(0, 8)
    const tags = item.tags?.length > 0 ? item.tags.join(', ') : '(none)'
    console.log(`  ${id}…  ${item.question.slice(0, 60).padEnd(60)}  tags: ${tags}`)
  }
  console.log('─'.repeat(90))

  // 2. Embed each test prompt and retrieve ALL items ranked by similarity
  console.log('\n2. Embedding test prompts and retrieving similarity scores...\n')

  // We request all items (match_count = total items) to see every score
  const matchCount = allItems.length

  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const prompt = TEST_PROMPTS[i]
    const label = PROMPT_LABELS[i]

    console.log(`\n── ${label} ──`)
    console.log(`   "${prompt}"`)
    console.log('')

    const embedding = await embed(prompt)

    const { data: matches, error: rpcError } = await supabase.rpc('match_qa_items', {
      query_embedding: embedding,
      match_count: matchCount,
    })

    if (rpcError) {
      console.log(`   ERROR: ${rpcError.message}`)
      continue
    }

    // Print all results with similarity scores
    console.log('   Rank  Score   ID         Question')
    console.log('   ' + '─'.repeat(80))

    for (let j = 0; j < matches.length; j++) {
      const m = matches[j]
      const rank = (j + 1).toString().padStart(4)
      const score = m.similarity.toFixed(4).padStart(7)
      const id = m.id.slice(0, 8)
      const q = m.question.slice(0, 55)
      const marker = j < 3 ? ' ← TOP 3' : ''
      console.log(`   ${rank}  ${score}  ${id}…  ${q}${marker}`)
    }

    // Show the gap between rank 3 and rank 4
    if (matches.length >= 4) {
      const gap = matches[2].similarity - matches[3].similarity
      console.log(`\n   Gap between #3 and #4: ${gap.toFixed(4)}`)
    }
  }

  // 3. Summary: which items appear most/least in top-3
  console.log('\n\n=== SUMMARY: Top-3 appearance frequency ===\n')

  const freq: Record<string, { count: number; question: string }> = {}
  for (const item of allItems) {
    freq[item.id] = { count: 0, question: item.question }
  }

  for (let i = 0; i < TEST_PROMPTS.length; i++) {
    const embedding = await embed(TEST_PROMPTS[i])
    const { data: matches } = await supabase.rpc('match_qa_items', {
      query_embedding: embedding,
      match_count: 3,
    })
    if (matches) {
      for (const m of matches) {
        if (freq[m.id]) freq[m.id].count++
      }
    }
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count)
  for (const [id, { count, question }] of sorted) {
    const bar = '█'.repeat(count) + '░'.repeat(5 - count)
    console.log(`  ${id.slice(0, 8)}…  ${bar}  ${count}/5  ${question.slice(0, 55)}`)
  }

  // Items that never appear
  const neverRetrieved = sorted.filter(([, { count }]) => count === 0)
  if (neverRetrieved.length > 0) {
    console.log('\n  ⚠ Never retrieved in top-3:')
    for (const [id, { question }] of neverRetrieved) {
      console.log(`    ${id.slice(0, 8)}…  ${question}`)
    }
  }

  console.log('\n✅ Diagnostic complete.')
}

main().catch((e: Error) => {
  console.error('\n❌ Diagnostic failed:', e.message)
  process.exit(1)
})
