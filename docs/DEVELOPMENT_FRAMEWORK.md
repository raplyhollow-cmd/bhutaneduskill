# Bhutan EduSkill Development Framework

> **READ THIS FIRST** - This is the single source of truth for how to work on this project.

**Last Updated:** 2026-02-25
**Version:** 1.3

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

## 4.5 Design System (NEW v1.1)

### Design Tokens

**File:** `src/styles/design-tokens.ts` - 800+ design tokens

Import design tokens instead of hardcoding values:

```typescript
import { semantic, spacing, typography, shadows } from "@/styles/design-tokens";

// Use tokens for consistency
<div style={{
  color: semantic.text.primary,
  padding: spacing.md,
  fontSize: typography.size.base,
  boxShadow: shadows.sm,
}} />
```

### Available Token Categories

| Category | Description | Example |
|----------|-------------|---------|
| `semantic` | Contextual colors | `semantic.primary`, `semantic.success` |
| `spacing` | Consistent spacing | `spacing.sm`, `spacing.md`, `spacing.lg` |
| `typography` | Font sizes and weights | `typography.size.base`, `typography.weight.medium` |
| `shadows` | Depth effects | `shadows.sm`, `shadows.md`, `shadows.lg` |
| `borderRadius` | Corner radius | `borderRadius.sm`, `borderRadius.md` |
| `animation` | Durations and easings | `animation.duration.fast`, `animation.easing.ease` |
| `gradients` | Pre-defined gradients | `gradients.primary`, `gradients.student` |

### Portal-Specific Gradients

```typescript
// Use pre-defined portal gradients
import { gradients } from "@/styles/design-tokens";

// Student portal
<div style={{ background: gradients.student }}>

// Teacher portal
<div style={{ background: gradients.teacher }}>

// Admin portal
<div style={{ background: gradients.admin }}>
```

### Dark Mode

Design tokens are optimized for dark-first usage:

```typescript
// Background colors (dark mode default)
backgroundColor: semantic.background.surface  // #0f172a
backgroundColor: semantic.background.elevated // #1e293b

// Text colors
color: semantic.text.primary   // #f1f5f9
color: semantic.text.secondary // #94a3b8
```

### Component Design Guidelines

When creating new components:

1. **Use design tokens** for all visual properties
2. **Support dark mode** by default
3. **Follow portal color schemes** for branded elements
4. **Use semantic spacing** for consistent layouts
5. **Apply shadow tokens** instead of custom box-shadows

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

## 7. Performance Optimization (v1.3)

> **Sprint 1 Results:** 13 N+1 problems fixed, 85 `any` types eliminated, parallel agent workflow proven.

### N+1 Query Prevention (CRITICAL)

**Sprint 1 Results:** 13 N+1 problems fixed across 6 files with 95-97% query reduction.

N+1 queries occur when you fetch a list of items, then make separate queries for related items in a loop.

#### The Problem

```typescript
// ❌ WRONG - N+1 queries (1 for items + N for related data)
const items = await db.select().from(items);
for (const item of items) {
  const related = await db.select().from(relatedTable)
    .where(eq(relatedTable.itemId, item.id)); // N additional queries!
  item.related = related[0];
}
// For 100 items: 101 total queries
```

#### The Solution

```typescript
// ✅ CORRECT - Batch query with inArray() (2 queries total)
import { inArray } from "drizzle-orm";

const items = await db.select().from(items);

// Step 1: Collect all unique IDs
const itemIds = [...new Set(items.map(i => i.id))];

// Step 2: Single batch query
const relatedItems = await db.select()
  .from(relatedTable)
  .where(inArray(relatedTable.itemId, itemIds));

// Step 3: Create Map for O(1) lookup
const relatedMap = new Map(relatedItems.map(r => [r.itemId, r]));

// Step 4: Combine data (no additional queries)
const result = items.map(item => ({
  ...item,
  related: relatedMap.get(item.id)
}));
// For 100 items: 2 total queries (98% reduction)
```

#### Key Principles

1. **Never query inside loops** - Always collect IDs first
2. **Use `inArray()`** - Single batch query instead of N queries
3. **Create lookup Maps** - O(1) constant-time access to related data
4. **Filter duplicates** - Use `Set` or `[...new Set()]` for unique IDs

#### Real Examples from Sprint 1

| File | Issue | Before | After | Reduction |
|------|-------|--------|-------|-----------|
| `src/lib/api/student.ts` | Student fee lookups | 1+N queries | 2 queries | 95% |
| `src/lib/api/school-admin.ts` | Teacher lookups | 1+2N queries | 3 queries | 97% |
| `src/app/api/teacher/reports/route.ts` | Class data fetching | 1+N queries | 2 queries | 96% |
| `src/app/api/transport/allocations/route.ts` | Student transport links | 1+N queries | 2 queries | 95% |
| `src/app/api/parent/homework/route.ts` | Homework attachments | 1+N queries | 2 queries | 96% |
| `src/app/api/classes/route.ts` | Teacher/School lookups | 1+2N queries | 3 queries | 97% |

#### Sprint 1 Query Fix Pattern

**Query Optimization Agent** used this exact pattern for all 13 fixes:

```typescript
// Pattern used consistently across all Sprint 1 N+1 fixes
const items = await db.select().from(items);
const itemIds = items.map(i => i.id);

// Single batch query using inArray()
const relatedItems = await db.select()
  .from(relatedTable)
  .where(inArray(relatedTable.itemId, itemIds));

// Create Map for O(1) lookup
const relatedMap = new Map(relatedItems.map(r => [r.itemId, r]));

// Combine data without additional queries
const result = items.map(item => ({
  ...item,
  related: relatedMap.get(item.id)
}));
```

### Batch Operations

For bulk inserts/updates, use a single batch operation:

```typescript
// ❌ WRONG - Loop with individual inserts
for (const student of students) {
  await db.insert(users).values(student);  // N round trips!
}

// ✅ CORRECT - Single batch insert
await db.insert(users).values(students);  // 1 round trip
```

### API Route Optimization

Use the `createApiRoute` wrapper to eliminate ~100 lines of duplicate code per route:

```typescript
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;
    const data = await someOperation(userId);

    return successResponse({ data });
  },
  ['admin', 'school-admin']  // Allowed roles (optional)
);
```

### Sprint 1 Performance Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| N+1 Query Problems | 13 unfixed | 0 fixed | 100% |
| Average Queries (fixed endpoints) | 50-100+ | 2-3 | 95-97% |
| `any` Types | 307 | 222 | 28% reduction |
| Code Reduction | - | ~600 lines | Cleaner codebase |
| API Routes with Wrapper | 0 | 5 | Pattern established |

**See also:** `docs/memory/code-optimization-patterns.md` for complete patterns and examples.

---

## 8. Security Patterns (UPDATED v1.2)

### Security Score: B+ (Good with Critical Issues)

**Critical Issues Requiring Attention:**
1. Remove all `/api/debug/*` endpoints before production
2. Replace Base64 session tokens with JWT
3. Add ownership checks to dynamic routes (IDOR prevention)

### Security Checklist

For every new API route or feature:

- [ ] Used `requireAuth()` with appropriate roles
- [ ] Verified ownership for dynamic route parameters
- [ ] Applied rate limiting for sensitive operations
- [ ] Used `logger` instead of `console.log`
- [ ] No sensitive data in error messages
- [ ] No stack traces exposed in production
- [ ] Validated parent-child relationships for parent access
- [ ] Used safe redirect patterns

### IDOR Prevention

**Insecure Direct Object Reference (IDOR)** is a critical vulnerability where users can access resources they don't own by modifying IDs.

```typescript
// ❌ WRONG - No ownership check
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId } = await requireAuth();
  const resource = await db.select().from(resources).where(eq(resources.id, params.id));
  // User can access ANY resource by changing the ID!
  return Response.json({ data: resource });
}

// ✅ CORRECT - Ownership verified
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { userId, user, schoolId } = await requireAuth();
  const resource = await db.select().from(resources).where(eq(resources.id, params.id));

  if (!resource || resource.length === 0) {
    return notFoundResponse();
  }

  // Verify ownership
  if (resource[0].schoolId !== schoolId && user.type !== 'admin') {
    return notFoundResponse(); // Return 404, not 403 (don't reveal existence)
  }

  return Response.json({ data: resource });
}
```

### Secure Logging

```typescript
import { logger } from "@/lib/logger";

// ✅ CORRECT - Safe logging
logger.info("User action", { userId, action: "login" });
logger.error(error, { context: "database", userId });

// ❌ WRONG - Leaks sensitive data
console.log("User data:", user); // May contain passwords, tokens
console.error("Database error:", error); // Stack traces exposed
```

### Debug Routes Policy

**NEVER create debug routes that are accessible in production:**

```typescript
// ❌ FORBIDDEN
// src/app/api/debug/fix-onboarding/route.ts
export async function POST() {
  // This bypasses security!
}
```

If debug routes are absolutely needed for development:

```typescript
// ✅ CORRECT - Protected debug route
if (process.env.NODE_ENV === 'production') {
  return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

// Add IP whitelist
const allowedIPs = process.env.ALLOWED_DEBUG_IPS?.split(',') || [];
const clientIP = getClientIp(request);
if (!allowedIPs.includes(clientIP)) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}

// Require admin role
const { userId } = await requireAuth(['admin']);
```

### Security Resources

- `docs/security-audit-report.md` - Complete security assessment
- `docs/change-control-process.md` - Security review requirements
- AGENT_TEAM.md - Security Specialist role

---

## 9. Authentication & Authorization

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

## 10. Styling Rules

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

## 11. Error Handling

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

## 11. Common Pitfalls

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

## 12. Troubleshooting

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

## 13. Resources

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
| 1.3.0 | 2026-02-25 | Added Performance Optimization section with N+1 query patterns, Sprint 1 metrics |
| 1.2.0 | 2026-02-25 | Added Design System section, Security Patterns section |
| 1.1.0 | 2026-02-20 | Performance Optimization section initial draft |
| 1.0.0 | 2026-02-16 | Initial framework documentation |

---

**Remember:** This framework is a living document. Update it when patterns change or new rules emerge.
