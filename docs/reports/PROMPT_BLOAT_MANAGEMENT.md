# Prompt Bloat Management

> **Purpose:** Keep prompts concise to minimize z.ai token costs
> **Rule:** Less context = Faster responses = Lower bills

---

## The Problem

Every token we send costs money. Long prompts = High bills.

**Typical bloat sources:**
- Including entire documentation files
- Repeating the same context in every message
- Not using templates
- Spawning agents with too much context

---

## Token Budget Rules

| Operation | Max Tokens | Cost |
|-----------|-----------|------|
| **Simple fix** | 500 | ~$0.0001 |
| **File edit** | 1,000 | ~$0.0002 |
| **Agent spawn** | 3,000 | ~$0.0006 |
| **Project spawn** | 10,000 | ~$0.002 |

**Our goal:** Keep everything under 3,000 tokens when possible.

---

## Concise Prompt Templates

### ❌ BAD - Too Much Context

```
I need you to fix the authentication bug. Here's the context:

[ENTIRE AGENT_TEAM.md - 5,000 tokens]
[ENTIRE CLAUDE.md - 3,000 tokens]
[ENTIRE MEMORY.md - 2,000 tokens]

Please fix the bug in src/lib/auth-utils.ts where the role detection isn't working properly for ministry users...
```

**Total: ~10,000 tokens = ~$0.02**

### ✅ GOOD - Just What's Needed

```
Fix auth bug: Ministry users can't sign in.

File: src/lib/auth-utils.ts (line 465)
Issue: Role detection returns undefined for ministry role
Expected: Should return "ministry"

Read only auth-utils.ts, then fix.
```

**Total: ~100 tokens = ~$0.0002**

**100x cheaper!**

---

## Agent Spawning Rules

### ❌ BAD - Full Context

```
You are the Backend Lead Agent. Here's everything you need:

[Pastes 10 documentation files - 15,000 tokens]

Please create a new API route for student homework submission...
```

### ✅ GOOD - Minimal Context

```
You are Backend Lead. Create API route: POST /api/student/homework

File: src/app/api/student/homework/route.ts
Auth: requireAuth(['student'])
DB: Use db.select().from(homeworkSubmissions)

Only create the route. Don't read docs.
```

---

## Reference by Link, Not by Content

### ❌ BAD

```
Here's the database pattern to follow:

[Pastes entire docs/memory/database-patterns.md - 2,000 tokens]
```

### ✅ GOOD

```
Use db pattern from: docs/memory/database-patterns.md

Key rule: db.select().from().where() - never db.query.*
```

---

## Agent Handoff - Minimal Format

### ❌ BAD - Verbose Handoff

```
I've completed the auth fix. Here's everything I did:

[Long explanation of every step]
[Full diff of changes]
[Multiple file contents]

Next agent should continue...
```

### ✅ GOOD - Concise Handoff

```
# HANDOFF: Auth Fix

**Done:** Fixed ministry role in auth-utils.ts
**Files:** src/lib/auth-utils.ts (line 465)
**Next:** Test at /api/auth/set-role

See: docs/handoffs/auth-fix.md
```

---

## Quick Reference Card

| Task | Tokens | Use This |
|------|--------|----------|
| Simple edit | 100 | "Fix X in file Y" |
| New component | 500 | "Create component at path" |
| Agent spawn | 3,000 | Template from AGENT_TEMPLATES.md |
| Project task | 10,000 | Route through Project Manager |

---

## The 3-Question Rule

Before any operation, ask:

1. **Can I do this in <100 tokens?**
   - Yes → Do it directly
   - No → Use template

2. **Do I need full docs?**
   - No → Reference by link
   - Yes → Read only what's needed

3. **Can an agent handle this?**
   - Yes → Spawn with minimal context
   - No → Route to Project Manager

---

## Cost Comparison

| Approach | Tokens | Cost (per 100 ops) |
|----------|--------|-------------------|
| Verbose prompts | 10,000 | $2.00 |
| Concise prompts | 300 | $0.06 |
| **Savings** | **97%** | **$1.94** |

---

## Template: Minimal Agent Spawn

```
# Agent: [Role]
# Task: [One sentence]
# File: [path/to/file]
# Context: [2-3 key rules only]

Start working. Read docs only if stuck.
```

---

## Remember

**Every token counts.**
**Less context = Cheaper.**
**Links > Content.**
**Templates > Custom prompts.**
