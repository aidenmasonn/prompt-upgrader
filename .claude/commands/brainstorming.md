# Brainstorming

Transform a vague idea into a vetted design before any implementation begins.

## The hard gate

**Do NOT write any code, create any files, or take any implementation action until:**
1. You have presented a design
2. The user has explicitly approved it

This applies even for changes that seem "too small to need a design."

## Six-step process

### Step 1: Context exploration
Before asking any questions, read existing project files:
- Read `claude.md` for project architecture and style rules
- Read relevant files in `lib/`, `app/`, `scripts/` that relate to the request
- Check `docs/progress.md` for recent decisions
- Review recent commits for context

**Do this first. Never ask questions you could answer by reading the codebase.**

### Step 2: Clarifying questions
Ask at most **one question at a time**. Multiple questions at once overwhelm and slow the conversation.

Prioritize:
1. What is the goal? (If unclear from context)
2. What constraints exist? (Performance, backwards compatibility, scope)
3. What does "done" look like?

Use multiple-choice format when possible:
> "Should the new top-k setting be (a) a UI slider, (b) an environment variable, or (c) a URL parameter?"

### Step 3: Approach exploration
Present **2-3 alternative approaches** with explicit trade-offs:

```
Option A: [brief name]
  What: [1 sentence]
  Pros: [1-2 bullets]
  Cons: [1-2 bullets]
  My recommendation: [yes/no and why]

Option B: [brief name]
  ...
```

Apply YAGNI ruthlessly: eliminate any option that adds features you don't need right now.

### Step 4: Design presentation
Present the design in sections, sized to complexity:

- **Small change (1-3 files):** one-paragraph design, ask "OK to proceed?"
- **Medium change (4-10 files):** file-by-file plan, ask approval after each section
- **Large change (10+ files):** architecture diagram in text, phased rollout, approval gates

### Step 5: Documentation
Before writing code, commit the approved design:

```bash
mkdir -p docs/plans
# Write to: docs/plans/YYYY-MM-DD-<topic>-design.md
```

Include: problem statement, chosen approach, rejected alternatives (with reasons), and files to be changed.

### Step 6: Implementation planning only
After design approval, the output of this skill is a written plan — not code.
Use this plan as input to actual implementation.

## Common anti-patterns to avoid

| Anti-pattern | Better approach |
|---|---|
| "I'll just make a quick change" | Write the one-paragraph design first |
| Asking 5 questions at once | Ask the most important one; others may resolve themselves |
| Designing for hypothetical future requirements | Design for what's needed now; V2 is a future decision |
| Presenting only one option | Present 2-3 so trade-offs are explicit |

_Source: obra/superpowers brainstorming skill_
