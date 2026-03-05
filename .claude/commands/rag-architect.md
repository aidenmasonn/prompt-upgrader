# RAG Architect

Comprehensive guidance for designing, implementing, and optimizing the retrieval-augmented generation pipeline in this project.

## This project's stack

| Component | Implementation | Notes |
|---|---|---|
| Embeddings | Gemini `gemini-embedding-001` | 3072 dimensions |
| Vector store | Supabase PostgreSQL + pgvector | `match_qa_items` RPC |
| Similarity | Cosine (`<=>` operator) | Normalized vectors |
| Retrieval | Top-3 fixed | See Known Limitations |
| Generation | Gemini (configurable via `GEMINI_MODEL`) | XML-tagged output |

---

## Chunking strategy (Q&A items)

This project stores whole Q&A items (not chunked documents). Treat the Q&A item as the atomic retrieval unit. Key parameters:

- **Question field** is what gets embedded (current) — not question + answer combined
- **Trade-off:** embedding only the question gives cleaner semantic matching but loses signal in the answer when the answer contains domain-specific terms the question doesn't
- **When to change:** if `npm run diagnostic` shows high-similarity Q&As being missed, try embedding `question + " " + answer.slice(0, 300)` and compare recall

## Embedding model guidance

`gemini-embedding-001` outputs 3072 dimensions. Key considerations:

- **Task type:** The Gemini embedding API supports a `taskType` parameter (`RETRIEVAL_DOCUMENT` for storing, `RETRIEVAL_QUERY` for querying). Currently not used — both sides use default task type. Adding this can improve recall by up to 10% for asymmetric retrieval tasks.

  ```typescript
  // In embed() function — add taskType:
  body: JSON.stringify({
    content: { parts: [{ text }] },
    taskType: isQuery ? 'RETRIEVAL_QUERY' : 'RETRIEVAL_DOCUMENT'
  })
  ```

- **Dimension reduction:** pgvector supports storing lower-dimension vectors. If storage becomes a concern at scale, you can truncate to 1536 or 768 dimensions (Matryoshka property — quality degrades gracefully).

## Vector index (pgvector)

For the `qa_items` table:

```sql
-- Recommended: IVFFlat for <10k rows (simple, fast)
CREATE INDEX ON qa_items USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- For >100k rows, switch to HNSW:
CREATE INDEX ON qa_items USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

At the current scale (likely < 1000 Q&A items), a sequential scan is fine — no index needed yet.

## Retrieval strategies

### Current: dense-only (embedding similarity)
Works well for semantic paraphrase matching. Fails for:
- Exact keyword queries ("what does `extractTag` do")
- Queries using different terminology than the stored Q&A

### Hybrid retrieval (when to add)
Add BM25 keyword search alongside vector similarity when:
- Tags are added to retrieval (currently tags are stored but not used)
- Users query by specific technical terms

**Implementation path:**
1. Add `tsvector` column to `qa_items` for full-text search
2. Run both vector search and text search
3. Merge with Reciprocal Rank Fusion: `score = 1/(k + rank_vector) + 1/(k + rank_text)`, k=60 standard

### Query expansion (when to add)
If retrieval recall is low, try generating a hypothetical answer (HyDE) before embedding:

```typescript
// HyDE: embed a synthetic answer, not the raw query
const hypothetical = await generateHypotheticalAnswer(rawPrompt)
const queryEmbedding = await embed(hypothetical)
// Then search with queryEmbedding instead of embed(rawPrompt)
```

This helps when queries are short/vague and Q&As contain long, specific answers.

## Top-k tuning

Currently hardcoded at 3. To tune:

```typescript
// In match_qa_items RPC, try k=5 and measure Recall@5 vs Recall@3
// If Recall@5 >> Recall@3 with no drop in generation quality, increase k
// Watch token budget: 5 Q&As × avg 200 tokens = 1000 additional tokens per upgrade
```

Rule of thumb: increase k if > 20% of eval prompts have relevant Q&As ranked 4-5. Keep k ≤ 10 to avoid context dilution.

## Similarity threshold

The current RPC returns top-k regardless of similarity score. Consider adding a minimum threshold:

```sql
-- In match_qa_items function:
WHERE qa_items.embedding <=> query_embedding < 0.3  -- cosine distance threshold
-- (cosine similarity = 1 - cosine_distance, so < 0.3 distance = > 0.7 similarity)
```

Use `npm run diagnostic` to find the natural score distribution and pick a threshold that cuts noise without losing relevant results.

## Evaluation integration

Use `/evals-skills:evaluate-rag` for:
- Recall@k measurement
- Faithfulness check (citation verification)
- Relevance scoring (LLM judge)

## Production patterns (future)

| Pattern | When needed | Implementation |
|---|---|---|
| Embedding cache | >1000 upgrades/day | Cache `embed(prompt)` in Redis by hash |
| Metadata pre-filtering | Tags used in retrieval | Add tag filter to `match_qa_items` WHERE clause |
| Reranking | Recall high but precision low | Cross-encoder on top-10, return top-3 |
| Streaming | Slow generation latency | Use Gemini streaming API, SSE to frontend |

## Common pitfalls

| Problem | Symptom | Fix |
|---|---|---|
| Missing task_type | Recall lower than expected | Add `taskType` to embed() calls |
| No index at scale | Slow queries at 10k+ items | Add ivfflat index |
| Top-k too small | Good Q&As missed | Increase k, add threshold |
| Embedding only question | Low recall on answer-heavy queries | Embed question+answer snippet |
| Cosine vs. dot product mismatch | Inconsistent similarity scores | Ensure vectors are normalized; use `<=>` (cosine distance) |

_Source: alirezarezvani/claude-skills rag-architect skill (POWERFUL tier)_
