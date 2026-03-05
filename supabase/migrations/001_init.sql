-- Enable pgvector extension (run this in Supabase SQL Editor)
CREATE EXTENSION IF NOT EXISTS vector;

-- Q&A memory table
-- Fields match claude.md "Definition of Done" requirements:
--   source, question, answer, tags, created_at + embedding for retrieval
CREATE TABLE IF NOT EXISTS qa_items (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  source      TEXT        NOT NULL,
  question    TEXT        NOT NULL,
  answer      TEXT        NOT NULL,
  tags        TEXT[]      NOT NULL DEFAULT '{}',
  embedding   VECTOR(3072),           -- gemini-embedding-001 outputs 3072 dimensions
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- If the table already exists with the wrong dimension, run this to fix it:
-- ALTER TABLE qa_items ALTER COLUMN embedding TYPE vector(3072);

-- Similarity search function (cosine similarity, returns top-k matches)
-- Called from the upgrade API route to retrieve relevant Q&A context.
CREATE OR REPLACE FUNCTION match_qa_items(
  query_embedding VECTOR(3072),
  match_count     INT DEFAULT 3
)
RETURNS TABLE (
  id         UUID,
  source     TEXT,
  question   TEXT,
  answer     TEXT,
  tags       TEXT[],
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    qa_items.id,
    qa_items.source,
    qa_items.question,
    qa_items.answer,
    qa_items.tags,
    -- cosine similarity = 1 - cosine distance
    (1 - (qa_items.embedding <=> query_embedding))::FLOAT AS similarity
  FROM qa_items
  WHERE qa_items.embedding IS NOT NULL
  ORDER BY qa_items.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
