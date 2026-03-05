# Systematic Debugging

Investigate root causes before attempting any fix.

## The cardinal rule

**NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.**

Symptom-focused patches mask underlying problems and waste time. Systematic debugging takes 15-30 minutes. Random patching takes 2-3 hours and often doesn't solve the problem.

## Four mandatory phases

### Phase 1: Root cause investigation

1. **Read the error message completely.** Not the first line — the full stack trace, the full error message. Note exactly what file, function, line, and condition caused the failure.

2. **Reproduce the issue consistently.** Run `npm run smoke` or the specific failing script with the exact same inputs. If you can't reproduce, you can't confirm a fix.

3. **Examine recent changes.** What was the last thing changed before this broke?
   ```bash
   git log --oneline -10
   git diff HEAD~1
   ```

4. **Gather diagnostic evidence at component boundaries:**
   - Is the Gemini API call succeeding? (Check the raw response before parsing)
   - Is the Supabase query returning results? (Run `npm run diagnostic`)
   - Is the XML parsing correct? (Log the raw `result.response.text()` before `extractTag()`)
   - Is the `.env.local` loaded? (Check `process.env.GEMINI_API_KEY` is defined)

### Phase 2: Pattern analysis

5. **Find a working example.** Identify a case that works correctly and compare it to the failing case.

6. **Compare completely.** Don't compare just the part you suspect — compare the entire flow end-to-end.

7. **Identify the specific difference.** One concrete thing that's different between working and broken cases.

### Phase 3: Hypothesis and testing

8. **Form a specific, falsifiable hypothesis:**
   - Bad: "Something is wrong with the API"
   - Good: "The `extractTag()` function returns empty string when the LLM wraps output in markdown code fences"

9. **Test one variable at a time.** Don't make two changes simultaneously — you won't know which one fixed it.

10. **Verify the hypothesis.** Add a `console.log` at the specific failure point. Confirm the hypothesis before writing a fix.

### Phase 4: Implementation

11. **Write a failing test first** (if the codebase has tests). This confirms the bug is real and verifiable.

12. **Implement a targeted fix** that addresses the root cause — not the symptom.

13. **Verify no regressions.** Run `npm run smoke` and `npm run eval` after any fix.

## Warning signs you're skipping the process

- You're proposing multiple simultaneous changes
- You're on your third fix attempt without understanding why the first two failed
- You're modifying files that aren't directly involved in the error
- You're changing the wrong layer (e.g., fixing the parser when the bug is in the API call)

## Architectural escalation

If you've made **3 or more targeted fix attempts** and the problem persists, stop patching.

Ask instead:
- Is the fundamental architecture correct for this problem?
- Is the assumption underlying the current design wrong?
- Does the solution need to be redesigned rather than patched?

For this project, common architectural escalation candidates:
- XML tag parsing fragility → consider response format validation + retry
- Embedding dimension mismatch after model change → add dimension assertion on insert
- Rate limit handling → add exponential backoff at the `embed()` level, not per-call

## Quick debugging checklist for this project

```bash
# 1. Check env vars are loaded
node -e "require('dotenv').config({path:'.env.local'}); console.log(!!process.env.GEMINI_API_KEY)"

# 2. Test Supabase connectivity
npx tsx -e "
  import {createClient} from '@supabase/supabase-js'
  const c = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  const {data,error} = await c.from('qa_items').select('id').limit(1)
  console.log({data,error})
"

# 3. Test Gemini embed
npm run diagnostic

# 4. Full smoke test
npm run smoke
```

_Source: obra/superpowers systematic-debugging skill_
