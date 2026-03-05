# Build Review Interface

Scaffold a browser-based annotation tool for reviewing prompt-upgrader traces and collecting human Pass/Fail labels.

## When to use this

Use when you need to label 20+ traces for judge validation (see `/evals-skills:validate-evaluator`). Manual JSON reading doesn't scale past ~10 traces. A dedicated interface makes labeling 5x faster and reduces fatigue errors.

## Data format

Your traces should be in this shape (extend `scripts/eval.ts` to write this):

```json
{
  "id": "uuid",
  "timestamp": "2026-01-01T00:00:00Z",
  "input": "raw user prompt",
  "retrieved": [
    {"id": "uuid", "question": "...", "answer": "...", "similarity": 0.87}
  ],
  "upgraded": "full upgraded prompt text",
  "rationale": ["bullet 1", "bullet 2"],
  "usedMemory": [{"id": "uuid", "question": "..."}],
  "label": null,
  "notes": ""
}
```

Accept input as a JSONL file (one trace per line).

## Key design principles

### Show the right thing at the right time

Format output for human reading, not raw JSON:
- Upgraded prompt: render as preformatted text or markdown (not escaped JSON)
- Retrieved Q&As: show question + answer together, clearly labeled, with similarity score
- Rationale bullets: render as a bulleted list, highlight UUID citations
- Input: show first so the reviewer knows what to judge against

### Visual hierarchy

```
┌─────────────────────────────────────────────────┐
│ Trace 12 of 87          [← Prev] [Next →]       │
├─────────────────────────────────────────────────┤
│ INPUT (raw prompt)                              │
│  "Help me write a prompt for data extraction"  │
├─────────────────────────────────────────────────┤
│ UPGRADED PROMPT                                 │
│  You are a data extraction assistant...        │
├─────────────────────────────────────────────────┤
│ RETRIEVED CONTEXT (3 items) [▼ expand]         │
│  [1] similarity: 0.87 — "what makes a prompt..." │
├─────────────────────────────────────────────────┤
│ RATIONALE (4 bullets)     [▼ expand]           │
│  • [3dcaf080] "a clear role" → Added persona   │
├─────────────────────────────────────────────────┤
│  [  PASS  ]  [  FAIL  ]  [  Skip  ]            │
│  Notes: ________________________________       │
└─────────────────────────────────────────────────┘
```

### Feedback controls

- **Primary actions:** PASS / FAIL buttons, keyboard shortcuts: `p` = Pass, `f` = Fail, `s` = Skip
- **Navigation:** Left/right arrow keys, or `n`/`b` for next/back
- **Notes field:** Free text for borderline cases — these notes become training data for the judge
- **Progress indicator:** "12 of 87 remaining" visible at all times

### Collapsible sections

Hide retrieved context and rationale by default. Reviewing these on every trace adds cognitive load; a reviewer can expand when the label is uncertain.

## Implementation scaffold

Start minimal:

```typescript
// Single HTML file, no framework needed for <200 traces
// 1. Load traces.jsonl via FileReader or fetch('/api/traces')
// 2. Render current trace index
// 3. On PASS/FAIL click: set label on trace object, auto-advance
// 4. Save labels: POST /api/labels or download as labeled-traces.jsonl
```

Verify with Playwright:
```typescript
test('label persists after navigation', async ({ page }) => {
  await page.click('[data-action="pass"]')
  await page.click('[data-action="next"]')
  await page.click('[data-action="prev"]')
  await expect(page.locator('[data-trace-label]')).toHaveAttribute('data-value', 'PASS')
})
```

## Export format

```json
{"id": "uuid", "label": "PASS", "notes": "borderline — assumptions present but thin"}
{"id": "uuid", "label": "FAIL", "notes": "rationale cites [general] but memory item [abc] covers it"}
```

Export as JSONL and merge back into the trace file for use in `/evals-skills:validate-evaluator`.

_Source: hamelsmu/evals-skills build-review-interface skill_
