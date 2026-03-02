# Agent Handoff - Simple Format

> **Purpose:** Pass work between agents without bloat
> **Rule:** One handoff = Max 200 tokens

---

## The Handoff Format

```markdown
# HANDOFF: [Task Name]

FROM: [Agent]
TO: [Next Agent]

DONE:
- [What I did - bullet points]

FILES:
- [File modified]

NEXT:
- [What to do next - one sentence]

CTX: [Critical context - max 1 line]
```

---

## Example

```markdown
# HANDOFF: Fix Auth Bug

FROM: Backend Lead
TO: Implementation Verifier

DONE:
- Fixed ministry role detection
- Added ministry to allowedRoles

FILES:
- src/lib/auth-utils.ts:465

NEXT:
- Test sign-in with ministry user

CTX: Ministry role was missing from allowedRoles array
```

---

## Where To Put Handoffs

```
docs/handoffs/[TASK-NAME].md
```

---

## How To Handoff

**Option 1: Reference**
```
Read handoff first: docs/handoffs/auth-fix.md
Then continue.
```

**Option 2: Include**
```
# HANDOFF: Auth Bug
[paste handoff content]

Now continue with testing.
```

---

## Rules

1. **Max 200 tokens** per handoff
2. **Bullet points only** - no paragraphs
3. **File paths only** - no file content
4. **One line context** - critical info only

---

## This Saves Money

| Approach | Tokens |
|----------|--------|
| Verbose handoff | 2,000 |
| This format | 100 |
| **Savings** | **95%** |
