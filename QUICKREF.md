# Agent Quick Reference Card (Tiny - ~100 tokens)

> **PURPOSE:** Token-efficient quick rules. Load THIS instead of full docs.
> **LOCATION:** Root directory (QUICKREF.md)

---

## 📁 Quick Folder Reference (Updated March 2, 2026)

```
docs/
├── core/           → README.md, CLAUDE.md, MEMORY.md, DEVELOPMENT_FRAMEWORK.md
├── agents/         → AGENT_TEAM.md, AGENT_SOP.md, AGENT_TEMPLATES.md
├── memory/         → database-patterns.md, api-patterns.md, react-patterns.md
├── debug/          → ERRORS_AND_FIXES.md, PRODUCTION_ERROR_LOG.md
├── reports/        → Sprint reports, office reports
├── sessions/       → Session handoffs, progress tracking
├── testing/        → Test reports
├── qa/             → QA audits
└── guides/         → USER_MANUAL.md, deployment guides
```

---

## 🔴 AGENT WORKFLOW (Read This First)

1. [ ] Read QUICKREF.md (this file - in root)
2. [ ] Read docs/memory/ file for your task ONLY
3. [ ] Check docs/debug/DEBUG.md for recent errors
4. [ ] Check docs/agents/AGENT_TEAM.md for role guidance
5. [ ] Find 2-3 working examples (use Grep)
6. [ ] Plan → Code → Verify (build + test)

**Before claiming "done":** Build succeeds + flow works end-to-end

---

## 🔴 CRITICAL RULES

### Database
```typescript
// ✅ CORRECT
db.select({id: users.id}).from(users).where(eq(users.clerkUserId, id))

// ❌ FORBIDDEN
db.query.users.findFirst()  // Crash!
```

### Auth
```typescript
// ✅ CORRECT
import { requireAuth } from "@/lib/auth-utils";
const { userId } = await requireAuth(['admin']);

// ❌ FORBIDDEN
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth()  // Wrong ID type!
```

### Field Names
```
✅ clerkUserId, schoolId, lastLogin
❌ clerkId, school_id, lastLoginAt
```

### React
```tsx
// ✅ CORRECT
function Comp() {
  const [s] = useState();  // Hooks FIRST
  if (x) return <div/>;
}

// ❌ WRONG
function Comp() {
  if (x) return null;  // Hook crash!
  const [s] = useState();
}
```

### Animation
```tsx
// ✅ CORRECT
transition={{ repeat: Infinity, repeatType: "loop" }}

// ❌ WRONG
transition={{ repeat: Infinity }}  // Crash!
```

---

## System Flow (7 Portals)

```
Clerk Auth → /api/auth/set-role → Check user.type
  ↓
  └─ admin → /admin
  └─ student → /student
  └─ teacher → /teacher
  └─ parent → /parent
  └─ counselor → /counselor
  └─ school-admin → /school-admin
  └─ ministry → /ministry
```

**Setup Wizard:** If `needsSetup: true` → `/setup/unified`

---

## Import Pattern
```typescript
// ✅ ALWAYS use @/
import { X } from "@/lib/...";

// ❌ NEVER use relative
import { X } from "../../lib/...";
```

---

## Token-Saving Strategy

| Task | Read Only |
|------|-----------|
| Database work | QUICKREF.md + docs/memory/database-patterns.md |
| API routes | QUICKREF.md + docs/memory/api-patterns.md |
| React components | QUICKREF.md + docs/memory/react-patterns.md |
| Errors | QUICKREF.md + docs/debug/ERRORS_AND_FIXES.md |
| Agent work | QUICKREF.md + docs/agents/AGENT_TEAM.md |
| Agent SOP | QUICKREF.md + docs/agents/AGENT_SOP.md |

**Don't load everything!** Load QUICKREF.md + ONLY what you need.

---

## Error Quick-Fix

| Error | Fix |
|-------|-----|
| `referencedTable` | Use `db.select().from().leftJoin()` |
| Hooks crash | Move hooks to top of component |
| `iterationCount` | Add `repeatType: "loop"` |
| `clerkId` wrong | Use `clerkUserId` |

---

**Full docs:** See docs/core/CLAUDE.md for links
**System flow:** docs/guides/system-flow-diagram.md
**Agent Team:** docs/agents/AGENT_TEAM.md
**Agent SOP:** docs/agents/AGENT_SOP.md
