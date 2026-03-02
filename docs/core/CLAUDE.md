# Bhutan EduSkill - Agent Memory (TOR)

> **PROJECT:** B2B SaaS Multi-tenant School Management Platform
> **TARGET:** Bhutan Middle Schools (Class 6-12)
> **TECH STACK:** Next.js 16 + TypeScript + Neon PostgreSQL + Clerk + Vercel
> **LOCAL URL:** http://localhost:3003
> **LAST UPDATED:** February 26, 2026

---

# TOR (Table of Rules) - Quick Reference

> **PURPOSE:** ALL agents MUST read this before starting work. Contains ALL critical rules.

## 🖥️ AUTO-MONITORING (All Agents MUST Self-Enforce)

**Every agent automatically monitors itself. NO user reminder needed.**

| Metric | Check Point | Auto-Action |
|--------|-------------|-------------|
| **Token Usage** | Every 5 tool calls | If >150k: Wrap up. If >180k: STOP immediately |
| **Context Growing** | Every response | If conversation >50 messages: Request new session |
| **Task Stuck** | After 3 failed attempts | Report to user, suggest alternative approach |
| **Build Status** | After code changes | Run `npx tsc --noEmit` - if fails, fix before continuing |

```
AGENT SELF-CHECK (Automatic):
1. Am I approaching 150k tokens? → YES: Summarize, wrap up
2. Did I just change code? → YES: Type check it
3. Is task taking too long? → YES: Break into subtask
4. Are 3+ agents already running? → YES: Queue self, wait
```

**IMPORTANT:** If you crash from token overflow, you failed at self-monitoring.

## ⚠️ CRITICAL: Agent Spawning Rules (February 26, 2026)

**To prevent agent crashes from context overflow:**

### Decision Tree

```
Is your task <5 files and <30k tokens?
├─ YES → Spawn specialist agent directly
└─ NO  → Start with Project Manager first
```

### Large Task Indicators (NEVER spawn directly)

- "Audit all portals"
- "Fix all components"
- "Review entire codebase"
- "Scan 50+ files"
- "Integrate across all pages"

### If You Ignore This Rule

- **Result:** Agent crashes with "exceeds context" error
- **See:** [AGENT_TEAM.md](AGENT_TEAM.md) for full protocol

---

## 🔴 CRITICAL - MUST READ FIRST (Agent Checklist)

| Task Area | Read This File | When to Read |
|-------------|---------------|--------------|
| **System Flow** | [docs/system-flow-diagram.md](docs/system-flow-diagram.md) | ⭐ FIRST - Before ANY work |
| **Database queries** | [docs/memory/database-patterns.md](docs/memory/database-patterns.md) | Database work |
| **API routes** | [docs/memory/api-patterns.md](docs/memory/api-patterns.md) | API work |
| **React components** | [docs/memory/react-patterns.md](docs/memory/react-patterns.md) | UI work |
| **Common mistakes** | [docs/memory/common-mistakes.md](docs/memory/common-mistakes.md) | Quick check |
| **Error fixes** | [docs/ERRORS_AND_FIXES.md](docs/ERRORS_AND_FIXES.md) | When stuck |
| **Development framework** | [docs/DEVELOPMENT_FRAMEWORK.md](docs/DEVELOPMENT_FRAMEWORK.md) | New to project |
| **Agent SOP** | [AGENT_SOP.md](AGENT_SOP.md) | ⭐ FIRST TIME - Read once |

## 1. CRITICAL: Database Query Rules

| Rule | Why | Fix |
|------|-----|-----|
| **NEVER use `db.query.*` API** | `neon-http` driver doesn't support it | Use `db.select().from().leftJoin()` |
| **NEVER use `clerkId`** | Wrong field name | Use `clerkUserId` |
| **NEVER use `school_id`** | Drizzle uses camelCase | Use `schoolId` |
| **ALWAYS verify columns exist** | Code expects columns that may not exist | Check schema.ts before using |

**CORRECT Pattern:**
```typescript
import { db } from "@/lib/db";
import { users, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const user = await db
  .select({ id: users.id, name: users.name })
  .from(users)
  .where(eq(users.clerkUserId, clerkUserId));
```

## 2. CRITICAL: Authentication Rules

| Pattern | Use | NEVER Use |
|---------|-----|------------|
| **Authentication** | `requireAuth()` from `@/lib/auth-utils` | `auth()` from Clerk |
| **Field names** | `clerkUserId`, `schoolId` | `clerkId`, `school_id` |
| **Return value** | `userId: user.id` (database ID) | `clerkUserId` (Clerk ID) |

## 3. CRITICAL: React Component Rules

| Rule | Why | Fix |
|------|-----|-----|
| **ALL hooks at component top** | React requires same hook order every render | Declare hooks BEFORE any conditionals |
| **"use client" for hooks** | Server components can't use hooks | Add `"use client";` at top |
| **repeat: Infinity needs repeatType** | Prevents animation errors | Always add `repeatType: "loop"` |

## 4. CRITICAL: TypeScript & Imports

| Rule | Status |
|------|--------|
| No new `any` types | MANDATORY |
| Use `@/` imports only | REQUIRED |
| Build after each file | REQUIRED |

---

## 5. QUICK LINKS (Documentation Index)

| Documentation | Purpose |
|--------------|----------|
| [docs/memory/database-patterns.md](docs/memory/database-patterns.md) | Database query rules |
| [docs/memory/api-patterns.md](docs/memory/api-patterns.md) | API route templates |
| [docs/memory/react-patterns.md](docs/memory/react-patterns.md) | React component rules |
| [docs/memory/common-mistakes.md](docs/memory/common-mistakes.md) | Anti-patterns to avoid |
| [docs/ERRORS_AND_FIXES.md](docs/ERRORS_AND_FIXES.md) | Error documentation |
| [docs/DEVELOPMENT_FRAMEWORK.md](docs/DEVELOPMENT_FRAMEWORK.md) | Development framework |
| [AGENT_SOP.md](AGENT_SOP.md) | Agent SOP |

---

## CURRENT PROJECT STATUS

- **Database:** Using neon-http driver, `db.query` API DISABLED
- **Relations:** All 21 relations disabled (circular reference issues)
- **Authentication:** `requireAuth()` pattern established
- **Type Safety:** 300+ `any` types exist - don't add more
- **Build:** Succeeds with warnings

---

## FOR AGENTS: HOW TO USE THIS SYSTEM

1. **Read the relevant docs/memory/ file** for your task
2. **Copy working patterns** from the codebase (don't guess)
3. **Follow AGENT_SOP.md** strict rules
4. **Document new errors** so other agents don't repeat them
5. **Update docs/memory/** when you discover new working patterns

---

# PORTAL ROUTES (Quick Reference)

| Rule | Why | Fix |
|------|-----|-----|
| `repeat: Infinity` MUST have `repeatType: "loop"` | Causes `iterationCount must be non-negative` error | Add `repeatType: "loop"` to ALL infinite animations |
| NEVER use keyframes like `y: [0, 0]` or `x: [0, 0]` | No movement causes error | Use actual motion values or remove animation |
| Prefer CSS animations for simple effects | More performant | Use `@keyframes` in CSS files |

**CORRECT Pattern:**
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{ repeat: Infinity, repeatType: "loop", duration: 2 }}
/>
```

**WRONG Pattern:**
```tsx
transition={{ repeat: Infinity, duration: 2 }}  // Missing repeatType!
animate={{ y: [0, 0] }}  // No movement!
```

## 2. CRITICAL: Database Field Names

| Field | Use | NEVER Use |
|-------|-----|-----------|
| `clerkUserId` | Querying users table | `clerkId` |
| `schoolId` | Linking to school | N/A |
| `tenantId` | Multi-tenant isolation | N/A |

**RBAC Tables:** Use `user_roles` (snake_case), NOT `userRoles` from rbac-schema

## 3. CRITICAL: Authentication Patterns

### Platform Admin Bypass Pattern
Platform admins skip ALL onboarding/setup. 3 files must work together:

```tsx
// 1. src/app/api/auth/set-role/route.ts - Return needsSetup: false
if (user.type === 'admin') {
  return NextResponse.json({ userType: user.type, needsSetup: false });
}

// 2. src/app/admin/layout.tsx - Early return BEFORE needsSetup check
if (roleData.userType === 'admin') {
  setUserType('admin');
  return; // Skip setup redirect
}

// 3. src/app/dashboard/page.tsx - Redirect to /admin
if (roleData.userType === 'admin') {
  router.push('/admin');
  return;
}
```

### Setup APIs: Create User If Not Exists
All 6 setup APIs (student, teacher, parent, counselor, school-admin, admin) MUST:

```typescript
// Check if user exists
let userRecord = await db.select().from(users).where(eq(users.clerkUserId, user.id)).limit(1);

// CREATE if not exists (Clerk auth ≠ database user)
if (userRecord.length === 0) {
  await db.insert(users).values({
    id: `user-${nanoid()}`,
    clerkUserId: user.id, // CRITICAL: Use clerkUserId, NOT clerkId
    type: "student", // or admin, teacher, etc.
    // ... other fields
  });
}
```

### requireAuth() Return Value
```typescript
// src/lib/auth-utils.ts line 465
return { user, userId: user.id }; // userId must be DATABASE ID, not Clerk ID
```

## 4. CRITICAL: TypeScript Rules

| Rule | Status | Action |
|------|--------|--------|
| `strict: false` | Keep OFF | 200+ `any` types still exist |
| No new `any` types | MANDATORY | Use proper types for new code |
| Build after each file | REQUIRED | Don't batch changes without builds |
| Use `@/` imports | REQUIRED | NEVER use relative paths like `../` |

## 5. CRITICAL: Tailwind/Gradient Rules

| Rule | Why | Fix |
|------|-----|-----|
| NEVER use Tailwind gradient classes | Build errors | Use inline styles |
| `from-hunter-green-*`, `to-hunter-green-*` | Don't exist | Avoid |
| `bg-ash-grey-*` | Don't exist | Avoid |

**CORRECT Pattern:**
```tsx
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
```

**WRONG Pattern:**
```tsx
<div className="from-orange-500 to-orange-600">  // Don't use Tailwind for gradients
```

## 6. Portal Colors (RGB)

| Portal | Gradient |
|--------|----------|
| Student | `rgb(249 115 22) → rgb(194 65 12)` |
| Teacher | `rgb(59 130 246) → rgb(37 99 235)` |
| Parent | `rgb(107 114 128) → rgb(75 85 99)` |
| Counselor | `rgb(168 85 247) → rgb(147 51 234)` |
| Admin | `rgb(236 72 153) → rgb(219 39 119)` |
| School Admin | `rgb(139 92 246) → rgb(124 58 237)` |

## 7. Boolean Types (PostgreSQL)

```tsx
isPrivate: !!value  // NOT value ? 1 : 0
isActive: !!value   // PostgreSQL uses true/false, not 0/1
```

## 8. API Route Pattern (Use This Template)

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    const { userId, user } = await requireAuth(['admin']); // Add role check if needed

    // Route logic here
    const data = await someOperation();

    logger.info("Route executed", { route: "/api/endpoint", userId });

    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });
    return Response.json(
      { success: false, error: "Message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
```

## 9. Import Pattern

**ALWAYS use:**
```typescript
import { X } from "@/lib/..."
import { Y } from "@/components/..."
```

**NEVER use:**
```typescript
import { X } from "../../lib/..."  // DON'T DO THIS
```

## 10. Error Handling Pattern

```typescript
// For API calls and database queries
try {
  const result = await db.select().from(users);
  return result;
} catch (error) {
  logger.error(error);
  // Handle gracefully or fallback
}
```

## 11. Batch-Fix Pattern (When to Use)

| Use Batch Fix When | Use Individual Fix When |
|-------------------|----------------------|
| Same error across 100+ files | Individual logic bugs |
| Schema/database mismatches | Feature-specific issues |
| Missing properties/fields | UX/interaction issues |

**How to Batch-Fix:**
```bash
# 1. Scan all errors
npx tsc --noEmit 2>&1 | tee errors.txt

# 2. Analyze patterns
# 3. Fix all at once in one file
# 4. Verify
npx tsc --noEmit
```

## 12. Portal Authentication Flow

All 7 portal layouts follow this pattern:

```tsx
"use client";

export default function PortalLayout({ children }) {
  const router = useRouter();
  const [needsSetup, setNeedsSetup] = useState(false);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
      .then(([roleRes, profileRes]) => Promise.all([roleRes.json(), profileRes.json()]))
      .then(([roleData, profileData]) => {
        if (roleData.needsSetup || !roleData.userType) {
          setNeedsSetup(true);
          setTimeout(() => router.push("/setup/unified"), 100);
          return;
        }
        setUserType(roleData.userType);
      })
      .catch(() => {
        setNeedsSetup(true);
        setTimeout(() => router.push("/setup/unified"), 100);
      });
  }, [router]);

  if (needsSetup) {
    return <RedirectingToSetup />;
  }

  return <PortalSidebar>{children}</PortalSidebar>;
}
```

## 13. Files to Check Before Modifying

| Task | Check These Files First |
|------|------------------------|
| Add new API route | `src/lib/auth-utils.ts`, `src/types/index.ts` |
| Modify database schema | `src/lib/db/schema.ts`, run `npx tsc --noEmit` |
| Add animation | Review Framer Motion rules above |
| Change auth flow | All 7 portal `layout.tsx` files, `/api/auth/set-role` |
| Add gradient styles | Use inline styles, NEVER Tailwind classes |

## 14. Development Commands

```bash
npm run dev          # Start dev server (port 3003)
npm run build        # Production build (may need NODE_OPTIONS="--max-old-space-size=16384")
npm run db:push      # Push schema to Neon PostgreSQL
npm run db:studio    # Open Drizzle Studio
npx tsc --noEmit     # Type check without build
```

## 15. Key Files Reference

| File | Purpose |
|------|---------|
| `docs/DEVELOPMENT_FRAMEWORK.md` | **Single source of truth** for all patterns |
| `docs/README.md` | Documentation index |
| `docs/CHANGELOG.md` | Version history |
| `src/lib/auth-utils.ts` | `requireAuth(allowedRoles?)` helper |
| `src/lib/logger.ts` | debug/info/warn/error/security logging |
| `src/types/index.ts` | ApiSuccess<T>, ApiErrorResponse types |
| `src/middleware.ts` | CORS + security headers |
| `src/lib/db/schema.ts` | Main database schema (90+ tables) |
| `MEMORY.md` | Project memory with fixes and patterns |

---

# Portal Routes (Quick Reference)

| Portal | Route | Key Pages |
|--------|-------|-----------|
| **Student** | `/student` | dashboard, classes, homework, plan, progress, rub, hostel, library, transport |
| **Teacher** | `/teacher` | dashboard, students, homework/create, assessments, attendance, earnings |
| **Parent** | `/parent` | dashboard, children, progress, fees/pay |
| **Counselor** | `/counselor` | dashboard, students, interventions, sessions, notes |
| **School Admin** | `/school-admin` | dashboard, students/create, teachers/create, timetable, reports |
| **Platform Admin** | `/admin` | dashboard, schools, users, partners, notifications, analytics |
| **Ministry** | `/ministry` | dashboard, schools, analytics, notifications, billing, policies |
| **Ministry Setup** | `/setup/ministry` | 3-step wizard (verify → details → complete) |

---

# Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Build out of memory | `set NODE_OPTIONS=--max-old-space-size=16384` |
| Platform admin redirected to setup | Check 3 files: set-role API, admin layout, dashboard |
| "User not found" in setup | Ensure API creates user if not exists |
| Permission errors | Check `requireAuth()` returns database userId |
| Clerk ID mismatch | Run `scripts/fix-clerk-id.js` |
| TypeScript errors | Batch-fix with `npx tsc --noEmit` first |

---

# Documentation Index

> **Documentation has been reorganized!** See [docs/README.md](docs/README.md) for the complete index.

| Topic | File |
|-------|------|
| **Development Framework** | [docs/DEVELOPMENT_FRAMEWORK.md](docs/DEVELOPMENT_FRAMEWORK.md) - **READ THIS FIRST** |
| **Documentation Index** | [docs/README.md](docs/README.md) |
| Changelog | [docs/CHANGELOG.md](docs/CHANGELOG.md) |
| Architecture | [docs/architecture/](docs/architecture/) |
| Design System | [docs/design/](docs/design/) |
| Guides | [docs/guides/](docs/guides/) |
| Plans | [docs/plans/](docs/plans/) |
| Project Memory | [MEMORY.md](MEMORY.md) |

---

# Summary

| Question | Answer |
|-----------|---------|
| **Project type?** | B2B SaaS (Multi-tenant School Management) |
| **Target?** | Bhutan Middle Schools (Class 6-12) |
| **Tech stack?** | Next.js 16 + TypeScript + Neon PostgreSQL + Clerk |
| **Critical rule?** | Framer Motion needs `repeatType: "loop"` |
| **Database field?** | Use `clerkUserId`, NEVER `clerkId` |
| **Import pattern?** | Always use `@/`, NEVER relative paths |
| **Build check?** | Run `npx tsc --noEmit` before committing |
