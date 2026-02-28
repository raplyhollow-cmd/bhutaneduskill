# Bhutan EduSkill - Errors and Fixes Documentation

> **Purpose**: Comprehensive documentation of all error types encountered and their permanent solutions.
> **Last Updated**: February 28, 2026 (Evening)

---

## Table of Contents

1. [React Hooks Errors](#1-react-hooks-errors)
2. [TypeScript Type Errors](#2-typescript-type-errors)
3. [Database/Drizzle ORM Errors](#3-databasedrizzle-orm-errors)
4. [Authentication Errors](#4-authentication-errors)
5. [Framer Motion Errors](#5-framer-motion-errors)
6. [Deprecated API Usage](#6-deprecated-api-usage)
7. [Teacher/Student Approval Flow](#7-teacherstudent-approval-flow-dual-status-system)
8. [Build/Compilation Errors](#8-buildcompilation-errors)
9. [February 28, 2026 - Admin Portal Bug Fixes](#9-february-28-2026---admin-portal-bug-fixes)
10. [API Auth & Pending Approval Fixes](#10-api-auth--pending-approval-fixes)

---

## 1. React Hooks Errors

### Error: "Rendered more hooks than during the previous render"

**Severity**: CRITICAL (App crashes completely)

**Symptoms**:
```
Uncaught Error: Rendered more hooks than during the previous render.
    at updateWorkInProgressHook
    at updateMemo
    at Object.useMemo
    at Router
```

**Root Cause**:
Calling React hooks (useState, useEffect, useMemo, useContext, useRef, useCallback) conditionally or after early returns. React requires that hooks are called in the **same order on every render**.

**Permanent Fix**:
**RULE**: All hooks must be declared at the TOP of the component, BEFORE any conditional logic, early returns, or loops.

**Before (WRONG)**:
```tsx
export function MyComponent() {
  // ❌ Early return BEFORE all hooks
  if (typeof window === "undefined") {
    return null;
  }

  // ❌ Hooks called after conditional
  const [state, setState] = useState(null);
  useEffect(() => { ... }, []);

  return <div>{state}</div>;
}
```

**After (CORRECT)**:
```tsx
export function MyComponent() {
  // ✅ ALL hooks declared first
  const [state, setState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Move SSR checks inside useEffect
    if (typeof window === "undefined") {
      return;
    }
    // ... rest of effect
  }, []);

  // ✅ Conditional returns AFTER all hooks
  if (typeof window === "undefined") {
    return null;
  }

  return <div>{state}</div>;
}
```

**Files Fixed**:
- [src/components/ai/unified-ai-assistant.tsx](src/components/ai/unified-ai-assistant.tsx)
- [src/components/transitions/transition-provider.tsx](src/components/transitions/transition-provider.tsx)

**SOP for Prevention**:
1. Declare ALL hooks (useState, useEffect, useMemo, useContext, useRef, useCallback) at the very top of the component
2. NEVER put hooks inside if statements, loops, or after early returns
3. If you need conditional logic based on hook values, use `useMemo` or compute it AFTER all hooks

---

## 2. TypeScript Type Errors

### Error: "Property 'X' does not exist on type 'unknown'"

**Severity**: P1 (High)

**Symptoms**:
```typescript
// Error: Property 'skills' does not exist on type 'unknown'
const userSkills = user?.settings?.skills || {};
```

**Root Cause**:
TypeScript cannot infer the type of nested properties, especially when data comes from API responses.

**Permanent Fix**:
Use type assertions to define the expected shape of the data.

**Before (WRONG)**:
```typescript
const userSkills = user?.settings?.skills || {};  // ❌ Error: 'unknown'
const currentSkills = (user?.settings as any)?.skills || {};  // ❌ Using 'any'
```

**After (CORRECT)**:
```typescript
// Define the type
const userSettings = user?.settings as { skills?: Record<string, number> } | undefined;
const userSkills = userSettings?.skills || {};

// For updates
const currentSettings = user?.settings as { skills?: Record<string, number> } | undefined;
await db.update(users).set({
  settings: { ...(currentSettings || {}), skills: currentSkills },
  // ...
});
```

**Files Fixed**:
- [src/app/api/skills/route.ts](src/app/api/skills/route.ts)

### Error: "Type 'unknown' is not assignable to type 'string'"

**Severity**: P1 (High)

**Root Cause**:
API responses return `unknown` type by default. Need proper type assertion.

**Permanent Fix**:
```typescript
// Define response interface
interface UserContextResponse {
  success: true;
  data: UserContextData;
}

// Use type assertion after fetching
const data = await response.json() as UserContextResponse;
```

---

## 3. Database/Drizzle ORM Errors

### Error: "Object.entries(undefined)"

**Severity**: CRITICAL (Runtime crash)

**Symptoms**:
```
TypeError: Cannot convert undefined or null to object
    at Object.entries
    at orderSelectedFields
```

**Root Cause**:
Drizzle ORM query selecting a column that doesn't exist in the schema.

**Permanent Fix**:
Always verify column names in `schema.ts` before using them in queries.

**Common Column Name Mistakes**:
| Wrong | Correct | Notes |
|-------|---------|-------|
| `lastLoginAt` | `lastLogin` | Check schema.ts for exact names |
| `clerkId` | `clerkUserId` | Use `clerkUserId` consistently |
| `school_id` | `schoolId` | Drizzle uses camelCase |
| `isEmailVerified` | `emailVerified` | Boolean field naming |

**SOP for Database Queries**:
1. Always check `src/lib/db/schema.ts` for exact column names
2. Use proper join conditions (join through related tables, not non-existent columns)
3. Parse JSON text columns using `parseJsonArray()` helper

### Error: "Cannot read properties of undefined (reading 'referencedTable')"

**Severity**: CRITICAL (Runtime crash - pages fail to load)

**Symptoms**:
```
TypeError: Cannot read properties of undefined (reading 'referencedTable')
    at resolveErrorDev
    at processFullStringRow
```

**Root Cause**:
The `drizzle-orm/neon-http` driver does **NOT** support the `db.query` API (relational queries). The code was using `db.query.classes.findFirst()` which requires the `neon-serverless` driver.

**Permanent Fix**:
Use `drizzle-orm/neon-serverless` driver instead of `drizzle-orm/neon-http`.

**Before (WRONG)**:
```typescript
// src/lib/db/index.ts - Using neon-http driver
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

const neonClient = neon(databaseUrl, {
  fetchOptions: { cache: "no-store" },
});

export const db = drizzle(neonClient, { schema });
// ❌ db.query does NOT work with neon-http!
```

**After (CORRECT)**:
```typescript
// src/lib/db/index.ts - Using neon-serverless driver
import { drizzle } from "drizzle-orm/neon-serverless";

// Pass connection string directly to drizzle()
// drizzle will create the Pool internally and enable db.query support
export const db = drizzle(databaseUrl, { schema });
// ✅ db.query now works!
```

**Key Difference**:
| Driver | `db.query` Support | Connection Method |
|--------|-------------------|-------------------|
| `drizzle-orm/neon-http` | ❌ NO | `neon(connectionString)` |
| `drizzle-orm/neon-serverless` | ✅ YES | `drizzle(connectionString)` |

**Affected Patterns**:
Now these patterns work correctly:
```typescript
// Find single record with relations
const classInfo = await db.query.classes.findFirst({
  where: eq(classes.id, classId),
});

// Find many with relations
const students = await db.query.users.findMany({
  where: eq(users.type, "student"),
  with: {
    school: true,  // Include related data
  },
});
```

**Files Fixed**:
- [`src/lib/db/index.ts`](src/lib/db/index.ts) - Changed from `neon-http` to `neon-serverless`

**Note**: If you need to use `db.query`, you must use the `neon-serverless` driver. The `neon-http` driver is for simple SQL queries only.

---

## 4. Authentication Errors

### Error: 401 Unauthorized on `/api/auth/set-role`

**Severity**: P1 (Users can't access their dashboard)

**Symptoms**:
```
GET /api/auth/set-role 401 (Unauthorized)
POST /api/auth/set-role 401 (Unauthorized)
```

**Root Cause**:
1. Clerk session expired
2. User not authenticated
3. Missing requireAuth() in protected routes

**Permanent Fix**:
Ensure all protected API routes use `requireAuth()` helper:

```typescript
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const authResult = await requireAuth(['admin', 'teacher']); // Add allowed roles

  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user } = authResult;
  // ... rest of logic
}
```

### Error: "You don't have permission" (RBAC)

**Severity**: P1

**Root Cause**:
`requireAuth()` was returning Clerk userId instead of database userId, causing RBAC permission checks to fail.

**Permanent Fix**:
Ensure `requireAuth()` returns database userId:

```typescript
// src/lib/auth-utils.ts
return { user, userId: user.id }; // Use database ID, NOT clerkUserId
```

---

## 5. Framer Motion Errors

### Error: "iterationCount must be non-negative"

**Severity**: P1 (Animations break)

**Symptoms**:
```
Error: iterationCount must be non-negative
    at evaluateAnimation
```

**Root Cause**:
Using `repeat: Infinity` without specifying `repeatType: "loop"`.

**Permanent Fix**:
**RULE**: ALWAYS include `repeatType: "loop"` when using `repeat: Infinity`.

**Before (WRONG)**:
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{ repeat: Infinity, duration: 2 }}  // ❌ Missing repeatType
/>
```

**After (CORRECT)**:
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    repeat: Infinity,
    repeatType: "loop",  // ✅ REQUIRED
    duration: 2
  }}
/>
```

**Additional Rules**:
- NEVER use keyframes like `y: [0, 0]` or `x: [0, 0]` (no movement)
- For simple animations, prefer CSS animations over Framer Motion

**Files Checked** (all now compliant):
- [src/components/landing/hero-section.tsx](src/components/landing/hero-section.tsx)
- [src/components/landing/cta-section.tsx](src/components/landing/cta-section.tsx)
- [src/components/journey/*.tsx](src/components/journey/)
- [src/app/setup/unified/page.tsx](src/app/setup/unified/page.tsx)

---

## 6. Deprecated API Usage

### Error: Using deprecated `substr()` method

**Severity**: P2 (Medium - will break in future JS versions)

**Symptoms**:
Console warning about deprecated method.

**Root Cause**:
`substr()` is deprecated in favor of `substring()`.

**Permanent Fix**:
Replace all `.substr(start, length)` with `.substring(start, end)`.

**Conversion Guide**:
| `substr()` | `substring()` | Notes |
|------------|---------------|-------|
| `str.substr(2, 9)` | `str.substring(2, 11)` | 9 chars from position 2 = positions 2-10 |
| `str.substr(2, 4)` | `str.substring(2, 6)` | 4 chars from position 2 = positions 2-5 |
| `str.substr(0, 10)` | `str.substring(0, 10)` | Same for start=0 |

**Files Fixed**:
- [create-admin.ts](create-admin.ts)
- [src/lib/db/seed.ts](src/lib/db/seed.ts)
- [src/lib/api/counselor.ts](src/lib/api/counselor.ts)
- [src/app/school-admin/_actions.ts](src/app/school-admin/_actions.ts)
- [src/app/api/tuition/sessions/route.ts](src/app/api/tuition/sessions/route.ts)
- [src/app/api/school-admin/fees/payments/route.ts](src/app/api/school-admin/fees/payments/route.ts)

**Total Fixed**: 8 occurrences

---

## 7. Teacher/Student Approval Flow (Dual Status System)

### Issue: "Pending" status in Platform Admin vs School Admin

**Severity**: P2 (User confusion - not a bug, but design clarification needed)

**Symptoms**:
- Teacher shows "Pending" in Platform Admin `/admin/teachers` page
- But School Admin has already approved the teacher
- Teacher can access their dashboard successfully

**Root Cause**:
Two separate approval systems exist:

| Approval Type | Controlled By | Database Field | Purpose |
|--------------|--------------|----------------|---------|
| **Email Verification** | Platform Admin | `users.emailVerified` | Platform admin verifies teacher's email is valid |
| **School Approval** | School Admin | `users.onboardingStatus` + `teacherApplications.status` | School admin approves teacher's enrollment in their school |

These are **independent** workflows. A teacher can be:
1. Email Pending + School Approved → Can access dashboard (school approval is sufficient)
2. Email Verified + School Pending → Cannot access (still needs school approval)
3. Email Verified + School Approved → Fully verified

**Implementation** (Feb 23, 2026):

Created separate API endpoint for teachers that includes approval details:

**File**: [`src/app/api/admin/teachers/route.ts`](src/app/api/admin/teachers/route.ts)

```typescript
// Returns teachers with both email and approval status
interface TeacherWithApprovalDetails {
  id: string;
  emailVerified: boolean;
  onboardingStatus?: string;  // "enrolled", "pending_approval", etc.
  applicationStatus?: string; // from teacherApplications table
  approvedBy?: string;        // userId of school-admin who approved
  approvedByName?: string;    // Name of school-admin who approved
  approvedAt?: Date;
}
```

**UI Changes** in [`src/app/admin/teachers/page.tsx`](src/app/admin/teachers/page.tsx):

Split the single "Status" column into two:

| Column | Shows | Possible Values |
|--------|-------|-----------------|
| **Email Status** | Platform admin email verification | Pending (yellow), Verified (blue), Active (green) |
| **School Approval** | School admin enrollment approval | Approved (green) + "by [Name]", Pending (yellow), Rejected (red), — (no application) |

**Example Display**:
```
Teacher: Wangmo Tshering (booksilverpine@gmail.com)
School: Yanthi Higher Secondary School
Email Status:    [⏳ Pending]   ← Platform admin hasn't verified email
School Approval: [✓ Approved]   ← School admin has approved enrollment
                  by Karma Wangdi
```

**Related Files**:
- [`src/app/api/admin/users/route.ts`](src/app/api/admin/users/route.ts) - Added `onboardingStatus` to response
- [`src/app/api/admin/teachers/route.ts`](src/app/api/admin/teachers/route.ts) - New endpoint for teacher approval details
- [`src/app/admin/teachers/page.tsx`](src/app/admin/teachers/page.tsx) - Dual status display
- [`src/app/api/school-admin/teachers/pending/route.ts`](src/app/api/school-admin/teachers/pending/route.ts) - School admin approval API

**Database Schema**:
```sql
-- Users table
users.emailVerified          -- Platform admin email verification
users.onboardingStatus        -- School approval status: "pending_enrollment", "enrolled", etc.

-- Teacher applications table
teacherApplications.status    -- "pending", "approved", "rejected"
teacherApplications.reviewedBy -- userId of school-admin who approved
teacherApplications.reviewedAt -- Timestamp of approval
```

**Approval Flow**:
1. Teacher signs up with school code → `onboardingStatus = "pending_enrollment"`
2. TeacherApplication created with `status = "pending"`
3. School admin approves → `onboardingStatus = "enrolled"`, `teacherApplications.status = "approved"`, `reviewedBy = schoolAdminId`
4. Teacher redirected to dashboard after approval
5. Platform admin can still verify email separately via `emailVerified` field

---

## 8. Build/Compilation Errors

### Error: "Cannot find module" (Import path issues)

**Severity**: P1

**Root Cause**:
Mixed use of `@/` alias and relative paths (`../`).

**Permanent Fix**:
**RULE**: ALWAYS use `@/` alias for imports within the project.

**Before (WRONG)**:
```typescript
import { Button } from "../../components/ui/button";  // ❌ Relative path
import { logger } from "../../../lib/logger";  // ❌ Fragile
```

**After (CORRECT)**:
```typescript
import { Button } from "@/components/ui/button";  // ✅ Alias
import { logger } from "@/lib/logger";  // ✅ Clear and stable
```

### Error: "ignoreBuildErrors: true" masking real issues

**Severity**: P2

**Current State**:
`next.config.ts` has `typescript: { ignoreBuildErrors: true }`

**Action Plan**:
1. Fix all TypeScript errors first
2. Set `ignoreBuildErrors: false`
3. Run `npm run build` to verify clean build

---

## Pre-Flight Checklist (Before Every Deployment)

```bash
# 1. Type check
npx tsc --noEmit
# Expected: 0 errors

# 2. Build check
npm run build
# Expected: Success with no warnings

# 3. Clear cache if needed
rm -rf .next

# 4. Test auth flow
# - Sign in as student
# - Sign in as teacher
# - Sign in as admin
# All should redirect to correct portal

# 5. Test animations
# Visit homepage, verify no animation errors in console
```

---

## Error Resolution SOP (Standard Operating Procedure)

When encountering a new error:

1. **Identify Error Type**:
   - React Hooks → Check for conditional hook calls
   - TypeScript → Add proper type definitions
   - Database → Verify schema column names
   - Auth → Check `requireAuth()` usage
   - Framer Motion → Check for missing `repeatType: "loop"`

2. **Find Root Cause**:
   - Read the full error stack trace
   - Identify the exact file and line number
   - Understand what the code is trying to do

3. **Implement Fix**:
   - Follow the patterns in this document
   - Test the fix locally
   - Run `npx tsc --noEmit` to verify

4. **Document**:
   - Add to this file if it's a new error type
   - Include before/after code examples
   - Note which files were affected

5. **Verify**:
   - Run full type check
   - Test the affected feature
   - Check for regressions

---

## Quick Reference Command

```bash
# Scan for all TypeScript errors
npx tsc --noEmit 2>&1 | tee errors.txt

# Find all deprecated substr() usage
grep -r "\.substr(" src/

# Find all repeat: Infinity without repeatType
grep -r "repeat: Infinity" src/ | grep -v "repeatType"

# Count 'any' type usage
grep -r ": any" src/ | wc -l
```

---

## Metrics Tracking

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| TypeScript Errors | 0 | 0 | ✅ |
| Framer Motion Issues | 0 | 0 | ✅ |
| Deprecated API Usage | 0 | 0 | ✅ |
| `any` types | ~298 | <50 | 🟡 In Progress |
| Console Errors | 0 | 0 | ✅ |
| Approval Status Documentation | ✅ Complete | ✅ | ✅ |

---

### Error: Duplicate Export - "the name `semantic` is defined multiple times"

**Severity**: CRITICAL (Build blocking)

**Reported**: February 25, 2026

**Symptoms**:
```
Ecmascript file had an error
  253 |  * Common gradients for UI states
  254 |  */
> 255 | export const semantic = {
      |              ^^^^^^^^
  256 |   success: {
  257 |     gradient: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
```

**Root Cause**:
The `semantic` constant is exported **TWICE** in `src/styles/design-tokens.ts`:
- **First export** (lines 28-148): Full color palette with primary, secondary, accent, success, warning, error, info
- **Second export** (lines 255-276): Gradient-only version for success, warning, error, info

JavaScript/TypeScript does not allow duplicate exports with the same name.

**Permanent Fix**:

**Option 1: Rename the second export (Recommended)**

```typescript
// Line 255 - Change from:
export const semantic = {

// To:
export const semanticGradients = {
```

Then update any imports that reference the gradients:
```typescript
// Before
import { semantic } from '@/styles/design-tokens'
const successGradient = semantic.success.gradient

// After
import { semanticGradients } from '@/styles/design-tokens'
const successGradient = semanticGradients.success.gradient
```

**Option 2: Merge into first export**

Add gradient properties to the existing `semantic` export (around line 78):
```typescript
// In the first semantic export, add gradients:
success: {
  // ... existing 50-900, DEFAULT, fg, subtle, subtleText
  gradient: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)',
},
warning: {
  // ... existing properties
  gradient: 'linear-gradient(135deg, rgb(245 158 11) 0%, rgb(217 119 6) 100%)',
},
// ... etc for error, info
```

Then delete the duplicate export (lines 255-276).

**Option 3: Delete duplicate export (if unused)**

If the gradient export is not used anywhere, simply delete lines 255-276.

**Files Affected**:
- `src/styles/design-tokens.ts` (lines 255-276, and re-exports at 1117-1118)
- Any files importing `semantic` gradients from this file

**Search for usage**:
```bash
grep -r "semantic\\.success\\.gradient" src/
grep -r "semantic\\.warning\\.gradient" src/
```

---

## Recent Updates (February 25, 2026)

- **NEW**: Added duplicate export error to Section 8
- **NEW**: UX Audit 2026 shows significant improvements (B- → B+ grade)
- **NEW**: 50+ new UX components documented

---

**Document Owner**: Development Team
**Review Frequency**: Weekly
**Version**: 1.4

---

## 9. February 28, 2026 - Admin Portal Bug Fixes

### Error: Analytics API 500 - Incorrect `.having()` clause

**Severity**: CRITICAL (Analytics page fails to load)

**Symptoms**:
```
GET /api/admin/analytics-data 500 (Internal Server Error)
TypeError: Invalid having clause usage
```

**Root Cause**:
Drizzle ORM's `.having()` method does not accept lambda functions like `.where()` does. The code was using:
```typescript
.having((users) => sql`${users.grade} IS NOT NULL`)
```

This is incorrect syntax for Drizzle's `.having()` method.

**Permanent Fix**:
Move the condition from `.having()` to `.where()` with proper `and()` wrapper:

**Before (WRONG)**:
```typescript
// src/app/api/admin/analytics-data/route.ts line 433
const studentGradesResult = await db
  .select({
    grade: users.grade,
    count: count(),
  })
  .from(users)
  .where(eq(users.type, 'student'))
  .groupBy(users.grade)
  .having((users) => sql`${users.grade} IS NOT NULL`)  // ❌ Wrong syntax
  .orderBy(desc(count()))
  .limit(5);
```

**After (CORRECT)**:
```typescript
const studentGradesResult = await db
  .select({
    grade: users.grade,
    count: count(),
  })
  .from(users)
  .where(and(
    eq(users.type, 'student'),
    sql`${users.grade} IS NOT NULL`  // ✅ Moved to where() with and()
  ))
  .groupBy(users.grade)
  .orderBy(desc(count()))
  .limit(5);
```

**Files Fixed**:
- [src/app/api/admin/analytics-data/route.ts:433](src/app/api/admin/analytics-data/route.ts)

---

### Error: ".map is not a function" on Notifications/Partners pages

**Severity**: P1 (Pages crash with TypeError)

**Symptoms**:
```
TypeError: notifications.map is not a function
    at NotificationsList
```

**Root Cause**:
API responses have nested structure: `{ success: true, data: { notifications: [] } }`
But the component was accessing `result.data` directly instead of `result.data.notifications`.

**Permanent Fix**:
Update interfaces and data access patterns to match nested API response structure.

**Before (WRONG)**:
```typescript
// src/app/admin/notifications/page.tsx
interface NotificationsResponse {
  success: boolean;
  data: Notification[];  // ❌ Missing nesting
}

const result: NotificationsResponse = await response.json();
setNotifications(result.data || []);  // ❌ result.data is { notifications, pagination }, not array
```

**After (CORRECT)**:
```typescript
interface NotificationsResponse {
  success: boolean;
  data: {
    notifications: Notification[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

const result: NotificationsResponse = await response.json();
setNotifications(result.data.notifications || []);  // ✅ Access nested array
setPagination(result.data.pagination);
```

**Files Fixed**:
- [src/app/admin/notifications/page.tsx](src/app/admin/notifications/page.tsx)
- [src/app/admin/partners/page.tsx](src/app/admin/partners/page.tsx)

---

### Error: API Routes 401/500 - Incorrect Auth Pattern

**Severity**: P1 (Authentication failures)

**Symptoms**:
```
GET /api/admin/notifications 401 (Unauthorized)
GET /api/admin/partners 500 (Internal Server Error)
```

**Root Cause**:
API routes were manually calling `getAuth(request)` instead of using the auth provided by `createApiRoute` wrapper.

**Permanent Fix**:
Use the `auth` parameter passed by `createApiRoute` wrapper:

**Before (WRONG)**:
```typescript
export const GET = createApiRoute(
  async (req: NextRequest) => {
    // ❌ Manually calling getAuth - duplicate auth check
    const authResult = await getAuth(req);
    if (!authResult.userId) {
      return errorResponse("Unauthorized", 401);
    }
    const { userId } = authResult;
    // ... rest of logic
  },
  ['admin']
);
```

**After (CORRECT)**:
```typescript
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {  // ✅ auth is provided by wrapper
    const { userId, user } = auth;     // ✅ Use provided auth
    // ... rest of logic
  },
  ['admin']  // ✅ Wrapper handles role check automatically
);
```

**Files Fixed**:
- [src/app/api/admin/notifications/route.ts](src/app/api/admin/notifications/route.ts)
- [src/app/api/admin/partners/route.ts](src/app/api/admin/partners/route.ts)

---

### Error: Missing QueryClient Provider

**Severity**: P1 (React Query hooks fail)

**Symptoms**:
```
Error: useQuery must be used within QueryClientProvider
```

**Root Cause**:
App was using TanStack Query hooks but wasn't wrapped with `QueryClientProvider`.

**Permanent Fix**:

**1. Create QueryProvider component** (src/components/providers/query-provider.tsx):
```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
```

**2. Wrap app in root layout** (src/app/layout.tsx):
```typescript
import { QueryProvider } from "@/components/providers/query-provider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <html lang="en">
        <body>
          <AppErrorBoundary>
            <ThemeProvider>
              <UserProvider>
                <QueryProvider>  {/* ✅ Wrap with QueryProvider */}
                  <TransitionProvider>
                    <ToastProvider>
                      {children}
                    </ToastProvider>
                  </TransitionProvider>
                </QueryProvider>
              </UserProvider>
            </ThemeProvider>
          </AppErrorBoundary>
        </body>
      </html>
    </ClerkProvider>
  );
}
```

**Files Created**:
- [src/components/providers/query-provider.tsx](src/components/providers/query-provider.tsx)

**Files Modified**:
- [src/app/layout.tsx](src/app/layout.tsx)

---

## Session Summary: February 28, 2026

| Fix Type | Files | Impact |
|----------|-------|--------|
| Analytics `.having()` clause | 1 | ✅ Analytics page now loads |
| Notifications data access | 1 | ✅ Notifications list displays |
| Partners data access | 1 | ✅ Partners list displays |
| API auth patterns | 2 | ✅ Authentication works correctly |
| QueryClient provider | 2 | ✅ React Query hooks functional |

**Verification Commands**:
```bash
# Type check
npx tsc --noEmit

# Test analytics API
curl http://localhost:3003/api/admin/analytics-data

# Test notifications API
curl http://localhost:3003/api/admin/notifications

# Test partners API
curl http://localhost:3003/api/admin/partners
```

---

## Additional Fixes (February 28, 2026 - After Physical Testing)

### Error: Notifications Insert - SQL `default` keyword issue

**Severity**: CRITICAL (Cannot create notifications)

**Symptoms**:
```
Failed query: insert into "notifications" (...) values (..., default, default, ...)
```

**Root Cause**:
When `undefined` is passed to Drizzle's `.values()` for optional timestamp fields (`scheduledFor`, `sentAt`), it generates SQL with the `default` keyword which is invalid syntax.

**Permanent Fix**:
Only include fields in the insert object if they have actual values. Omit `undefined` fields entirely.

**Before (WRONG)**:
```typescript
const notification = await db
  .insert(notifications)
  .values({
    id: notificationId,
    title: body.title.trim(),
    // ... other fields
    scheduledFor,  // ❌ undefined causes SQL "default" keyword
    expiresAt,     // ❌ undefined causes SQL "default" keyword
  })
  .returning();
```

**After (CORRECT)**:
```typescript
// Build notification values object - only include defined fields
const notificationValues: Record<string, any> = {
  id: notificationId,
  title: body.title.trim(),
  // ... other fields
};

// Only add optional timestamp fields if they have values
if (scheduledFor) {
  notificationValues.scheduledFor = scheduledFor;
}
if (expiresAt) {
  notificationValues.expiresAt = expiresAt;
}

const notification = await db
  .insert(notifications)
  .values(notificationValues)  // ✅ Only defined fields included
  .returning();
```

**Files Fixed**:
- [src/app/api/admin/notifications/route.ts:284-309](src/app/api/admin/notifications/route.ts)

---

### Error: Partners API - Array Destructuring on Empty Result

**Severity**: P1 (Could fail if query returns empty)

**Symptoms**:
```
TypeError: Cannot destructure property 'totalCount' of 'undefined' as it is undefined
```

**Root Cause**:
`const [{ totalCount }] = await db.select(...)` fails if the query returns an empty array.

**Permanent Fix**:
Use array access pattern with null fallback.

**Before (WRONG)**:
```typescript
const [{ totalCount }] = await db
  .select({ totalCount: count() })
  .from(partners)
  .where(whereClause);
// ❌ Throws if result is []
```

**After (CORRECT)**:
```typescript
const countResult = await db
  .select({ totalCount: count() })
  .from(partners)
  .where(whereClause);

const totalCount = countResult[0]?.totalCount || 0;  // ✅ Safe fallback
```

**Files Fixed**:
- [src/app/api/admin/partners/route.ts:207-211](src/app/api/admin/partners/route.ts)

---

### Error: Analytics API - Generic 500 Error

**Severity**: P1 (Cannot identify which metric query is failing)

**Symptoms**:
```
GET /api/admin/analytics-data 500
Failed to fetch analytics data
```

**Root Cause**:
Using `Promise.all()` means if any one metric query fails, the entire request fails with no indication of which query caused the problem.

**Permanent Fix**:
Use `Promise.allSettled()` to catch individual metric failures with detailed error messages.

**Before (WRONG)**:
```typescript
const [schoolEngagement, userGrowth, careerInterests, ...] = await Promise.all([
  getSchoolEngagementMetrics(),
  getUserGrowthTrends(),
  getCareerInterestsDistribution(),
  // ...
]);
// ❌ If any fails, all fail with generic error
```

**After (CORRECT)**:
```typescript
const results = await Promise.allSettled([
  getSchoolEngagementMetrics(),
  getUserGrowthTrends(),
  getCareerInterestsDistribution(),
  // ...
]);

// Check for errors and log them
const errors: string[] = [];
const metricNames = ["schoolEngagement", "userGrowth", "careerInterests", ...];

for (let i = 0; i < results.length; i++) {
  if (results[i].status === "rejected") {
    const metricName = metricNames[i];
    const error = results[i].reason;
    errors.push(`${metricName}: ${error?.message || String(error)}`);
    logger.error(`Analytics metric ${metricName} failed`, {
      error: error?.message || String(error),
      stack: error?.stack
    });
  }
}

if (errors.length > 0) {
  return errorResponse(`Failed to fetch analytics data: ${errors.join("; ")}`, 500);
}
```

**Files Fixed**:
- [src/app/api/admin/analytics-data/route.ts:142-220](src/app/api/admin/analytics-data/route.ts)

---

## Testing Commands (February 28, 2026)

```bash
# Type check
npx tsc --noEmit

# Test with authentication (get auth token from browser)
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3003/api/admin/analytics-data
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3003/api/admin/notifications
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3003/api/admin/partners
```

---

## Additional Fixes (February 28, 2026 - Evening Session)

### Error: API Routes - "Cannot destructure property 'user' of 'auth' as it is null"

**Severity**: CRITICAL (All notifications, push, and user profile APIs failing)

**Symptoms**:
```
Error: Cannot destructure property 'user' of 'auth' as it is null.
    at useNotifications.useCallback[fetchUnreadCount]
    at POST /api/user/profile
```

**Root Cause**:
Multiple API routes had `allowedRoles = []` (empty array) which tells `createApiRoute` to skip authentication and pass `auth: null` to the handler. But the handlers were trying to destructure `auth` (e.g., `const { userId } = auth` or `const { user } = auth`), which fails when `auth` is `null`.

**The `createApiRoute` Pattern**:
```typescript
// When allowedRoles is empty, auth is null
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // auth is null when allowedRoles = []
    const { userId } = auth;  // ❌ Cannot destructure null
  },
  [] // Open endpoint - no auth required
);
```

**Permanent Fix**:
For routes that require authentication, populate `allowedRoles` with all user types instead of leaving it empty.

**Before (WRONG)**:
```typescript
// src/app/api/notifications/my-notifications/unread-count/route.ts
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;  // ❌ auth is null!
    // ...
  },
  [] // ❌ Empty array means "open endpoint", auth = null
);
```

**After (CORRECT)**:
```typescript
// src/app/api/notifications/my-notifications/unread-count/route.ts
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;  // ✅ auth has { userId, user }
    // ...
  },
  ["admin", "school-admin", "teacher", "student", "parent", "counselor"] // ✅ All authenticated users
);
```

**Intentionally Public Routes** (keep `allowedRoles = []`):
- `/api/schools/search` - School search for setup wizard
- `/api/push/vapid-public-key` - Returns public VAPID key
- `/api/marketing/schools` - Public school listing
- `/api/marketing/testimonials` - Public testimonials

**Files Fixed**:
- [src/app/api/notifications/my-notifications/unread-count/route.ts](src/app/api/notifications/my-notifications/unread-count/route.ts)
- [src/app/api/notifications/my-notifications/route.ts](src/app/api/notifications/my-notifications/route.ts)
- [src/app/api/notifications/route.ts](src/app/api/notifications/route.ts)
- [src/app/api/push/subscribe/route.ts](src/app/api/push/subscribe/route.ts)
- [src/app/api/push/notifications/route.ts](src/app/api/push/notifications/route.ts)
- [src/app/api/push/settings/route.ts](src/app/api/push/settings/route.ts)
- [src/app/api/push/unsubscribe/route.ts](src/app/api/push/unsubscribe/route.ts)
- [src/app/api/user/profile/route.ts](src/app/api/user/profile/route.ts)
- [src/app/api/ai/career-coach/route.ts](src/app/api/ai/career-coach/route.ts)
- [src/app/api/ai/insights/route.ts](src/app/api/ai/insights/route.ts)
- [src/app/api/ai/skill-gap/route.ts](src/app/api/ai/skill-gap/route.ts)

---

### Error: Pending-Approval Page - User Stuck Even After Approval

**Severity**: CRITICAL (Approved users cannot access their portal)

**Symptoms**:
- User approved in database (`onboardingStatus: "complete"`, application status: `"approved"`)
- User still sees pending-approval page
- Page polls every 30 seconds but never redirects

**Root Cause #1**: Status check mismatch
- Page checked for `onboardingStatus === "enrolled"` or `"active"`
- Approve API sets status to `"complete"`

**Root Cause #2**: Response structure mismatch
- API returns: `{ data: { profile: {...}, needsSetup: false } }`
- Page accessed: `data.profile` instead of `data.data.profile`

**Permanent Fix #1** - Add "complete" to status check:

**Before (WRONG)**:
```typescript
// src/app/pending-approval/page.tsx line 53
if (userProfile?.onboardingStatus === "enrolled" || userProfile?.onboardingStatus === "active") {
  // ...
}
```

**After (CORRECT)**:
```typescript
// src/app/pending-approval/page.tsx line 53
if (userProfile?.onboardingStatus === "enrolled" ||
    userProfile?.onboardingStatus === "active" ||
    userProfile?.onboardingStatus === "complete") {  // ✅ Add "complete"
  // ...
}
```

**Permanent Fix #2** - Extract profile from nested response:

**Before (WRONG)**:
```typescript
// src/app/pending-approval/page.tsx line 41-43
const data = await response.json();
const userProfile = data.profile || data.user;  // ❌ Wrong path
```

**After (CORRECT)**:
```typescript
// src/app/pending-approval/page.tsx line 41-43
const data = await response.json();
const userProfile = data.data?.profile || data.profile || data.user;  // ✅ Check nested path first
```

**Files Fixed**:
- [src/app/pending-approval/page.tsx:53-55](src/app/pending-approval/page.tsx) - Added "complete" status check
- [src/app/pending-approval/page.tsx:43](src/app/pending-approval/page.tsx) - Fixed data extraction

---

### Error: School-Admin Setup - JSON Column Type Mismatch

**Severity**: CRITICAL (Cannot create school-admin users)

**Symptoms**:
```
Failed query: insert into "users" (...)
```

**Root Cause**:
JSON columns in the `users` table (like `section`, `parentContact`, `parentPhone`, `emergencyContact`) were receiving empty strings `""` instead of `null`. PostgreSQL JSON columns don't accept empty strings as valid JSON.

**Permanent Fix**:
Use `null` for JSON columns instead of empty strings.

**Before (WRONG)**:
```typescript
// src/app/api/setup/school-admin/route.ts line 91-122
await db.insert(users).values({
  // ...
  section: "",           // ❌ Empty string in JSON column
  parentContact: "",     // ❌ Empty string in JSON column
  parentPhone: "",       // ❌ Empty string in JSON column
  emergencyContact: "",  // ❌ Empty string in JSON column
});
```

**After (CORRECT)**:
```typescript
// src/app/api/setup/school-admin/route.ts line 91-122
await db.insert(users).values({
  // ...
  section: null,         // ✅ Use null for JSON columns
  parentContact: null,   // ✅ Use null for JSON columns
  parentPhone: null,     // ✅ Use null for JSON columns
  emergencyContact: null, // ✅ Use null for JSON columns
});
```

**Files Fixed**:
- [src/app/api/setup/school-admin/route.ts:105-114](src/app/api/setup/school-admin/route.ts)

---

### Error: School-Admin Setup - Schools Query Selecting All Columns

**Severity**: CRITICAL (Setup fails with database query error)

**Symptoms**:
```
Failed to process setup
Failed query: select "id", "name", ... from "schools" where "schools"."code" = $1
```

**Root Cause**:
The query was using `.select()` without specifying columns, which caused Drizzle to try to select all columns. Some columns like `current_session_year`, `fee_generation_date`, `fee_generation_status` may not exist in the database.

**Permanent Fix**:
Select only specific columns needed for the operation.

**Before (WRONG)**:
```typescript
// src/app/api/setup/school-admin/route.ts line 138-146
const schoolRecord = await db
  .select()  // ❌ Selects ALL columns - may fail on missing columns
  .from(schools)
  .where(eq(schools.code, data.schoolCode))
  .limit(1);
```

**After (CORRECT)**:
```typescript
// src/app/api/setup/school-admin/route.ts line 138-146
const schoolRecord = await db
  .select({
    id: schools.id,
    name: schools.name,
    code: schools.code,  // ✅ Only select what we need
  })
  .from(schools)
  .where(eq(schools.code, data.schoolCode))
  .limit(1);
```

**Files Fixed**:
- [src/app/api/setup/school-admin/route.ts:139-143](src/app/api/setup/school-admin/route.ts)

---

## Session Summary: February 28, 2026 (Evening)

| Fix Type | Files | Impact |
|----------|-------|--------|
| API routes `allowedRoles = []` | 11 | ✅ All authenticated APIs working |
| Pending-approval status check | 1 | ✅ Approved users can access portal |
| Pending-approval data extraction | 1 | ✅ Profile data loads correctly |
| School-admin JSON columns | 1 | ✅ Can create school-admin users |
| Schools query column selection | 1 | ✅ Setup completes successfully |

**Verification Commands**:
```bash
# Check database for user status
node scripts/check-user-status.js

# Test notification unread count
curl -H "Cookie: __session=YOUR_TOKEN" http://localhost:3003/api/notifications/my-notifications/unread-count

# Test user profile
curl -H "Cookie: __session=YOUR_TOKEN" http://localhost:3003/api/user/profile
```

**Database Status Check**:
```sql
-- Verify user approval
SELECT id, email, type, onboarding_complete, onboarding_status
FROM users
WHERE email = 'raplyhollow2@gmail.com';

-- Verify application status
SELECT id, user_id, school_id, status, reviewed_by, reviewed_at
FROM school_admin_applications
WHERE user_id = 'user-Uu42g3j_PqPc0QqwjxMBR';
```

---

**Last Updated**: February 28, 2026 (Evening)
**Version**: 1.5
