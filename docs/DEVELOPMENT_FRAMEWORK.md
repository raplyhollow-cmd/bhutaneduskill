# Bhutan EduSkill Development Framework

> **READ THIS FIRST** - This is the single source of truth for how to work on this project.

**Last Updated:** 2026-02-16

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Quick Start](#2-quick-start)
3. [Architecture Overview](#3-architecture-overview)
4. [Coding Rules](#4-coding-rules)
5. [API Development](#5-api-development)
6. [Database Operations](#6-database-operations)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [Styling Rules](#8-styling-rules)
9. [Error Handling](#9-error-handling)
10. [Common Pitfalls](#10-common-pitfalls)
11. [Troubleshooting](#11-troubleshooting)
12. [Resources](#12-resources)

---

## 1. Project Overview

### What
B2B SaaS (Business-to-Business Software as a Service) multi-tenant school management platform with integrated career guidance.

### Target
Middle schools in Bhutan (Class 6-12)

### Business Model
Subscription-based - schools pay per user/seat

### Tech Stack
| Technology | Purpose |
|------------|---------|
| Next.js 16 | React framework |
| TypeScript | Type safety |
| Neon PostgreSQL | Database |
| Clerk | Authentication |
| Vercel | Hosting |
| Drizzle ORM | Database queries |
| Framer Motion | Animations |

### Local Development
```bash
npm run dev          # Start dev server (port 3003)
npm run build        # Production build
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio
npx tsc --noEmit     # Type check without build
```

---

## 2. Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database (Neon recommended)
- Clerk account with application configured

### First Time Setup
1. Clone the repository
2. Copy `.env.example` to `.env` and fill in values
3. Run `npm install`
4. Run `npm run db:push` to set up database schema
5. Run `npm run dev`

### Environment Variables
```env
# Database
DATABASE_URL=postgresql://...

# Clerk (Authentication)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
CLERK_SECRET_KEY_TEMPLATE=sk_...

# AI (Optional)
GEMINI_API_KEY=...  # For AI features
```

---

## 3. Architecture Overview

### 7 Portals
| Portal | Route | Purpose | Color |
|--------|-------|---------|-------|
| Student | `/student` | Classes, homework, career planning | Orange |
| Teacher | `/teacher` | Student management, assessments | Blue |
| Parent | `/parent` | Child progress, fees | Gray |
| Counselor | `/counselor` | Student interventions, sessions | Purple |
| School Admin | `/school-admin` | School management | Violet |
| Platform Admin | `/admin` | Multi-school management | Pink |
| Ministry | `/ministry` | National oversight | Purple/Violet |

### Multi-Tenant Structure
- Each school is isolated by `schoolId`
- Platform admins can access all schools
- RBAC system controls feature access

### Database Schema
- 90+ tables
- Key tables: `users`, `schools`, `assessments`, `careers`, `user_roles`
- See [docs/architecture/database-schema.md](architecture/database-schema.md) for full schema

---

## 4. Coding Rules

### 4.1 Import Pattern (CRITICAL)

**ALWAYS use `@/` alias:**
```typescript
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
```

**NEVER use relative paths:**
```typescript
// DON'T DO THIS
import { Button } from "../../components/ui/button";
import { requireAuth } from "../../../lib/auth-utils";
```

### 4.2 Database Field Names

| Correct | Wrong | Notes |
|---------|-------|-------|
| `clerkUserId` | `clerkId` | Used for Clerk user lookups |
| `schoolId` | `school_id` | Use camelCase |
| `tenantId` | `tenant_id` | Multi-tenant isolation |
| `lastLogin` | `lastLoginAt` | Date fields don't use At suffix |

**RBAC Tables:** Use `user_roles` (snake_case), NOT `userRoles` from rbac-schema

### 4.3 TypeScript Rules

| Rule | Why |
|------|-----|
| NO new `any` types | 200+ existing `any` types cause issues |
| Build after each file | Errors accumulate, harder to fix later |
| Use proper types from `@/types` | Type safety prevents runtime errors |

```typescript
// GOOD
import type { ApiSuccess, ApiErrorResponse } from "@/types";

function processData(data: UserData): ProcessedResult {
  // ...
}

// BAD
function processData(data: any): any {
  // ...
}
```

### 4.4 Boolean Types (PostgreSQL)
```typescript
// PostgreSQL uses true/false, not 0/1
isPrivate: !!value
isActive: !!value
hasAccess: !!value

// NOT this:
isPrivate: value ? 1 : 0
```

### 4.5 File Organization
```
src/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth routes (sign-in, sign-up)
│   ├── (public)/          # Public pages (home, about)
│   ├── api/               # API routes
│   ├── student/           # Student portal
│   ├── teacher/           # Teacher portal
│   └── admin/             # Admin portal
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── shared/            # Cross-portal components
│   ├── admin/             # Admin-specific components
│   └── student/           # Student-specific components
├── lib/
│   ├── auth-utils.ts      # Authentication helpers
│   ├── logger.ts          # Logging utilities
│   └── db/                # Database utilities
└── types/
    └── index.ts           # TypeScript types
```

---

## 5. API Development

### API Route Template

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    // 1. Authenticate (optionally with role check)
    const { userId, user } = await requireAuth(['admin']);

    // 2. Business logic
    const data = await someOperation();

    // 3. Log success
    logger.info("Route executed", { route: "/api/endpoint", userId });

    // 4. Return response
    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    // 5. Log error with context
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });

    // 6. Return error response
    return Response.json(
      { success: false, error: "Error message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
```

### requireAuth() Usage

```typescript
// Basic auth check
const { userId, user } = await requireAuth();

// With role requirement
const { userId, user } = await requireAuth(['admin', 'school-admin']);

// Returns NextResponse error if:
// - Not authenticated (401)
// - User not found (404)
// - Role not allowed (403)
```

### API Response Types

```typescript
// Success response
{ success: true, data: T }

// Error response
{ success: false, error: string }

// Import types
import type { ApiSuccess, ApiErrorResponse } from "@/types";
```

---

## 6. Database Operations

### Query Pattern

```typescript
import { db } from "@/lib/db";
import { users, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// Simple query
const user = await db.select().from(users).where(eq(users.id, userId));

// With joins
const userWithSchool = await db
  .select({
    userName: users.name,
    schoolName: schools.name,
  })
  .from(users)
  .innerJoin(schools, eq(users.schoolId, schools.id))
  .where(eq(users.id, userId));
```

### JSON Field Handling

Some fields are stored as TEXT but contain JSON - MUST parse before use:

```typescript
import { parseJsonArray } from "@/lib/db";

// Parse JSON array from text field
const subjects = parseJsonArray<string>(user.subjects);
const facilities = parseJsonArray<string>(school.facilities);
```

### Insert Pattern

```typescript
import { nanoid } from 'nanoid';

const recordId = `record_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

const [newRecord] = await db.insert(table).values({
  id: recordId,  // IMPORTANT: Include id in insert
  // ... other fields
}).returning();
```

### Critical Field Names for Queries

| Field | Type | Notes |
|-------|------|-------|
| `clerkUserId` | TEXT | Use for Clerk user lookups (NOT `clerkId`) |
| `schoolId` | TEXT | Link to school |
| `tenantId` | TEXT | Multi-tenant isolation |
| `lastLogin` | TEXT | Timestamp string (NOT `lastLoginAt`) |

---

## 7. Authentication & Authorization

### Portal Authentication Pattern

All portal layouts follow this pattern:

```tsx
"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";

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

### Platform Admin Bypass

Platform admins skip ALL onboarding/setup. Three files must work together:

```typescript
// 1. src/app/api/auth/set-role/route.ts
if (user.type === 'admin') {
  return NextResponse.json({ userType: user.type, needsSetup: false });
}

// 2. src/app/admin/layout.tsx
if (roleData.userType === 'admin') {
  setUserType('admin');
  return; // Skip setup redirect
}

// 3. src/app/dashboard/page.tsx
if (roleData.userType === 'admin') {
  router.push('/admin');
  return;
}
```

### Setup API Pattern

All setup APIs MUST create user if not exists:

```typescript
// Check if user exists
let userRecord = await db.select().from(users)
  .where(eq(users.clerkUserId, user.id))
  .limit(1);

// CREATE if not exists (Clerk auth ≠ database user)
if (userRecord.length === 0) {
  await db.insert(users).values({
    id: `user-${nanoid()}`,
    clerkUserId: user.id, // CRITICAL: Use clerkUserId, NOT clerkId
    type: "student",
    // ... other fields
  });
}
```

---

## 8. Styling Rules

### Gradients (CRITICAL)

**NEVER use Tailwind gradient classes** - they cause build errors.

**CORRECT Pattern:**
```tsx
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
```

**WRONG Pattern:**
```tsx
<div className="from-orange-500 to-orange-600">  // DON'T DO THIS
```

### Portal Colors

| Portal | Gradient |
|--------|----------|
| Student | `rgb(249 115 22) → rgb(194 65 12)` |
| Teacher | `rgb(59 130 246) → rgb(37 99 235)` |
| Parent | `rgb(107 114 128) → rgb(75 85 99)` |
| Counselor | `rgb(168 85 247) → rgb(147 51 234)` |
| Admin | `rgb(236 72 153) → rgb(219 39 119)` |
| School Admin | `rgb(139 92 246) → rgb(124 58 237)` |
| Ministry | `rgb(168 85 247) → rgb(147 51 234)` |

### Framer Motion (CRITICAL)

The `iterationCount must be non-negative` error is caused by improper Framer Motion usage.

**RULES:**
1. NEVER use `repeat: Infinity` WITHOUT `repeatType: "loop"`
2. NEVER use keyframes like `y: [0, 0]` or `x: [0, 0]` (no movement)
3. Prefer CSS animations for simple effects

**CORRECT Pattern:**
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{ repeat: Infinity, repeatType: "loop", duration: 2 }}
/>
```

**WRONG Pattern:**
```tsx
// Missing repeatType - CAUSES ERROR!
transition={{ repeat: Infinity, duration: 2 }}

// No movement - CAUSES ERROR!
animate={{ y: [0, 0] }}
```

---

## 9. Error Handling

### Try-Catch Pattern

```typescript
import { logger } from "@/lib/logger";

try {
  const result = await db.select().from(users);
  return result;
} catch (error) {
  logger.error(error);
  // Handle gracefully or return fallback
  return [];
}
```

### Logger Usage

```typescript
import { logger } from "@/lib/logger";

// Development-only logging (only in dev mode)
logger.debug("Debug info", someVar);

// Always logged
logger.info("Something happened");
logger.warn("Warning message");

// Always logged, with Sentry in production
logger.error(errorObject, { userId, route });

// API error with context
logger.apiError(error, { route: "/api/endpoint", method: "GET", userId });

// Security events
logger.security("unauthorized_access", { userId, ip, route });
```

### Error Components

```tsx
import { ErrorDisplay, NotFoundError, UnauthorizedError } from "@/components/error";

// Custom error display
<ErrorDisplay
  title="Custom Error"
  message="Something went wrong"
  onRetry={() => window.location.reload()}
/>

// Pre-built errors
<NotFoundError />
<UnauthorizedError message="Please sign in" />
<ForbiddenError />
<ServerError />
```

---

## 10. Common Pitfalls

### What NOT to Do

| ❌ Don't Do | ✅ Do Instead | Reason |
|------------|---------------|--------|
| `repeat: Infinity` without `repeatType: "loop"` | Add `repeatType: "loop"` | Causes runtime error |
| Use `clerkId` | Use `clerkUserId` | Wrong field name |
| Relative imports like `../../` | Use `@/` alias | Import resolution issues |
| Add new `any` types | Use proper types | Type safety issues |
| Tailwind gradient classes | Inline styles for gradients | Build errors |
| Forget to build after changes | `npx tsc --noEmit` often | Errors accumulate |
| Use `lastLoginAt` | Use `lastLogin` | Field doesn't exist |
| `value ? 1 : 0` for booleans | `!!value` | PostgreSQL uses true/false |

---

## 11. Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Build out of memory | `set NODE_OPTIONS=--max-old-space-size=16384` |
| Platform admin redirected to setup | Check 3 files: set-role API, admin layout, dashboard |
| "User not found" in setup | Ensure API creates user if not exists |
| Permission errors | Check `requireAuth()` returns database userId |
| Clerk ID mismatch | Run `scripts/fix-clerk-id.js` |
| TypeScript errors | Batch-fix with `npx tsc --noEmit` first |

### Batch-Fix Pattern

When you have many of the same error:

```bash
# 1. Scan all errors
npx tsc --noEmit 2>&1 | tee errors.txt

# 2. Analyze patterns

# 3. Fix all at once in one file

# 4. Verify
npx tsc --noEmit
```

### Files to Check Before Modifying

| Task | Check These Files First |
|------|------------------------|
| Add new API route | `src/lib/auth-utils.ts`, `src/types/index.ts` |
| Modify database schema | `src/lib/db/schema.ts`, run `npx tsc --noEmit` |
| Add animation | Review Framer Motion rules above |
| Change auth flow | All 7 portal `layout.tsx` files, `/api/auth/set-role` |
| Add gradient styles | Use inline styles, NEVER Tailwind classes |

---

## 12. Resources

### Documentation

| Topic | File |
|-------|------|
| Technology Stack | [docs/architecture/technology-stack.md](architecture/technology-stack.md) |
| Database Schema | [docs/architecture/database-schema.md](architecture/database-schema.md) |
| API Routes | [docs/guides/api-development.md](guides/api-development.md) |
| Authentication | [docs/guides/authentication.md](guides/authentication.md) |
| Component Patterns | [docs/design/component-patterns.md](design/component-patterns.md) |
| UX Standards | [docs/design/ux-standards.md](design/ux-standards.md) |
| Changelog | [docs/CHANGELOG.md](CHANGELOG.md) |

### Key Source Files

| File | Purpose |
|------|---------|
| `src/lib/auth-utils.ts` | `requireAuth(allowedRoles?)` helper |
| `src/lib/logger.ts` | debug/info/warn/error/security logging |
| `src/types/index.ts` | ApiSuccess<T>, ApiErrorResponse types |
| `src/middleware.ts` | CORS + security headers |
| `src/lib/db/schema.ts` | Main database schema (90+ tables) |

### External Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [Drizzle ORM](https://orm.drizzle.team/docs/overview)
- [Framer Motion](https://www.framer.com/motion/)
- [shadcn/ui](https://ui.shadcn.com/)

---

## Quick Reference Commands

```bash
# Development
npm run dev                # Start dev server (port 3003)
npm run build              # Production build
npm run start              # Start production server

# Database
npm run db:push            # Push schema to database
npm run db:studio          # Open Drizzle Studio
npm run db:generate        # Generate migrations

# Type Checking
npx tsc --noEmit           # Type check without build
npx tsc --noEmit -w        # Watch mode

# Testing (when implemented)
npm run test               # Run tests
npm run test:watch         # Watch mode
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-16 | Initial framework documentation |

---

**Remember:** This framework is a living document. Update it when patterns change or new rules emerge.
