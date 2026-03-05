import Anthropic from '@anthropic-ai/sdk'
import fs from 'fs'
import path from 'path'
import type { QAMatch, UpgradeResult } from './gemini'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

/**
 * Rewrite a raw prompt using Claude Opus 4.6 with adaptive thinking,
 * guided by the rubric and the top-k Q&A items retrieved from memory.
 *
 * Returns sections A (upgraded prompt), B (rationale), C (used memory)
 * as defined in prompt_rubric.md.
 */
export async function upgradePromptWithClaude(
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

  const userMessage = `You are an expert prompt engineer. Upgrade the draft prompt below using the rubric and memory context provided.

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

  // Use streaming to handle large prompts/responses without timeout
  const stream = client.messages.stream({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    thinking: { type: 'adaptive' },
    messages: [{ role: 'user', content: userMessage }],
  })

  const response = await stream.finalMessage()

  // Extract the text block from the response (skip thinking blocks)
  const textBlock = response.content.find((b) => b.type === 'text')
  const raw = textBlock?.type === 'text' ? textBlock.text : ''

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
}

/**
 * Extract the text content between <TAG>...</TAG> in a string.
 * Returns an empty string if the tag is not found.
 */
function extractTag(text: string, tag: string): string {
  const match = text.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'))
  return match ? match[1].trim() : ''
}
