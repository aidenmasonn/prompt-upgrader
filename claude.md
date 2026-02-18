# Project: Prompt Memory + Prompt Upgrader (Personal Prototype)

## Goal (V1)
Build a personal tool that:
1) Saves Q&A snippets (manual paste is fine for V1)
2) Stores structured metadata + embeddings for retrieval
3) Lets me paste a draft prompt and returns an improved prompt using retrieved relevant prior Q&A

V1 must prioritize: reliability, speed to iterate, minimal moving parts.

## Non-goals (V1)
- No browser extension
- No auto-detection of "prompt writing mode"
- No cross-device sync
- No fancy UI (basic web page or CLI is fine)

## Definition of Done (V1)
- I can save a Q&A item with fields: source, question, answer, tags, created_at
- On "Upgrade Prompt":
  - embed draft prompt
  - retrieve top-k relevant Q&A by similarity
  - generate a rewritten prompt + short rationale + citations to which Q&A items were used (IDs)
- Basic tests or at least a reproducible manual check script

## Preferred architecture
- Next.js simple UI OR CLI (choose the fastest path)
- Supabase Postgres + pgvector for storage/retrieval
- Embeddings via API
- Main LLM for rewriting prompts via API

## Style & workflow rules for Claude Code
- Start every task in **Plan → Execute → Verify**.
- In Plan: list the minimal steps, files to touch, and commands to run.
- In Execute: make the smallest changes that work; avoid "big rewrites".
- In Verify: run tests / lint / a quick smoke check and report results.

## Coding standards
- Keep code simple, readable, and well-commented.
- Prefer small modules over one giant file.
- All secrets go in .env (never hardcode keys).
- Add a README with setup steps once it works.

## Interaction rules
- If requirements are ambiguous, propose a default and proceed (don’t ask me questions unless truly blocking).
- If you need context, inspect the repo first (read files, search, then propose plan).
