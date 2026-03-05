/**
 * One-time cleanup: removes smoke-test Q&A items inserted before the real data.
 *
 * Usage:
 *   npx tsx scripts/cleanup-duplicates.ts
 */

import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'

// These are the 3 smoke-test items (created at 14:56, before the real Q&As at 15:00)
const IDS_TO_DELETE = [
  'f281ff0c-2b6f-4bee-9af7-cd6e79f7bf68', // duplicate "What is RAG?" (smoke test)
  '7052bbd8-3667-4615-90ef-2cf29c92d2bd', // "What is pgvector?" (smoke test, not in real 10)
  'c42c586e-353a-43c6-8d56-81351745f3fe', // duplicate "What makes a system prompt effective?" (smoke test)
]

async function main() {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  console.log('=== Cleanup: Removing smoke-test duplicates ===\n')

  // Show what we are about to delete
  const { data: toDelete, error: fetchError } = await supabase
    .from('qa_items')
    .select('id, question, created_at')
    .in('id', IDS_TO_DELETE)

  if (fetchError) throw new Error(`Fetch error: ${fetchError.message}`)

  if (!toDelete || toDelete.length === 0) {
    console.log('Nothing to delete — items may already be gone.')
    return
  }

  console.log('Will delete:')
  for (const item of toDelete) {
    console.log(`  ✗ ${item.id.slice(0, 8)}…  ${item.question}`)
  }

  // Delete
  const { error: deleteError } = await supabase
    .from('qa_items')
    .delete()
    .in('id', IDS_TO_DELETE)

  if (deleteError) throw new Error(`Delete error: ${deleteError.message}`)

  console.log(`\n✅ Deleted ${toDelete.length} item(s). Database now has your real 10 Q&As only.`)
}

main().catch((e: Error) => {
  console.error('\n❌ Cleanup failed:', e.message)
  process.exit(1)
})
