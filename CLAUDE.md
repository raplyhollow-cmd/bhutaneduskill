# Career Compass + School Management System

**Project:** B2B SaaS Multi-tenant School Management Platform
**Target:** Bhutan Middle Schools (Class 6-12)
**Tech Stack:** Next.js 16 + TypeScript + Neon PostgreSQL + Clerk + Vercel
**Last Updated:** February 16, 2026
**Local URL:** http://localhost:3003

---

# TOR (Table of Rules) - Quick Confirmation Reference

> **Purpose:** This section contains ALL critical rules for fast agent confirmation. Bookmark this section.

## 1. CRITICAL: Framer Motion Rules (NEVER VIOLATE)

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
