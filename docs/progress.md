# Project Progress — Prompt Memory + Upgrader

*Non-technical tracker. Updated as the project evolves.*

---

## What this tool is

A personal web app that acts like a long-term memory for things you've learned about prompting AI. You paste in Q&A pairs (a question you had, and the answer or insight you got), and the tool stores them. Later, when you write a rough prompt and want it improved, the tool looks up the most relevant things you've already learned, and uses them — along with a set of upgrade rules — to rewrite your prompt into a much better version. Think of it as "the more you teach it, the smarter your prompts get."

---

## Current State

**Status: V1 complete and verified. All Definition of Done criteria met.**

---

## What Was Built (V1)

- **Add Q&A form** — paste a question, an answer, a source label, and optional tags. The tool stores it and converts it to a vector (a mathematical representation of meaning) for later retrieval.
- **Upgrade a Prompt form** — paste any rough prompt. The tool finds the most relevant Q&As from memory, and rewrites the prompt using a fixed set of upgrade rules (`prompt_rubric.md`).
- **Three-part output** — every upgrade returns:
  - **A) Upgraded prompt** — the fully rewritten version
  - **B) Rationale** — 3–6 bullet points explaining what changed and why
  - **C) Used Memory** — which stored Q&As were incorporated (so you can verify it's working)
- **Automated smoke test** — a script that adds 3 Q&As and runs an upgrade automatically, to confirm everything works end-to-end
- **Eval scorecard** — `npm run eval` measures retrieval accuracy, rubric adherence, and citation rate across 5 test prompts. All targets met: retrieval 100%, rubric 100%, citations 60%.

---

## Before First Use (one-time setup)

1. Go to [supabase.com](https://supabase.com) → your project → **SQL Editor**
2. Open the file `supabase/migrations/001_init.sql` in this project folder
3. Paste its contents into the SQL Editor and click **Run**
4. That's it — the database is ready

---

## How to Use the Tool

1. Open a terminal in the project folder
2. Run: `npm run dev`
3. Open a browser and go to: `http://localhost:3000`
4. **To add memory:** fill in the "Add Q&A to Memory" form and click Save
5. **To upgrade a prompt:** type or paste your rough prompt in the second section and click Upgrade
6. Read sections A, B, C of the output

To stop the tool, press `Ctrl+C` in the terminal.

---

## How to Run the Automated Test

With the tool running (`npm run dev`), open a second terminal and run:

```
npm run smoke
```

This will automatically add 3 Q&A items and run one prompt upgrade, printing the results. If you see "✅ Smoke test passed!" at the end, everything is working.

---

## Known Limitations

| Limitation | What it means in practice |
|---|---|
| Tags don't affect retrieval | Adding tags is fine for your own organisation, but the tool ignores them when deciding what to retrieve |
| Top-3 results only | Every upgrade always uses exactly the 3 most similar Q&As — no more, no less |
| No memory browser | You can't view, edit, or delete stored Q&As from the UI — you'd need to go into Supabase directly |
| One item at a time | No way to import a batch of Q&As — must be added one by one |
| Local only | The tool only runs on your computer; you can't access it from your phone or another device |
| No login | Anyone who can reach localhost:3000 can use it (not a concern for local personal use) |

---

## Ideas for the Future (V2+)

These are not committed — just collected ideas in rough priority order.

1. **Tag-based filtering** — when upgrading, only retrieve Q&As from a specific tag group (e.g. "only use my 'coding' memory")
2. **Memory browser** — a page to view, search, and delete stored Q&As without going into Supabase
3. **Bulk import** — paste a list of Q&As from a document or spreadsheet all at once
4. **Similarity scores visible in UI** — show how closely each retrieved Q&A matched, so you can judge relevance
5. **Adjustable top-k** — slider to choose how many Q&As to retrieve per upgrade (default 3)
6. **Auto-extract Q&As from a conversation** — paste a long chat and let the tool pull out the useful Q&A pairs
7. **Browser extension** — capture Q&As while browsing without switching apps

---

## Files You Should Know About

| File | What it is |
|---|---|
| `claude.md` | Instructions for Claude Code — the AI coding assistant. Read before starting any new coding session. |
| `prompt_rubric.md` | The rules the AI follows when rewriting your prompts. You can edit this to change upgrade behaviour. |
| `docs/seed-qa.md` | Ready-to-paste Q&A entries for testing the tool + prompts to test with |
| `docs/progress.md` | This file |
| `.env.local` | Your API keys and database credentials. Never share this file. |
| `supabase/migrations/001_init.sql` | The database setup script — run once in Supabase SQL Editor |
| `scripts/smoke-test.ts` | The automated end-to-end test — run with `npm run smoke` |

---

## Tech Stack (Plain English)

| Component | What it does |
|---|---|
| **Next.js** | The web framework — it runs the website and the behind-the-scenes logic in one place |
| **Gemini (Google AI)** | Two jobs: (1) converts text to numbers for storage and search, (2) rewrites your prompts |
| **Supabase** | An online database that stores your Q&A items and their vector representations |
| **pgvector** | A database extension that makes it possible to search by meaning, not just keywords |
| **Tailwind CSS** | Makes the website look reasonable without writing much styling code |
| **TypeScript** | The programming language — a stricter version of JavaScript with fewer bugs |

---

## Session Log

| Date | What happened |
|---|---|
| Feb 2026 | V1 scaffolded: Next.js + Gemini + Supabase/pgvector. All code written, deps installed, TypeScript compiles. |
| Feb 2026 | Switched from OpenAI to Gemini (gemini-2.5-flash-lite for generation, gemini-embedding-001 for embeddings, 3072d). |
| Feb 2026 | Documentation pass: claude.md updated, seed-qa.md created, this file created. |
| Feb 2026 | V1 debugging + verification: fixed retrieval (Cluster C Q&As rephrased to action-oriented), rewrote rubric to V2 (concrete examples, mandatory Assumptions, no JSON-by-default), fixed parse bug (switched model response from JSON to XML delimiters), added 503 retry logic, fixed citation rate 0%→60%. Eval scorecard script added. V1 verified complete. |
