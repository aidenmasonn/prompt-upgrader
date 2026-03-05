/**
 * import-mymind.ts — Import a MyMind export into Prompt Upgrader memory.
 *
 * MyMind (mymind.com) lets you export your saved items as a JSON file.
 * To export: MyMind → Settings → Export → Download JSON
 *
 * Usage:
 *   npm run import-mymind -- --file ~/Downloads/mymind-export.json
 *   npm run import-mymind -- --file ~/Downloads/mymind-export.json --tags "mymind,imported"
 *   npm run import-mymind -- --file ~/Downloads/mymind-export.json --dry-run
 *
 * Options:
 *   --file <path>    Path to the MyMind JSON export file (required)
 *   --tags <tags>    Comma-separated tags to add to every imported item (optional)
 *   --dry-run        Preview what would be imported without writing anything
 *   --skip-notes     Skip items that have no body/note text
 *   --limit <n>      Only import the first N items (useful for testing)
 */

import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { embed } from '../lib/gemini'
import { supabase } from '../lib/supabase'

// ---------------------------------------------------------------------------
// MyMind export shape (their JSON export schema as of 2024)
// Fields are optional because MyMind supports many item types (links,
// images, notes, quotes, etc.) and not all fields appear in every item.
// ---------------------------------------------------------------------------
interface MyMindItem {
  id?: string
  title?: string
  note?: string        // user-written note
  body?: string        // item body / article excerpt
  content?: string     // alternative content field
  description?: string // meta description for links
  url?: string
  source?: string      // alternative URL field
  tags?: string[]
  labels?: string[]    // alternative tags field
  type?: string        // 'link' | 'note' | 'image' | 'quote' | etc.
  created_at?: string
  createdAt?: string
  date?: string
  text?: string        // for quote items
  quote?: string       // for quote items
}

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
function parseArgs() {
  const args = process.argv.slice(2)
  const get = (flag: string) => {
    const i = args.indexOf(flag)
    return i !== -1 ? args[i + 1] : undefined
  }
  const has = (flag: string) => args.includes(flag)

  const filePath = get('--file')
  if (!filePath) {
    console.error('Error: --file <path> is required.')
    console.error('Usage: npm run import-mymind -- --file ~/Downloads/mymind-export.json')
    process.exit(1)
  }

  return {
    filePath: path.resolve(filePath),
    extraTags: get('--tags')?.split(',').map((t) => t.trim()).filter(Boolean) ?? [],
    dryRun: has('--dry-run'),
    skipNotes: has('--skip-notes'),
    limit: get('--limit') ? parseInt(get('--limit')!, 10) : Infinity,
  }
}

// ---------------------------------------------------------------------------
// Map a MyMind item → { source, question, answer, tags }
// ---------------------------------------------------------------------------
function mapItem(item: MyMindItem, extraTags: string[]) {
  // Source URL — try several possible fields
  const source = item.url ?? item.source ?? ''

  // Question — use title if available, otherwise synthesize from content
  const rawTitle = item.title?.trim() ?? ''
  const question = rawTitle.length > 0
    ? rawTitle
    : `What is the key insight from: ${source || 'this saved item'}?`

  // Answer — combine note + body/content/description/quote in priority order
  const parts: string[] = []

  // User-written note is the most valuable signal
  if (item.note?.trim())        parts.push(item.note.trim())
  if (item.quote?.trim())       parts.push(`"${item.quote.trim()}"`)
  if (item.text?.trim())        parts.push(item.text.trim())
  if (item.body?.trim())        parts.push(item.body.trim())
  if (item.content?.trim())     parts.push(item.content.trim())
  if (item.description?.trim()) parts.push(item.description.trim())

  const answer = parts.join('\n\n')

  // Tags — merge MyMind tags + labels + caller-supplied extra tags
  const itemTags = [
    ...(item.tags ?? []),
    ...(item.labels ?? []),
    ...extraTags,
  ].map((t) => t.trim().toLowerCase()).filter(Boolean)

  // Deduplicate tags
  const tags = [...new Set(itemTags)]

  return { source, question, answer, tags }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const { filePath, extraTags, dryRun, skipNotes, limit } = parseArgs()

  // Validate env
  if (!dryRun) {
    if (!process.env.GEMINI_API_KEY)       throw new Error('GEMINI_API_KEY is not set')
    if (!process.env.SUPABASE_URL)         throw new Error('SUPABASE_URL is not set')
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  // Read and parse the export file
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`)
    process.exit(1)
  }

  const raw = fs.readFileSync(filePath, 'utf-8')
  let items: MyMindItem[]

  try {
    const parsed = JSON.parse(raw)
    // MyMind exports can be a top-level array or wrapped in { items: [...] }
    items = Array.isArray(parsed) ? parsed : (parsed.items ?? parsed.data ?? [])
  } catch (err) {
    console.error('Failed to parse JSON export:', err)
    process.exit(1)
  }

  console.log(`\nMyMind Import`)
  console.log('='.repeat(60))
  console.log(`File:     ${filePath}`)
  console.log(`Items:    ${items.length} total in export`)
  console.log(`Dry run:  ${dryRun ? 'YES — nothing will be written' : 'no'}`)
  if (extraTags.length) console.log(`Extra tags: ${extraTags.join(', ')}`)
  console.log()

  // Map and filter items
  const mapped = items
    .slice(0, limit)
    .map((item) => mapItem(item, extraTags))
    .filter((item) => {
      if (skipNotes && !item.answer) return false
      return item.question && item.answer // must have both
    })

  if (mapped.length === 0) {
    console.log('No importable items found. Try removing --skip-notes or check your export file.')
    return
  }

  console.log(`Importing ${mapped.length} item(s)${limit < Infinity ? ` (limited to ${limit})` : ''}...\n`)

  let imported = 0
  let skipped = 0
  let failed = 0

  for (let i = 0; i < mapped.length; i++) {
    const { source, question, answer, tags } = mapped[i]
    const preview = question.length > 60 ? question.slice(0, 57) + '...' : question

    if (dryRun) {
      console.log(`[DRY RUN] ${i + 1}/${mapped.length} ${preview}`)
      console.log(`  source:   ${source || '(none)'}`)
      console.log(`  answer:   ${answer.slice(0, 80).replace(/\n/g, ' ')}${answer.length > 80 ? '…' : ''}`)
      console.log(`  tags:     ${tags.join(', ') || '(none)'}`)
      console.log()
      imported++
      continue
    }

    process.stdout.write(`[${i + 1}/${mapped.length}] ${preview} ... `)

    try {
      // Embed the question for vector search
      const embedding = await embed(question)

      // Insert into Supabase
      const { error } = await supabase.from('qa_items').insert({
        source,
        question,
        answer,
        tags,
        embedding,
      })

      if (error) {
        // Duplicate detection: Supabase returns a unique constraint error
        if (error.code === '23505') {
          console.log('skipped (duplicate)')
          skipped++
        } else {
          console.log(`failed: ${error.message}`)
          failed++
        }
      } else {
        console.log('done')
        imported++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.log(`error: ${msg}`)
      failed++
    }

    // Small delay to avoid hitting Gemini rate limits
    if (i < mapped.length - 1) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  console.log()
  console.log('='.repeat(60))
  console.log(`Import complete${dryRun ? ' (DRY RUN)' : ''}`)
  console.log(`  Imported: ${imported}`)
  if (skipped) console.log(`  Skipped (duplicates): ${skipped}`)
  if (failed)  console.log(`  Failed: ${failed}`)
  console.log()
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
