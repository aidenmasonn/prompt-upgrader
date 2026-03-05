# Write Judge Prompt

Design a binary Pass/Fail LLM-as-Judge prompt for one specific failure mode in this prompt-upgrader project.

## Prerequisites (confirm before starting)

1. You have completed error analysis and identified the specific failure mode to evaluate.
2. You have at least 20 labeled Pass examples and 20 labeled Fail examples for this failure mode.
3. You have confirmed this failure mode **cannot** be evaluated by code (regex, schema check, keyword match).

If any prerequisite is missing, stop and run `/evals-skills:error-analysis` first.

## Core rule: binary only

**No Likert scales. No letter grades. No "Partially passes." No partial credit.**

Binary forces a clear decision boundary. If the boundary is unclear, that is a signal the failure mode definition is not specific enough — fix the definition, not the scale.

## Required structure for every judge prompt

Every judge prompt must contain exactly these four elements:

### 1. Evaluation criterion
One specific failure mode. One prompt, one criterion.

**Bad:** "Is this a good upgraded prompt?"
**Good:** "Does the upgraded prompt include all 6 rubric elements defined in the rubric?"

### 2. Binary definitions
Explicit, unambiguous definitions derived from error analysis:

```
PASS: [precise definition — what the output must contain/do]
FAIL: [precise definition — what disqualifies the output]
```

### 3. Few-shot examples
- Minimum: 1 clear pass, 1 clear fail, 1 borderline case
- All examples must come from **training data only** — never from dev or test sets (prevents data leakage)
- Borderline examples teach the judge to calibrate, not just pattern-match

### 4. Structured output (critique-first)
```json
{
  "critique": "...reasoning before verdict...",
  "result": "PASS" | "FAIL"
}
```

The critique-first structure forces the judge to articulate reasoning before committing to a verdict. This reduces flip-flopping and improves calibration.

## Failure modes relevant to this project

Common failure modes to evaluate with LLM judges (keyword heuristics cannot reliably detect these):

| Failure mode | What makes it hard to code-evaluate |
|---|---|
| Assumptions element is present but generic/empty | Keyword "assume" fires even on filler text |
| Rationale bullet cites memory but the quoted passage doesn't match | Needs reading comprehension |
| Output format prescription contradicts the task type (JSON for prose task) | Requires understanding the task |
| Upgraded prompt preserved original intent | Semantic equivalence, not keyword match |
| Constraints are specific vs. generic ("avoid errors" vs. "do not invent product names") | Specificity requires judgment |

## Template

```
You are evaluating whether an upgraded prompt [FAILURE MODE DESCRIPTION].

---
PASS: [exact definition]
FAIL: [exact definition]

---
Examples:

<example index="1" label="PASS">
Input: [original prompt]
Upgraded: [upgraded prompt]
Verdict: PASS
Reason: [why]
</example>

<example index="2" label="FAIL">
Input: [original prompt]
Upgraded: [upgraded prompt]
Verdict: FAIL
Reason: [why]
</example>

<example index="3" label="BORDERLINE">
Input: [original prompt]
Upgraded: [upgraded prompt]
Verdict: FAIL
Reason: [borderline case explanation]
</example>

---
Now evaluate:

Input: {{original_prompt}}
Upgraded: {{upgraded_prompt}}

Return JSON only:
{"critique": "...", "result": "PASS" | "FAIL"}
```

## After writing the judge prompt

Run `/evals-skills:validate-evaluator` to calibrate against human labels before using in any scorecard.

_Source: hamelsmu/evals-skills write-judge-prompt skill_
