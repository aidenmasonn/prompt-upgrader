# Validate Evaluator

Calibrate an LLM judge against human-labeled data before using it in any scorecard.

## Why accuracy is the wrong metric

Accuracy assumes balanced classes. Use **TPR and TNR** instead:

- **TPR (True Positive Rate):** When a human says PASS, how often does the judge say PASS?
- **TNR (True Negative Rate):** When a human says FAIL, how often does the judge say FAIL?

Target: **TPR > 90% AND TNR > 90%** on the dev set before trusting the judge.

## Data split

From your ~100 labeled examples (~50 Pass / ~50 Fail):

| Split | Size | Purpose |
|---|---|---|
| Train | 10-20% | Few-shot examples only (already in judge prompt) |
| Dev | 40-45% | Iterate and tune the judge prompt |
| Test | 40-45% | Final held-out evaluation — touch once |

**Critical:** Never use dev or test examples as few-shot examples in the judge prompt.

## Calibration loop

```
1. Run judge on dev set
2. Compute TPR and TNR
3. If TPR < 90% (judge is too strict):
   → Add more PASS few-shot examples from training set
   → Clarify PASS definition in judge prompt
4. If TNR < 90% (judge is too lenient):
   → Add more FAIL few-shot examples from training set
   → Clarify FAIL definition or add borderline case
5. Repeat until both metrics ≥ 90%
6. Run once on test set — report final numbers
```

## Rogan-Gladen correction for production scoring

When running the judge on unlabeled production data, the observed pass rate is biased. Use the correction formula:

```
theta_hat = (p_obs + TNR - 1) / (TPR + TNR - 1)
```

Where:
- `p_obs` = observed fraction of PASS from the judge
- `TPR` = True Positive Rate from validation
- `TNR` = True Negative Rate from validation
- `theta_hat` = corrected estimate of true pass rate

**Example:** Judge shows 75% pass rate on production data. TPR=0.93, TNR=0.91.
`theta_hat = (0.75 + 0.91 - 1) / (0.93 + 0.91 - 1) = 0.66 / 0.84 = 0.786`

The corrected estimate is ~79%, not 75%.

## Confidence intervals

Small test sets yield wide confidence intervals. Always report both:

```
Point estimate: theta_hat = 0.786
95% CI (bootstrap, 2000 iterations): [0.71, 0.85]
```

Rule of thumb: test set of 50 gives ±7% CI at 95%. Test set of 100 gives ±5%.

## Application to this project

For `scripts/eval.ts`, the dimensions that need LLM judge validation (not just keyword heuristics):

1. **Rubric adherence** — keyword heuristics in `RUBRIC_CHECKS` can be satisfied without actually following the rubric. An LLM judge is needed here.
2. **Citation quality** — the UUID regex confirms format but not whether the citation is semantically valid.
3. **Intent preservation** — did the upgrade preserve the user's original goal?

Start with dimension #1 (rubric adherence) as it has the most impact on the scorecard validity.

## Warning

Never assume a judge "just works" without validation. Judges frequently miss failures or incorrectly flag passing cases. Unvalidated judges in production scorecard = misleading quality metrics.

_Source: hamelsmu/evals-skills validate-evaluator skill_
