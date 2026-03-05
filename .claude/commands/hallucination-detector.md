# Hallucination Detector

Identify and fix hallucinations in upgraded prompts: invented citations, unsupported constraints, and fabricated quotes.

## Hallucination types in this project

This pipeline has three distinct hallucination surfaces:

### Type 1: Citation hallucination
The model cites a UUID in the rationale but the quoted passage does not appear in the corresponding Q&A item.

**How to detect (code-checkable):**
```typescript
// For each rationale bullet with a UUID citation:
const UUID_PATTERN = /^\[([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\]\s+"([^"]+)"/i

for (const bullet of rationale) {
  const match = bullet.match(UUID_PATTERN)
  if (match) {
    const [, uuid, quotedPassage] = match
    const sourceItem = retrievedItems.find(r => r.id === uuid)
    if (!sourceItem) {
      console.warn(`HALLUCINATION: Citation to ${uuid} not in retrieved items`)
    } else if (!sourceItem.answer.toLowerCase().includes(quotedPassage.toLowerCase())) {
      console.warn(`HALLUCINATION: Quote "${quotedPassage}" not found in item ${uuid.slice(0,8)}`)
    }
  }
}
```

Add this check to `scripts/eval.ts` as a new dimension: `Citation faithfulness`.

### Type 2: usedMemory / rationale mismatch
The model lists items in `usedMemory` that it never actually cited in the rationale, or cites UUIDs in the rationale that aren't in `usedMemory`.

**How to detect:**
```typescript
const rationaleCitedIds = new Set(
  rationale
    .map(b => b.match(/^\[([0-9a-f-]{36})\]/i)?.[1])
    .filter(Boolean)
)
const usedMemoryIds = new Set(usedMemory.map(m => m.id))

// Check: every rationale citation should be in usedMemory
for (const id of rationaleCitedIds) {
  if (!usedMemoryIds.has(id)) {
    console.warn(`Rationale cites ${id.slice(0,8)} but it's not in usedMemory`)
  }
}

// Check: every usedMemory item should be cited at least once
for (const id of usedMemoryIds) {
  if (!rationaleCitedIds.has(id)) {
    console.warn(`usedMemory includes ${id.slice(0,8)} but it's never cited`)
  }
}
```

### Type 3: Fabricated constraints in upgraded prompt
The model adds constraints to the upgraded prompt that have no basis in the rubric or in the retrieved Q&A items.

**Partially code-checkable:** Confirm that every constraint in the upgraded prompt either (a) appears in `prompt_rubric.md` or (b) is derived from a cited Q&A item.

**Not fully code-checkable** — requires LLM judge. Use `/evals-skills:write-judge-prompt` with criterion: "Does every constraint in the upgraded prompt have a basis in the rubric or in the retrieved context?"

## Fixes for each type

| Hallucination type | Fix |
|---|---|
| Citation to non-existent item | Strengthen the rationale instruction: "Only cite UUIDs from the memory block above. Do not invent UUIDs." |
| Misquoted passage | Add instruction: "The quoted passage must be a verbatim substring of the answer field." |
| usedMemory/rationale mismatch | Add instruction: "usedMemory must contain exactly the items cited in the rationale — no more, no less." |
| Fabricated constraints | Add instruction: "Every constraint must be traceable to the rubric or to a cited memory item." |

## Adding hallucination detection to eval.ts

```typescript
// New dimension: citation faithfulness
function checkCitationFaithfulness(
  rationale: string[],
  usedMemory: Array<{id: string; question: string}>,
  retrieved: QAMatch[]  // need to pass retrieved items to eval
): { faithful: number; total: number; issues: string[] } {
  const issues: string[] = []
  let total = 0
  let faithful = 0

  for (const bullet of rationale) {
    const match = bullet.match(/^\[([0-9a-f-]{36})\]\s+"([^"]+)"/i)
    if (!match) continue
    total++
    const [, uuid, quoted] = match
    const source = retrieved.find(r => r.id === uuid)
    if (!source) {
      issues.push(`Citation to unknown UUID ${uuid.slice(0,8)}`)
    } else if (!source.answer.toLowerCase().includes(quoted.toLowerCase())) {
      issues.push(`Quote not found in ${uuid.slice(0,8)}: "${quoted.slice(0,50)}..."`)
      faithful--
    } else {
      faithful++
    }
  }

  return { faithful, total, issues }
}
```

## Prompt-level fixes (in lib/gemini.ts)

Add these instructions to the system prompt to reduce hallucinations at the source:

```
ANTI-HALLUCINATION RULES:
- The quoted passage in each rationale bullet must be a verbatim substring of the answer field in the cited memory item.
- The usedMemory list must contain exactly the items whose UUIDs appear in the rationale — no additions, no omissions.
- Do not invent, paraphrase, or reconstruct passages. Copy them exactly.
- If no memory item supports a change, use [general] — do not force a citation.
```

_Synthesized from research on hallucination detection patterns in RAG pipelines_
