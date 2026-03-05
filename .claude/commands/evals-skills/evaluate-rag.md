# Evaluate RAG

Score the retrieval-augmented generation pipeline in this project across both retrieval and generation dimensions.

## First: separate retrieval failures from generation failures

Run `npm run diagnostic` before anything else. This shows similarity scores for all Q&As vs. test prompts. Identify whether failures come from:

- **Retrieval:** the right Q&A isn't in the top-3 results
- **Generation:** the right Q&As were retrieved but the upgraded prompt is still poor

**Fix retrieval problems before tuning generation.** An LLM cannot generate from missing context.

## Retrieval metrics

| Metric | Formula | When to use |
|---|---|---|
| **Recall@3** | Relevant items in top-3 / total relevant items | Primary metric — use this first |
| **Precision@3** | Relevant items in top-3 / 3 | For reranking evaluation |
| **MRR** | Mean(1/rank of first relevant result) | Single-fact lookups |
| **NDCG@3** | Discounted cumulative gain, normalized | Graded relevance rankings |

**Start with Recall@3.** The current `scripts/eval.ts` already computes a binary version. Extend it to track rank position, not just hit/miss.

### Recall@3 interpretation for this project

Current test set has 7 expected Q&A items across 5 prompts. The eval scores hits/misses. To extend:

```typescript
// Instead of binary hit/miss, record rank position:
const rankOfFirstHit = matches.findIndex(m =>
  expectedSubstrings.some(s => m.question.toLowerCase().includes(s.toLowerCase()))
) + 1  // 0 if not found → treated as rank = ∞

// MRR contribution:
const mrr = rankOfFirstHit > 0 ? 1 / rankOfFirstHit : 0
```

## Generation metrics

After confirming retrieval works, measure two dimensions:

### Faithfulness
Does the upgraded prompt accurately reflect the retrieved Q&A content? No invented constraints or fake citations?

**Check:** For each citation `[uuid]` in the rationale, does the quoted passage actually appear in the corresponding Q&A item's answer field? This is checkable in code.

```typescript
// Verify each citation exists in usedMemory
const citedIds = new Set(upgraded.usedMemory.map(m => m.id))
const rationaleCitations = bullets.filter(b => UUID_PATTERN.test(b))
// Cross-check: each cited UUID should be in usedMemory
```

### Relevance
Does the upgraded prompt actually address what the user's raw prompt was asking?

**Not checkable with keyword heuristics** — requires an LLM judge. Use `/evals-skills:write-judge-prompt` with criterion: "Does the upgraded prompt address the same goal as the input prompt?"

## Building a test dataset for this project

Three approaches, in order of data quality:

1. **Manual curation (highest quality):** Write 10-20 prompts where you know which Q&A items should be retrieved. Annotate expected items. These become ground truth for Recall@3.

2. **From `docs/seed-qa.md`:** Each Q&A in the seed file is a candidate test case. Write a prompt that should naturally retrieve it and record the expected Q&A ID.

3. **Synthetic (for stress testing):** Use `/evals-skills:generate-synthetic-data` to create edge cases: prompts that are semantically adjacent to multiple Q&As (tests disambiguation), prompts in a different domain (tests precision), very short prompts (tests recall on sparse queries).

**Critical warning:** Never use a Q&A item as both a seed item in the database AND an expected retrieval target without careful design — that tests memorization, not generalization.

## Chunking as a tunable parameter

This project doesn't chunk documents (Q&A items are stored whole), but the `match_count` parameter (currently hardcoded at 3) should be treated as tunable:

- Try `match_count` = 5 or 7 and measure whether Recall@k improves
- Check if the similarity threshold in `match_qa_items` is appropriate — very low similarity scores in `npm run diagnostic` suggest retrieval is returning noise

## Common failure patterns and root causes

| Symptom | Root cause | Fix |
|---|---|---|
| High recall, poor upgrade quality | Generation problem | LLM judge on faithfulness/relevance |
| Low recall, correct items exist in DB | Embedding mismatch | Check embedding model consistency; try task_type param |
| Low recall, items don't exist | Coverage gap in Q&A database | Add more seed Q&As |
| Citations present but wrong UUIDs | Generation hallucination | Stricter XML parsing; add faithfulness judge |
| Rubric elements present but generic | Prompt instruction weakness | Strengthen rubric or add constraints |

_Source: hamelsmu/evals-skills evaluate-rag skill_
