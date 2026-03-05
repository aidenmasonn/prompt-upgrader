# Verification Loop

Run a complete verification sequence after every change before marking work complete.

## The rule

Never report "done" until verification passes. Partial implementation + green signal = silent failures in production.

## Standard verification sequence for this project

Run these in order. Stop at the first failure and fix it before continuing.

### 1. Type check
```bash
npx tsc --noEmit
```
Catches type errors without building. Fast. Run first.

### 2. Build check
```bash
npm run build
```
Catches import errors, missing exports, Next.js config issues.

### 3. Smoke test
```bash
# Requires dev server running in a separate terminal: npm run dev
npm run smoke
```
End-to-end check: embed → retrieve → upgrade → parse. If this fails, the core pipeline is broken.

### 4. Eval scorecard
```bash
npm run eval
```
Run when changes touch: `lib/gemini.ts`, `app/api/upgrade/route.ts`, `prompt_rubric.md`, or the Supabase schema.

**Targets to maintain:**
- Retrieval accuracy: ≥ 70%
- Rubric adherence: ≥ 85%
- Citation rate: ≥ 60%

### 5. Retrieval diagnostic (when retrieval changes)
```bash
npm run diagnostic
```
Run when changes touch: `lib/gemini.ts` embed function, `supabase/migrations/`, or Q&A database contents.

## When to run each check

| Change type | tsc | build | smoke | eval | diagnostic |
|---|---|---|---|---|---|
| UI only (page.tsx) | ✓ | ✓ | — | — | — |
| API route change | ✓ | ✓ | ✓ | — | — |
| lib/gemini.ts | ✓ | ✓ | ✓ | ✓ | ✓ |
| prompt_rubric.md | — | — | ✓ | ✓ | — |
| Supabase schema | — | — | ✓ | ✓ | ✓ |
| lib/supabase.ts | ✓ | ✓ | ✓ | — | — |
| scripts/ | ✓ | — | — | ✓ | ✓ |

## Handling failures

**tsc fails:**
- Fix all type errors before proceeding. Do not use `@ts-ignore` to skip them.

**build fails:**
- Read the full Next.js error output — it identifies the exact file and line.

**smoke fails:**
- Check if the dev server is actually running.
- Check `.env.local` has all required keys.
- Run `npm run diagnostic` to isolate whether it's retrieval or generation.

**eval scores drop:**
- Run `/evals-skills:error-analysis` to understand which test cases newly fail.
- Check if the change affected embedding (then retrieval scores drop) or generation (then rubric/citation scores drop).
- Do not merge changes that drop scores below targets.

**diagnostic shows unexpected similarity scores:**
- Cosine similarity < 0.5 on expected matches → embedding quality issue or dimension mismatch
- Check that the same task_type is used for queries and documents

## Regression baseline

Before starting any significant work, save a baseline:
```bash
npm run eval 2>&1 | tee docs/eval-baseline-$(date +%Y%m%d).log
```

Compare against baseline after changes. Regressions > 5% on any metric need investigation before shipping.

_Adapted from obra/superpowers verification-before-completion skill, tailored to this project_
