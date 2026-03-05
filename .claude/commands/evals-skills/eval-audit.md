# Eval Audit

Inspect the evaluation pipeline for this prompt-upgrader project and identify trustworthiness problems by severity.

## What to audit

Work through these six diagnostic areas for `scripts/eval.ts` and the related test infrastructure:

### 1. Error Analysis
- Are the test cases in `TEST_CASES` targeting observed failure modes (retrieval misses, rubric gaps, citation failures), or were they brainstormed without observing real failures?
- Recommendation: run `npm run eval` first, then run `npm run diagnostic` — observe actual failure patterns before updating test cases.

### 2. Evaluator Design
- Check whether each eval dimension uses binary pass/fail with a clear decision boundary.
- `RUBRIC_CHECKS` uses keyword heuristics — are the keyword patterns specific enough to detect the rubric element, or could they fire on unrelated text?
- The citation check uses a UUID regex — verify this actually catches the citation format the model emits.

### 3. Judge Validation
- The upgrade quality is currently measured by keyword heuristics (not an LLM judge). No TPR/TNR analysis exists.
- Flag: rubric adherence score can be gamed by the model inserting rubric keywords without actually following the rubric.
- Recommend: add an LLM-as-judge step using `/evals-skills:write-judge-prompt` for at least one high-value dimension.

### 4. Human Review
- Are there saved traces (inputs + outputs) that a human can review?
- If not: add trace logging to `scripts/eval.ts` — write full upgrade output to a timestamped JSONL file.

### 5. Labeled Data
- Current test set: 5 prompts with partial expected-question labels. Not balanced Pass/Fail.
- Minimum for judge validation: ~100 traces, ~50 Pass / 50 Fail per dimension.
- For this project scale, 20 labeled examples per dimension is a practical minimum.

### 6. Pipeline Hygiene
- Are the test prompts in `TEST_CASES` also present in the seed Q&A (`docs/seed-qa.md`)? If yes, that is train/test leakage — the retrieval test should never expect a Q&A item that was written to match the test prompt.
- Check: `match_qa_items` RPC — confirm it uses cosine similarity (`<=>`) not dot product for normalized embeddings.

## Output format

Produce a prioritized findings list:

```
CRITICAL (blocks trust in scores):
  C1. [finding]

HIGH (misleading results):
  H1. [finding]

MEDIUM (worth fixing but not blocking):
  M1. [finding]

RECOMMENDED NEXT STEP:
  → Run /evals-skills:error-analysis on the last eval run output
```

## Starting guidance

For teams without labeled data yet: `error-analysis → generate-synthetic-data → write-judge-prompt → validate-evaluator`. Never start by building evaluators without first understanding actual failure modes.

_Source: hamelsmu/evals-skills eval-audit skill_
