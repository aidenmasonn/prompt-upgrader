-- Run this in your Supabase project's SQL Editor before using the feedback feature.
-- Each row is self-contained (stores raw + upgraded prompt) so it can be used
-- as ML training data without joins to other tables.
CREATE TABLE upgrade_feedback (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  raw_prompt        TEXT        NOT NULL,
  upgraded_prompt   TEXT        NOT NULL,
  highlighted_text  TEXT,                          -- NULL for general notes
  note              TEXT        NOT NULL,
  feedback_type     TEXT        NOT NULL DEFAULT 'inline',  -- 'inline' | 'general'
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
