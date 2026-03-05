# Feedback Flywheel

Close the loop: use production upgrade outputs to improve the system that generates them (Claudeception pattern — Claude evaluating Claude's outputs).

## The flywheel

```
User submits prompt
      ↓
Pipeline upgrades it
      ↓
[FEEDBACK CAPTURE] ← user rates the upgrade
      ↓
[FLYWHEEL JUDGE]   ← Claude evaluates the rating + output pair
      ↓
[SIGNAL ROUTING]   ← route to: rubric fix / Q&A gap / model change / no action
      ↓
System improves
```

## Step 1: Capture feedback

Add a feedback endpoint and UI to the existing upgrade flow.

### Backend: `app/api/feedback/route.ts`

```typescript
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const { traceId, rating, notes } = await req.json()
  // rating: 'good' | 'bad' | 'partial'
  // notes: optional free text

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await supabase.from('upgrade_feedback').insert({
    trace_id: traceId,
    rating,
    notes,
    created_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
```

### Database migration: `supabase/migrations/002_feedback.sql`

```sql
CREATE TABLE upgrade_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trace_id TEXT NOT NULL,      -- matches traceId from trace log
  input_prompt TEXT,           -- denormalized for easy analysis
  upgraded_prompt TEXT,        -- denormalized for easy analysis
  used_memory_ids TEXT[],      -- which Q&A items were cited
  rating TEXT CHECK (rating IN ('good', 'bad', 'partial')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### UI: add to `app/page.tsx` after upgrade result

```tsx
// After showing the upgraded prompt:
<div className="flex gap-2 mt-4">
  <button onClick={() => submitFeedback('good')}>👍 Good upgrade</button>
  <button onClick={() => submitFeedback('partial')}>〜 Partially useful</button>
  <button onClick={() => submitFeedback('bad')}>👎 Missed the goal</button>
</div>
<textarea
  placeholder="Optional: what was wrong?"
  onChange={e => setFeedbackNote(e.target.value)}
/>
```

## Step 2: Flywheel judge (Claudeception)

Use Claude to categorize each piece of negative feedback and route it to the right fix.

Add `scripts/flywheel.ts`:

```typescript
/**
 * Flywheel: reads 'bad' and 'partial' feedback, uses Claude to diagnose
 * each failure, and writes a prioritized fix report.
 *
 * Usage: npx tsx scripts/flywheel.ts
 */

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic()  // uses ANTHROPIC_API_KEY

const JUDGE_PROMPT = `You are reviewing user feedback on an AI prompt upgrader.

The upgrader takes a raw user prompt, retrieves relevant Q&A from memory, and returns an improved prompt.

Here is a case that received negative feedback:

<input_prompt>{{INPUT}}</input_prompt>
<upgraded_prompt>{{UPGRADED}}</upgraded_prompt>
<retrieved_memory>{{MEMORY}}</retrieved_memory>
<user_rating>{{RATING}}</user_rating>
<user_notes>{{NOTES}}</user_notes>

Diagnose the failure. Return JSON:
{
  "failure_type": "rubric_gap" | "memory_gap" | "model_regression" | "retrieval_miss" | "false_negative",
  "explanation": "one sentence",
  "recommended_action": "one concrete action",
  "priority": "high" | "medium" | "low"
}

Failure types:
- rubric_gap: the rubric didn't instruct the model to handle this case
- memory_gap: the right Q&A doesn't exist in the database
- retrieval_miss: the right Q&A exists but wasn't retrieved
- model_regression: the model generated a worse output than it should despite correct context
- false_negative: the user marked it bad but the upgrade is actually good`

async function judgeFeedback(feedback: FeedbackRow) {
  const prompt = JUDGE_PROMPT
    .replace('{{INPUT}}', feedback.input_prompt)
    .replace('{{UPGRADED}}', feedback.upgraded_prompt)
    .replace('{{MEMORY}}', JSON.stringify(feedback.used_memory_ids))
    .replace('{{RATING}}', feedback.rating)
    .replace('{{NOTES}}', feedback.notes ?? 'none')

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',  // cheap, fast for categorization
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })

  return JSON.parse(response.content[0].type === 'text' ? response.content[0].text : '{}')
}
```

## Step 3: Signal routing

The flywheel judge output maps directly to actions:

| `failure_type` | Action |
|---|---|
| `rubric_gap` | Update `prompt_rubric.md` with a new rule or example |
| `memory_gap` | Add a new Q&A item to the database covering the missing knowledge |
| `retrieval_miss` | Run `/evals-skills:evaluate-rag` → check similarity scores → try HyDE |
| `model_regression` | Run `/evals-skills:error-analysis` → check if model change caused regression |
| `false_negative` | No action needed — mark as reviewed |

## Step 4: Prioritization

Run flywheel weekly. Batch feedback by failure_type, sort by frequency:

```
Flywheel Report — week of 2026-03-10
────────────────────────────────────
memory_gap      ████████ 8 cases  HIGH
  → Most common gap: prompts about "tone and voice"
  → Action: add 3 Q&As about tone/voice to database

rubric_gap      ████ 4 cases  MEDIUM
  → Model not applying "assumptions" to multi-step prompts
  → Action: add example to prompt_rubric.md

retrieval_miss  ██ 2 cases  LOW
  → borderline similarity 0.62 → add taskType to embed()

false_negative  ██ 2 cases  (no action)
```

## Add to package.json

```json
"scripts": {
  "flywheel": "tsx scripts/flywheel.ts"
}
```

## Add to .env.example

```
ANTHROPIC_API_KEY=sk-ant-...    # for flywheel judge (Claude Haiku)
```

## Why this works (Claudeception)

The judge model (Claude Haiku) doesn't need to know what a "good" upgrade looks like. It only needs to categorize why a specific upgrade failed according to user signal. This is easier than the upgrade task itself — categorization is simpler than generation.

The cost: ~$0.001/feedback item with Haiku. Running weekly on 10-20 feedback items costs < $0.02.

_Custom skill — Claudeception feedback loop pattern for RAG pipelines_
