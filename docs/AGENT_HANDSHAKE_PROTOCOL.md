# Agent Handshake Protocol

> **Purpose:** Formal handoff system when one agent completes work and another needs to continue
> **Version:** 1.0
> **Created:** February 26, 2026

---

## The Problem

When Agent A completes a task and Agent B needs to continue:
- ❌ Agent B doesn't know what Agent A did
- ❌ Work gets duplicated
- ❌ Context is lost
- ❌ No clear ownership

---

## The Handshake Solution

Every agent must create a **HANDOFF.md** when completing work.

## Handoff File Template

```markdown
# Agent Handoff: [Task Name]

**From:** [Agent Name]
**To:** [Next Agent]
**Date:** [Timestamp]
**Status:** [Complete / Partial / Blocked]

---

## What I Did

1. [Task 1 completed]
2. [Task 2 completed]
3. [Task 3 completed]

---

## Files Modified

| File | Changes |
|------|---------|
| `path/to/file.tsx` | Added component X |
| `path/to/api.ts` | Fixed endpoint Y |

---

## What's Next

The next agent should:

1. [Next task 1]
2. [Next task 2]
3. [Next task 3]

---

## Important Context

- [Critical info for next agent]
- [Things that broke]
- [Things to watch out for]

---

## Files to Read First

1. `path/to/most/important/file.ts`
2. `path/to/second/important/file`

DO NOT READ everything - start with these files.

---

## Token Budget Remaining

- Used: ~X tokens
- Remaining: ~Y tokens
- Recommendation: Start fresh if needed

---

## Blocked On

- [ ] Nothing - ready to hand off
- [ ] [Thing blocking] - needs [resolution]

---

```

---

## Handoff Locations

Create handoff files in: `docs/handoffs/[TASK_NAME]-HANDOFF.md`

---

## Example Handoff

```markdown
# Agent Handoff: Fix Authentication Flow

**From:** Backend Lead Agent
**To:** Implementation Verification Agent
**Date:** 2026-02-26 14:30
**Status:** Complete

---

## What I Did

1. Fixed `/api/auth/set-role` route
2. Updated `requireAuth()` to handle new role types
3. Added Ministry role to database schema
4. Fixed TypeScript errors in auth utils

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/api/auth/set-role/route.ts` | Fixed role detection |
| `src/lib/auth-utils.ts` | Added Ministry role handling |
| `src/lib/db/schema.ts` | Added ministryUsers table |

---

## What's Next

The next agent (Implementation Verifier) should:

1. Start dev server: `npm run dev`
2. Test sign-in flow at http://localhost:3003
3. Verify Ministry role can access /ministry portal
4. Check console for errors
5. Report results

---

## Important Context

- Ministry role was missing from auth utils
- This blocked ministry users from signing in
- Fix is complete but NOT tested in browser yet

---

## Files to Read First

1. `src/lib/auth-utils.ts` - See the changes
2. `src/app/api/auth/set-role/route.ts` - See the fix

DO NOT read entire codebase - start with auth utils.

---

## Token Budget Remaining

- Used: ~12,000 tokens
- Remaining: Plenty
- Recommendation: Continue in same session

---

## Blocked On

- [x] Nothing - ready for browser testing

---
```

---

## Handoff Workflow

```
┌──────────────────┐
│   Agent A        │
│   (Working)      │
└────────┬─────────┘
         │
         │ 1. Completes work
         │ 2. Creates HANDOFF.md
         │
         ▼
┌──────────────────┐
│   HANDSHAKE      │
│   (Handoff File) │
└────────┬─────────┘
         │
         │ 3. Notifies CEO
         │
         ▼
┌──────────────────┐
│   CEO (You)      │
│   Reads HANDOFF  │
└────────┬─────────┘
         │
         │ 4. Spawns Agent B
         │
         ▼
┌──────────────────┐
│   Agent B        │
│   (Reads HANDOFF)│
│   (Continues)    │
└──────────────────┘
```

---

## Handoff Checklist

Before completing work, every agent MUST:

- [ ] Created HANDOFF.md in `docs/handoffs/`
- [ ] Listed all files modified
- [ ] Listed what's next
- [ ] Added important context
- [ ] Noted any blockers
- [ ] Recommended files to read first

---

## For The CEO (You)

When an agent says "I'm done", before spawning next agent:

1. **Read the HANDOFF.md** file
2. **Verify work was actually done** (check git status)
3. **Decide:** Does this need another agent?
4. **If yes:** Include HANDOFF.md content in next agent's prompt
5. **If no:** Mark task complete

---

## Quick Handoff Command

When spawning next agent, include:

```markdown
## Previous Work

A previous agent just completed: [Task]

Read their handoff first: docs/handoffs/[TASK]-HANDOFF.md

Then continue with:
1. [Next step 1]
2. [Next step 2]
```

---

## Handoff Index

All handoffs are tracked in: `docs/handoffs/INDEX.md`

```markdown
# Handoff Index

| Date | From Agent | To Agent | Task | Handoff File |
|------|-----------|----------|------|--------------|
| 2026-02-26 | Backend Lead | Impl. Verifier | Auth Fix | auth-fix-HANDOFF.md |
```

---

**Remember:** The handshake ensures no work is lost and no context is missed between agents.
