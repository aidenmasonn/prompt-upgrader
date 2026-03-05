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

---

## Architecture (as built)

**Stack:**
| Concern | Implementation |
|---|---|
| UI + API routes | Next.js 15 (App Router), TypeScript |
| Embeddings | Gemini `gemini-embedding-001` — 3072 dimensions |
| LLM rewriting | Gemini generation model (set via `GEMINI_MODEL` env var) |
| Vector store | Supabase PostgreSQL + pgvector extension |
| Styling | Tailwind CSS |
| Script runner | `tsx` (runs TypeScript scripts directly) |

**End-to-end flow:**
1. User pastes Q&A in the UI → POST `/api/qa` → question is embedded via Gemini → row inserted into Supabase `qa_items` table
2. User pastes a raw prompt → POST `/api/upgrade` → prompt is embedded → Supabase RPC `match_qa_items` returns top-3 most similar Q&As by cosine similarity → Gemini rewrites the prompt using `prompt_rubric.md` as instructions + retrieved Q&As as context → returns 3 sections: upgraded prompt, rationale, used memory

---

## File Structure

```
/
├── claude.md                          ← this file; project context for Claude Code
├── prompt_rubric.md                   ← rubric the LLM follows when upgrading prompts
├── .env.example                       ← template for required env vars
├── .env.local                         ← actual secrets (gitignored)
├── .gitignore
├── package.json                       ← scripts: dev, build, smoke, eval, diagnostic
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
│
├── lib/
│   ├── gemini.ts                      ← embed() and upgradePrompt() using Gemini API
│   └── supabase.ts                    ← server-side Supabase client (service role)
│
├── app/
│   ├── layout.tsx                     ← root HTML shell
│   ├── globals.css                    ← Tailwind base + custom btn/input classes
│   ├── page.tsx                       ← single-page UI (Add Q&A + Upgrade Prompt)
│   └── api/
│       ├── qa/route.ts                ← POST: embed question + insert into Supabase
│       └── upgrade/route.ts           ← POST: embed prompt + retrieve + rewrite
│
├── supabase/
│   └── migrations/
│       └── 001_init.sql               ← run once in Supabase SQL Editor to set up DB
│
├── scripts/
│   ├── smoke-test.ts                  ← automated end-to-end check (npm run smoke)
│   ├── eval.ts                        ← scorecard: retrieval accuracy, rubric adherence, citation rate (npm run eval)
│   └── retrieval-diagnostic.ts        ← similarity score table for all Q&As vs test prompts (npm run diagnostic)
│
└── docs/
    ├── seed-qa.md                     ← ready-to-paste Q&A entries for testing
    └── progress.md                    ← non-technical project tracker
```

---

## Environment Variables

```
GEMINI_API_KEY=AIza...          # Google AI Studio key
GEMINI_MODEL=gemini-2.5-flash-lite   # generation model; swap freely without code changes
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # service role key (bypasses RLS); server-side only
```

Copy `.env.example` to `.env.local` and fill in values. Never commit `.env.local`.

---

## Key Commands

```bash
npm run dev         # start local dev server at localhost:3000
npm run smoke       # run automated smoke test (requires dev server running)
npm run eval        # scorecard eval — retrieval, rubric, citation rate (requires dev server)
npm run diagnostic  # show similarity scores for all Q&As vs test prompts
npm run build       # production build (not needed for local use)
```

---

## Database Setup (one-time)

Run `supabase/migrations/001_init.sql` in the Supabase project's SQL Editor.
This creates:
- `vector` extension
- `qa_items` table with columns: id, source, question, answer, tags, embedding (3072d), created_at
- `match_qa_items(query_embedding, match_count)` RPC function for similarity search

---

## Known Limitations (V1)

- **Tags are stored but not used in retrieval** — similarity search is purely embedding-based. Tags are saved for future filtering but have no effect on what gets retrieved today.
- **No authentication** — anyone with access to localhost can use the tool. Fine for personal local use.
- **Runs locally only** — no hosting required or set up. Access via `localhost:3000` only.
- **No bulk import** — Q&A items must be entered one at a time via the UI.
- **Top-k is hardcoded at 3** — the upgrade always retrieves the 3 most similar Q&As.

---

## Future Improvements (V2+)

- **Tag-based pre-filtering** — filter `qa_items` by tag before running vector similarity, so retrieval stays within a topic cluster
- **Bulk import** — paste or upload a list of Q&A items at once (CSV or markdown)
- **Adjustable top-k** — let user choose how many Q&As to retrieve per upgrade
- **View/manage memory** — a page to browse, edit, and delete stored Q&A items
- **Auto-capture** — paste a conversation or document and auto-extract Q&A pairs
- **Browser extension** — capture Q&As while browsing without switching to the tool

---

## Style & Workflow Rules for Claude Code

- Start every task in **Plan → Execute → Verify**.
- In Plan: list the minimal steps, files to touch, and commands to run.
- In Execute: make the smallest changes that work; avoid "big rewrites".
- In Verify: run tests / lint / a quick smoke check and report results.

## Coding Standards

- Keep code simple, readable, and well-commented.
- Prefer small modules over one giant file.
- All secrets go in .env (never hardcode keys).

## Interaction Rules

- If requirements are ambiguous, propose a default and proceed (don't ask unless truly blocking).
- If you need context, inspect the repo first (read files, search, then propose plan).
