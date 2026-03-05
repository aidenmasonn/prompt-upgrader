# Seed Q&A Data — V1 Test Set

## How to use this file

1. Start the app: `npm run dev` → open `http://localhost:3000`
2. For each entry below, fill in the **Add Q&A to Memory** form and click **Save to Memory**
3. Once you've added entries from at least two different clusters, go to **Upgrade a Prompt** and paste one of the test prompts at the bottom of this file
4. Check that "Used Memory" cites entries that are actually relevant — this confirms retrieval is working

The entries are grouped into 3 clusters on purpose. A retrieval system that works correctly should pull from the right cluster, not randomly from all entries.

---

## Cluster A — About This Tool

These 4 entries are about how the Prompt Memory + Upgrader tool itself works. If you test with a prompt about "improving prompts" or "this tool", these should be retrieved.

---

**Entry A1**
- **Source:** Session notes — Claude Code conversation
- **Question:** What do tags do in the Prompt Memory tool?
- **Answer:** Tags are stored alongside each Q&A item in the database and are returned in API responses, but they have no effect on retrieval in V1. The similarity search is purely embedding-based — when you upgrade a prompt, the tool finds the most semantically similar Q&As regardless of their tags. Tags are reserved for a future feature: filtering the memory pool by tag before running similarity search (e.g. "only search Q&As tagged 'prompting'").
- **Tags:** tool, tags, retrieval, v1-limitation

---

**Entry A2**
- **Source:** Session notes — Claude Code conversation
- **Question:** How many Q&A items do I need in memory to meaningfully test the tool?
- **Answer:** 3 to 5 items is enough, but they must cover different topics. If all your Q&As are about the same subject, the tool will always retrieve all of them for any related prompt — you won't be able to tell if retrieval is actually discriminating. The real test is: add Q&As on 3 clearly different topics, then write a prompt clearly about one of them, and check that "Used Memory" cites the right ones.
- **Tags:** tool, testing, retrieval

---

**Entry A3**
- **Source:** Session notes — Claude Code conversation
- **Question:** How precise does the "source" field need to be when adding a Q&A?
- **Answer:** Any readable label works. The source field is plain text stored for your own reference — it is not parsed, not used in embeddings, and has no effect on retrieval or the upgrade output. "Google", "my notes", "experiment Jan 2025", or a full URL are all equally valid. Use whatever helps you remember where the insight came from.
- **Tags:** tool, source-field, ux

---

**Entry A4**
- **Source:** Session notes — Claude Code conversation
- **Question:** What does the "Upgrade Prompt" output contain?
- **Answer:** The upgrade always returns three sections, labelled A, B, C. Section A is the upgraded prompt itself — rewritten to include a clear objective, relevant context from memory, an explicit output format, evaluation criteria, and stated assumptions. Section B is a rationale: 3 to 6 bullet points explaining what was changed and why. Section C is "Used Memory": a list of Q&A item IDs and questions that the model actually incorporated — this is how you verify that retrieval and rewriting are working together.
- **Tags:** tool, upgrade-output, rubric

---

## Cluster B — Prompt Engineering

These 3 entries are about how to write effective prompts. They should be retrieved when you upgrade a prompt about prompt writing, system prompts, or AI instructions.

---

**Entry B1**
- **Source:** Prompting best practices
- **Question:** What makes an AI prompt effective?
- **Answer:** An effective prompt has five elements: (1) a clear role or persona for the AI, (2) relevant background context, (3) a specific task statement — one unambiguous goal, (4) an explicit output format (bullet list, JSON, paragraph, etc.), and (5) constraints — what to avoid or stay within. Optionally add a short example when the format is non-obvious. Specificity beats length: a precise 3-sentence prompt usually outperforms a vague paragraph.
- **Tags:** prompting, best-practices, fundamentals

---

**Entry B2**
- **Source:** Prompting best practices
- **Question:** What is a system prompt and why does it matter?
- **Answer:** A system prompt is a set of instructions given to an AI before any user interaction begins. It defines the AI's persistent behavior: its role, tone, what it should and shouldn't do, and how it should format responses. It matters because it acts as a contract — everything the user says is interpreted in the context the system prompt establishes. A weak or missing system prompt means the AI will make up its own defaults, which may not match what you want.
- **Tags:** prompting, system-prompt, LLM

---

**Entry B3**
- **Source:** Prompting best practices
- **Question:** When should you include an example in a prompt?
- **Answer:** Include an example when the output format is non-obvious or when precision matters. Examples work best for: structured outputs (tables, JSON), a specific writing style or tone, tasks where "correct" is hard to describe but easy to show. Skip examples when the task is straightforward (e.g. "summarize this") or when adding an example would bloat the prompt unnecessarily. One short, well-chosen example is worth more than three mediocre ones.
- **Tags:** prompting, few-shot, examples

---

## Cluster C — RAG & Embeddings

These 3 entries explain the underlying technology. They should be retrieved when you upgrade a prompt about search, memory systems, or semantic retrieval.

---

**Entry C1**
- **Source:** AI fundamentals
- **Question:** What is RAG (Retrieval-Augmented Generation)?
- **Answer:** RAG is a technique where a language model is given retrieved documents as context before generating a response. Instead of relying only on what it learned during training, the model first searches a knowledge base for relevant information and includes that information in its prompt. This makes responses more accurate and grounded in specific facts, without needing to retrain the model. This tool uses RAG: when you upgrade a prompt, it retrieves relevant Q&As from your memory and feeds them to the model as context.
- **Tags:** RAG, retrieval, AI-fundamentals

---

**Entry C2**
- **Source:** AI fundamentals
- **Question:** What is an embedding and how does it represent meaning?
- **Answer:** An embedding is a list of numbers (a vector) that represents the meaning of a piece of text. Similar texts produce similar vectors — the numbers end up close together in mathematical space. The embedding model (in this tool: Gemini text-embedding-004) reads the text and outputs 768 numbers. To find relevant Q&As, the tool embeds your prompt and then finds the Q&As whose vectors are closest to the prompt's vector. This is why retrieval is semantic: it finds meaning-matches, not keyword-matches.
- **Tags:** embeddings, vectors, AI-fundamentals

---

**Entry C3**
- **Source:** AI fundamentals
- **Question:** What is cosine similarity and how is it used to rank search results?
- **Answer:** Cosine similarity measures the angle between two vectors. A score of 1.0 means the vectors point in exactly the same direction — identical meaning. A score of 0 means they are unrelated. The tool uses cosine similarity to rank Q&A items by how relevant they are to your prompt: it calculates the cosine similarity between the prompt's embedding and each stored Q&A's embedding, then returns the top 3. You can see the similarity scores in the Supabase table (stored as floats) and in the "Used Memory" section of upgrade results.
- **Tags:** cosine-similarity, retrieval, AI-fundamentals

---

## Test Prompts

Use these in the **Upgrade a Prompt** section after adding the Q&A entries above. Each is designed to pull from a specific cluster — check that "Used Memory" cites the expected entries.

---

**Test 1 — Should pull from Cluster A (tool knowledge)**
```
Write a prompt that instructs an AI to take a rough draft prompt and return an improved version of it.
```
Expected: entries A1, A4 most relevant (tags feature, output format)

---

**Test 2 — Should pull from Cluster B (prompt engineering)**
```
Write a system prompt for a coding assistant that helps developers debug Python code.
```
Expected: entries B1, B2 most relevant (effective prompts, system prompts)

---

**Test 3 — Should pull from Cluster C (RAG / retrieval)**
```
Write a prompt that instructs an AI to search a knowledge base and summarize the most relevant documents for a given question.
```
Expected: entries C1, C2 most relevant (RAG, embeddings)

---

**Test 4 — Cross-cluster (tool + RAG)**
```
Help me design a personal AI tool that remembers things I've learned and uses them to give better answers over time.
```
Expected: mix of A and C entries

---

**Test 5 — Generic stress test (no strong cluster signal)**
```
Make this better: help me write emails
```
Expected: model may pull from B (prompt engineering) — and should significantly expand the prompt. Good test of whether the upgrade adds value even with a vague input.
