/**
 * Rephrase Cluster C Q&A questions to be action-oriented so they embed
 * closer to practical prompts (e.g. "write a search prompt").
 *
 * Updates question text + re-embeds in place — answers are unchanged.
 *
 * Usage:
 *   npx tsx scripts/rephrase-cluster-c.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

const EMBED_MODEL = 'gemini-embedding-001'

// Maps current question → new question for each Cluster C item
const REPHRASES: Record<string, string> = {
  'What is RAG (Retrieval-Augmented Generation)?':
    'How should I write a prompt for a system that searches and retrieves relevant documents to answer a question?',
  'What is an embedding and how does it represent meaning?':
    'How should I design a system that stores and retrieves knowledge based on how semantically similar things are?',
  'What is cosine similarity and how is it used to rank search results?':
    'How does a retrieval system decide which stored items are most relevant to a query?',
}

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

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('=== Rephrase Cluster C: action-oriented questions ===\n')

  // Fetch all items to find the ones that need rephrasing
  const { data: allItems, error } = await supabase
    .from('qa_items')
    .select('id, question')

  if (error) throw new Error(error.message)

  const targets = (allItems ?? []).filter((item) => REPHRASES[item.question])

  if (targets.length === 0) {
    console.log('No matching items found — already rephrased or not present.')
    return
  }

  console.log(`Found ${targets.length} item(s) to rephrase:\n`)

  for (const item of targets) {
    const newQuestion = REPHRASES[item.question]
    console.log(`  ${item.id.slice(0, 8)}…`)
    console.log(`  OLD: ${item.question}`)
    console.log(`  NEW: ${newQuestion}`)
    console.log(`  Embedding new question...`)

    const newEmbedding = await embed(newQuestion)

    const { error: updateError } = await supabase
      .from('qa_items')
      .update({ question: newQuestion, embedding: newEmbedding })
      .eq('id', item.id)

    if (updateError) throw new Error(`Update error: ${updateError.message}`)

    console.log(`  ✅ Updated\n`)
  }

  console.log('Done. Run npm run diagnostic to verify the new retrieval rankings.')
}

main().catch((e: Error) => {
  console.error('\n❌ Rephrase failed:', e.message)
  process.exit(1)
})
