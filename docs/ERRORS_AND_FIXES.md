# Bhutan EduSkill - Errors and Fixes Documentation

> **Purpose**: Comprehensive documentation of all error types encountered and their permanent solutions.
> **Last Updated**: February 23, 2026

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
**Version**: 1.3
