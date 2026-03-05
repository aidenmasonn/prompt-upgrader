# Error Analysis

Identify failure modes in the prompt-upgrader pipeline through structured trace review.

## The core rule

**Do NOT start with a pre-defined failure list.** Let categories emerge from what you actually observe. Pre-defined categories reflect assumptions, not reality.

## Step 1: Collect traces

You need ~100 representative traces. For this project:

1. Run `npm run eval` and save the full output to a file:
   ```bash
   npm run eval 2>&1 | tee traces/eval-$(date +%Y%m%d).log
   ```
2. Run the upgrade API manually on 15-20 real-world prompts you care about.
3. Save each trace as JSON:
   ```json
   {
     "input": "...",
     "retrieved": [...],
     "upgraded": "...",
     "rationale": [...],
     "usedMemory": [...],
     "timestamp": "..."
   }
   ```

If you have fewer than 20 traces, use `/evals-skills:generate-synthetic-data` to create more test inputs before proceeding.

## Step 2: Read traces — do not code yet

Read each trace end-to-end. For each trace, answer:
- Did the upgrade succeed at its goal?
- If it failed: what specifically went wrong?
- Note the failure in plain language. No categories yet.

Do this for the first 30 traces before forming any category names.

## Step 3: Group into failure categories

After observing failures, group similar ones. Target 5-10 categories that are:

- **Distinct:** each failure belongs in exactly one category
- **Clear:** someone else could apply them consistently without asking you
- **Actionable:** knowing a trace is in this category suggests a specific fix

### Observed failure mode template

```
Category name: [short label]
Definition: [1-2 sentences — precise enough for consistent labeling]
Fix type: [prompt change / code fix / data gap / model limitation]
Frequency: [N/total traces observed]
Example trace IDs: [...]
```

## Failure modes likely to emerge for this project

Based on the pipeline design, watch for these (but do not assume them — confirm from traces):

| Suspected failure | Observable signal |
|---|---|
| Wrong Q&A retrieved | Retrieved item has low thematic relevance to the prompt |
| Retrieved but not cited | `usedMemory` is empty despite relevant items in top-3 |
| Citation format wrong | UUID regex doesn't match; `[general]` used for retrievable items |
| Rubric element missing | One of the 6 elements absent from upgraded prompt |
| Rubric element present but generic | "Constraints: be helpful" — no specific constraint |
| Intent drift | Upgraded prompt answers a different question than the input |
| Memory item misquoted | Quoted passage in rationale doesn't match actual Q&A answer |
| Assumptions section missing | Literally no "Assumptions:" line in the output |

## Step 4: Label all traces

Apply your finalized categories to every trace. Each trace gets one primary label. If a trace has multiple failures, label the most severe one.

## Step 5: Before building an evaluator — check for easy wins

For each failure category, ask:
1. Is this caused by a missing prompt instruction? (Fix: update `prompt_rubric.md` or the system prompt in `lib/gemini.ts`)
2. Is this a code bug? (Fix: update the parser in `extractTag()` or the citation regex)
3. Is this a data gap? (Fix: add Q&A items to the database)

Only build an LLM judge for failures that survive after fixing the obvious problems.

## Step 6: Prioritize

| Priority | Criteria |
|---|---|
| P0 | High frequency + easy fix |
| P1 | High frequency + hard to fix (needs evaluator) |
| P2 | Low frequency + high impact |
| Skip | Low frequency + low impact |

## When to repeat

Re-run error analysis after:
- Changing the system prompt or `prompt_rubric.md`
- Switching the generation model (`GEMINI_MODEL` env var)
- Adding a significant batch of new Q&A items to the database
- When eval scores drop unexpectedly

_Source: hamelsmu/evals-skills error-analysis skill_
