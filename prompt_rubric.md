# Prompt Upgrade Rubric (V2)

When upgrading a prompt, always add these elements:

1. **Clear objective** — one sentence stating exactly what the AI should accomplish
2. **Constraints / context** — what the AI should and should not do; incorporate relevant Q&A context
3. **Output format** — match the format to the task. Use JSON only if the output is genuinely structured data. Use plain prose, bullets, or code blocks when that fits better.
4. **Evaluation criteria** — what a "good" response looks like (be specific)
5. **Assumptions** — always state them, even if they seem obvious. This element is mandatory.
6. **Example** — include one short, concrete input→output example if the output format is non-obvious or precision matters

---

## Examples of good upgrades

### Example A — Output is structured data (JSON appropriate)

**Original:** `Write a prompt that extracts product names and prices from a receipt.`

**Upgraded:**
```
You are a data extraction assistant. Your objective is to extract every product name and its price from the receipt text provided.

Constraints: Extract only what is explicitly stated. Do not infer prices. If a line is ambiguous, skip it.

Output format: Return a JSON array where each item has "product" (string) and "price" (number in dollars):
[{"product": "Whole milk 1L", "price": 2.49}, ...]

Evaluation criteria: Every line-item from the receipt is present; no items are invented; prices are numeric (not strings).

Assumptions: The receipt is in English. Prices are in USD. Tax lines should be excluded.

Example:
Input: "Bread $3.50 / Eggs $4.00 / Total $7.50"
Output: [{"product": "Bread", "price": 3.50}, {"product": "Eggs", "price": 4.00}]
```

---

### Example B — Output is prose (JSON not appropriate)

**Original:** `Help me write a cold email to a potential client.`

**Upgraded:**
```
You are an expert business writer. Your objective is to draft a concise, professional cold email that introduces me and proposes a specific next step.

Constraints: Keep the email under 150 words. Avoid jargon and generic openers like "I hope this finds you well." Focus on one value proposition, not a list of features. Do not use a formal sign-off like "Sincerely" — end with a clear call to action.

Output format: Plain prose with a subject line on the first line, a blank line, then the email body. No JSON, no bullet lists.

Evaluation criteria: The email is specific enough to feel personal, proposes one concrete next step, and reads naturally out loud.

Assumptions: I will fill in [Company], [Name], and [Context] placeholders before sending. The recipient has not heard of me before.

Example:
Subject: Quick question about [Company]'s onboarding flow
Hi [Name], I noticed [Company] recently launched a self-serve tier — congrats. I work with SaaS teams to cut first-week churn by improving onboarding copy. Worth a 20-min call this week? [Your name]
```

---

## Format rules

- Do NOT default to JSON. Use it only when the output is genuinely structured data (tables, arrays, key-value pairs).
- Preserve the author's intent and voice — upgrade, don't replace.
- If a relevant Q&A from memory addresses the task, incorporate its specific insight as a constraint or context item.
- Every upgrade must include all 6 elements above. Element 5 (Assumptions) is never optional.
