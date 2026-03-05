import { GoogleGenerativeAI } from '@google/generative-ai'
import fs from 'fs'
import path from 'path'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Generation model comes from env so you can swap it without a code change
const GEN_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite'

// Only embedding model available on this API key — outputs 3072 dimensions
// Must call v1beta (the SDK default); text-embedding-004 is not available on this key
const EMBED_MODEL = 'gemini-embedding-001'

// Shape of a Q&A item returned by the match_qa_items Supabase RPC
export interface QAMatch {
  id: string
  source: string
  question: string
  answer: string
  tags: string[]
  similarity: number
}

// Shape of the upgrade response (mirrors prompt_rubric.md sections A/B/C)
export interface UpgradeResult {
  upgraded: string
  rationale: string[]
  usedMemory: Array<{ id: string; question: string }>
}

/**
 * Embed text using Gemini text-embedding-004 via the v1 REST API directly.
 * The @google/generative-ai SDK only calls v1beta, which doesn't expose
 * embedding models — so we call the stable v1 endpoint with native fetch.
 */
export async function embed(text: string): Promise<number[]> {
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

  const data = await res.json() as { embedding: { values: number[] } }
  return data.embedding.values
}

/**
 * Rewrite a raw prompt using the configured Gemini generation model,
 * guided by the rubric and the top-k Q&A items retrieved from memory.
 *
 * Returns sections A (upgraded prompt), B (rationale), C (used memory)
 * as defined in prompt_rubric.md.
 */
export async function upgradePrompt(
  rawPrompt: string,
  qaItems: QAMatch[]
): Promise<UpgradeResult> {
  // Load rubric from project root at runtime
  const rubricPath = path.join(process.cwd(), 'prompt_rubric.md')
  const rubric = fs.readFileSync(rubricPath, 'utf-8')

  // Wrap each Q&A in XML tags so the model can clearly reference them by ID
  const memoryBlock =
    qaItems.length > 0
      ? qaItems
          .map(
            (q, i) =>
              `<memory_item index="${i + 1}" id="${q.id}" similarity="${q.similarity.toFixed(3)}">\n` +
              `  <source>${q.source}</source>\n` +
              `  <question>${q.question}</question>\n` +
              `  <answer>${q.answer}</answer>\n` +
              `</memory_item>`
          )
          .join('\n\n')
      : '<memory_item>No relevant memory found.</memory_item>'

  const prompt = `You are an expert prompt engineer. Upgrade the draft prompt below using the rubric and memory context provided.

## Prompt Upgrade Rubric
${rubric}

## Retrieved Memory (Q&A context — cite these by ID in your rationale)
${memoryBlock}

## Draft Prompt to Upgrade
${rawPrompt}

## Instructions for your response

1. Write the upgraded prompt following all rubric elements (objective, constraints, output format, evaluation criteria, assumptions, example).
2. For each change you made to the prompt, write one rationale bullet using this process:
   (a) State the change.
   (b) Check ALL retrieved memory items: does any contain text that validates, supports, or inspired this change?
   (c) If YES → [uuid] "exact quoted passage" → what you changed and why
   (d) If NO (checked every item, none applies) → [general] → what you changed and why

CRITICAL RULES:
- A single memory item CAN and SHOULD be cited in multiple bullets if it supports multiple changes.
- Even for rubric-required elements (objective, constraints, output format, eval criteria, assumptions, example) — if a retrieved memory item validates that element, cite the memory item. Do NOT write [general] just because the rubric also requires it.
- [general] is ONLY correct when you have verified that none of the retrieved memory items contains relevant text for that specific change.

Example (memory item [3dcaf080] says "An effective prompt has five elements: (1) a clear role or persona..."):
✓ [3dcaf080-ab91-4dd6-a7e1-28b86c387d09] "a clear role or persona for the AI" → Added 'You are an expert X' persona; this memory item confirms role-setting is essential.
✓ [3dcaf080-ab91-4dd6-a7e1-28b86c387d09] "a specific task statement — one unambiguous goal" → Added one-sentence objective; same memory item validates this element.
✓ [general] → Removed hedging language from the constraints. (None of the retrieved memory items addressed wording style.)
✗ WRONG: [general] → Added a clear objective. ← Wrong because [3dcaf080] explicitly covers objectives and was retrieved.

3. Only list memory items in usedMemory that you actually cited in the rationale.

Return your response using EXACTLY these XML tags with no extra text outside them:

<UPGRADED>
the full upgraded prompt text goes here — may include code blocks, quotes, or any formatting
</UPGRADED>
<RATIONALE>
one bullet per line, each starting with [uuid] or [general]
</RATIONALE>
<USED_MEMORY>
[{"id": "uuid-here", "question": "question text here"}]
</USED_MEMORY>

If no memory was used, write [] inside the USED_MEMORY tags.`

  // Retry up to 3 times on transient API errors (e.g. 503 Service Unavailable)
  const model = genAI.getGenerativeModel({ model: GEN_MODEL })
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const result = await model.generateContent(prompt)
      const raw = result.response.text()

      // Extract each section from the XML tags
      const upgraded = extractTag(raw, 'UPGRADED')
      const rationaleRaw = extractTag(raw, 'RATIONALE')
      const usedMemoryRaw = extractTag(raw, 'USED_MEMORY')

      // Split rationale into individual bullets, drop blank lines
      const rationale = rationaleRaw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      // Parse the used memory JSON array
      let usedMemory: Array<{ id: string; question: string }> = []
      try {
        const parsed = JSON.parse(usedMemoryRaw.trim() || '[]')
        if (Array.isArray(parsed)) usedMemory = parsed
      } catch {
        // usedMemory stays empty if JSON parse fails
      }

      return { upgraded, rationale, usedMemory }
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      const is503 = lastError.message.includes('503') || lastError.message.includes('Service Unavailable')
      if (!is503 || attempt === 3) break
      // Wait 3 seconds before retrying
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }

  throw lastError ?? new Error('Upgrade model failed after 3 attempts')
}

/**
 * Extract the text content between <TAG>...</TAG> in a string.
 * Returns an empty string if the tag is not found.
 */
function extractTag(text: string, tag: string): string {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}
