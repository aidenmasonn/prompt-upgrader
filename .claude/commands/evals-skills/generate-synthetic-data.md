# Generate Synthetic Data

Create diverse test inputs for the prompt-upgrader pipeline when real user data is limited.

## When to use this

**Use when:**
- You have fewer than 100 real traces
- You want to stress-test a specific failure mode hypothesis

**Do NOT use when:**
- You already have 100+ representative real prompts — use those instead
- The domain has complex structure that LLMs frequently get wrong (LLMs miss structural details)

## Method: dimension-based tuple generation

Do not ask an LLM to "generate 20 test prompts." This produces homogeneous results.

Instead:
1. Identify 3+ dimensions of variation
2. Generate combinations (tuples) of dimension values
3. Convert tuples to natural language prompts in a separate step

This separation prevents the LLM from defaulting to familiar phrasings.

## Step 1: Define dimensions for this project

Start with these dimensions, adapt based on your actual failure patterns:

| Dimension | Example values |
|---|---|
| Task type | rewrite, extract, summarize, classify, generate, explain, compare |
| Domain | coding, writing, data analysis, customer support, research, creative |
| Prompt length | 3 words, 1 sentence, 2 sentences, paragraph |
| Specificity | vague ("help me write"), specific ("write a Python docstring for a sorting function") |
| Audience | technical, non-technical, child, domain expert |
| Format expectation | prose, JSON, bullets, code, table |

Add more dimensions if your error analysis revealed failures along other axes (e.g., "prompts that use first person" vs. "prompts that describe a system").

## Step 2: Draft 20 tuples

List combinations like:
```
(rewrite, writing, 3 words, vague, non-technical, prose)
(extract, coding, 1 sentence, specific, technical, JSON)
(generate, customer support, 2 sentences, vague, domain expert, bullets)
...
```

Share this list with someone who knows the domain before the next step. Their corrections catch unrealistic combinations (e.g., "3-word technical coding prompt that expects prose" is contrived).

## Step 3: Convert tuples to prompts (LLM-assisted)

Use this prompt template to expand tuples into natural language:

```
Convert each tuple below into a realistic raw prompt a user might type.
Each prompt should reflect the specified dimensions naturally — do not make them sound like test cases.
Use varied phrasing. Output one prompt per line.

Tuples:
[paste your 20 tuples here]
```

## Step 4: Quality filter

Review the generated prompts. Discard:
- Prompts that sound like they were written by a bot
- Near-duplicates (same intent, slightly different wording)
- Prompts where the expected behavior is ambiguous

Target: ~80% pass rate. Regenerate any that fail.

## Step 5: Run through pipeline and save traces

```bash
# Example — run each synthetic prompt through the upgrade API
for prompt in "${PROMPTS[@]}"; do
  curl -s -X POST http://localhost:3000/api/upgrade \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$prompt\"}" >> traces/synthetic-$(date +%Y%m%d).jsonl
done
```

Capture: original prompt + retrieved Q&As + upgraded output + rationale + usedMemory + timestamp.

## Target volume

100 synthetic traces is enough for error analysis. For LLM judge validation, you need balanced labels: ~50 PASS / ~50 FAIL per dimension — meaning you need to run and label the traces after generating them.

## Anti-patterns

- **Single-step generation:** "Give me 50 diverse test prompts" → homogeneous output, clustered around common examples
- **No human review of tuples:** unrealistic combinations slip through
- **Generating then discarding the tuples:** keep the tuple table — it documents your test coverage intentionally
- **Using synthetic data for complex domain-specific content** where the LLM doesn't know the structural rules of the domain

_Source: hamelsmu/evals-skills generate-synthetic-data skill_
