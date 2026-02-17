# Fix Production Navigation & RBAC Assessment Errors

## Context

**Root Issue Identified:** Students clicking assessment links get 403 errors because the RBAC system requires `assessments.create` and `assessments.read` permissions, but the **student role was never assigned these permissions**.

### Secondary Issues:
1. **404 `/dashboard/assessment`** - Route EXISTS but when students access it, they may get redirected or encounter issues
2. **404 `/forgot-password`** - Sign-in page links to non-existent route
3. **500 `/api/plans`** - API error needs investigation
4. **404 `/student/settings`** - Missing settings page

---

## Deep Dive Analysis

### Assessment Routes (ALL EXIST!):

| Route | Status |
|-------|--------|
| `/dashboard/assessment/page.tsx` | ✅ Exists - Assessment catalog |
| `/dashboard/assessment/riasec/page.tsx` | ✅ Exists |
| `/dashboard/assessment/mbti/page.tsx` | ✅ Exists |
| `/dashboard/assessment/disc/page.tsx` | ✅ Exists |
| `/dashboard/assessment/work-values/page.tsx` | ✅ Exists |
| `/dashboard/assessment/learning-styles/page.tsx` | ✅ Exists |
| `/dashboard/assessment/spark-*/page.tsx` | ✅ Exists (3 variants) |

**So the 404 is NOT because the route doesn't exist!** The issue is likely:
1. Student may not have access to `/dashboard` layout (portal-specific routing)
2. The `/dashboard` layout may redirect students to `/student`

### RBAC Permission Issue (THE 403 ROOT CAUSE):

Looking at [scripts/seed-rbac.ts:296-320](scripts/seed-rbac.ts#L296-L320):

```typescript
// Teacher - Limited permissions
const teacherPerms = [
  "perm_class_read",
  "perm_homework_create",
  "perm_assessment_create",  // ← Teacher HAS this
  "perm_assessment_read",    // ← Teacher HAS this
  ...
];
```

**BUT students are NOT given any assessment permissions!** The seed script has student role defined but NO permissions assigned to it:

```typescript
// Line 348-353 - Student component access only
{ roleId: "role_student", componentPath: "/student/*", ... }
```

**Students have NO `perm_assessment_create` or `perm_assessment_read` permissions!**

### Assessment APIs ALL require RBAC permission:

| API | Permission Required |
|-----|-------------------|
| `/api/assessments` (POST) | `assessments.create` |
| `/api/assessments` (GET) | `assessments.read` |
| `/api/assessments/mbti` (POST) | `assessments.create` |
| `/api/assessments/mbti` (GET) | `assessments.read` |
| `/api/assessments/disc` (POST) | `assessments.create` |
| `/api/assessments/riasec` (POST) | `assessments.create` |
| `/api/assessments/work-values` (POST) | `assessments.create` |
| `/api/assessments/learning-styles` (POST) | `assessments.create` |

---

## Implementation Plan

### 1. Fix Student Assessment Permissions (CRITICAL - Fixes 403)

**Option A (Recommended):** Allow self-access for assessments
- Students can create/read THEIR OWN assessments without special RBAC permission
- More intuitive - students should be able to take assessments

**Option B:** Add assessment permissions to student role
- Requires running seed script or manually adding to database
- Gives students formal assessment permissions

**Implementation (Option A):**

Modify ALL assessment API routes to allow self-access:

```typescript
// Pattern for each assessment API:
// BEFORE:
const permCheck = await requirePermission(userId, "assessments.create");
if (permCheck) return permCheck;

// AFTER:
// Allow students to create assessments for themselves
if (user.type !== "student") {
  const permCheck = await requirePermission(userId, "assessments.create");
  if (permCheck) return permCheck;
}
```

**Files to modify:**
- [src/app/api/assessments/route.ts](src/app/api/assessments/route.ts) - Lines 19-21, 158-160
- [src/app/api/assessments/mbti/route.ts](src/app/api/assessments/mbti/route.ts) - Lines 17-19, 71-73
- [src/app/api/assessments/disc/route.ts](src/app/api/assessments/disc/route.ts) - Lines 17-19
- [src/app/api/assessments/work-values/route.ts](src/app/api/assessments/work-values/route.ts) - Need to check
- [src/app/api/assessments/learning-styles/route.ts](src/app/api/assessments/learning-styles/route.ts) - Need to check

---

### 2. Fix Student Navigation Links (Fixes Confusion)

**Issue:** Student pages link to `/dashboard/assessment/*` which may cause layout/routing issues.

**Files with hardcoded `/dashboard/assessment` links:**
- [src/app/student/dashboard/page.tsx:169](src/app/student/dashboard/page.tsx#L169)
- [src/app/student/dashboard/page.tsx:267](src/app/student/dashboard/page.tsx#L267)
- [src/app/student/plan/page.tsx:475-548](src/app/student/plan/page.tsx#L475-L548)
- [src/app/student/progress/page.tsx:484](src/app/student/progress/page.tsx#L484)
- [src/app/student/results/page.tsx:583,633](src/app/student/results/page.tsx#L583)

**Solution:** Two approaches:

**Approach A:** Keep `/dashboard/assessment` links but ensure `/dashboard` layout handles student users
- Check `/dashboard/layout.tsx` for student handling

**Approach B:** Change all student links to use `/student/plan` with anchor hashes
- Since `/student/plan` contains assessment cards, link there

**RECOMMENDED:** Check `/dashboard/layout.tsx` first to see how students are handled, then decide.

---

### 3. Fix `/forgot-password` Link

**File:** [src/app/sign-in/[[...sign-in]]/page.tsx:46](src/app/sign-in/[[...sign-in]]/page.tsx#L46)

**Solution:** Use Clerk's built-in forgot password flow:
- Clerk SignIn component already has "Forgot password" link built-in
- Remove the custom link, OR
- Point to Clerk's reset URL: `/sign-in#/reset-password`

---

### 4. Create `/student/settings` Page

**New file:** `src/app/student/settings/page.tsx`

**Features:**
- Profile editing (name, bio)
- Preferences (theme - if implemented)
- Account (link to Clerk account management)

---

### 5. Fix `/api/plans` 500 Error

**File:** [src/app/api/plans/route.ts](src/app/api/plans/route.ts)

**Potential issues:**
- `db.query.careerPlans.findMany()` may fail if careerPlans query not properly configured
- `user.tenantId` may be undefined (but not used in this specific route)
- Schema mismatch

**Fix:** Add proper error handling and logger

---

## Critical Files Summary

| Priority | File | Change |
|----------|------|--------|
| 1 | `src/app/api/assessments/route.ts` | Allow self-access for students |
| 1 | `src/app/api/assessments/mbti/route.ts` | Allow self-access for students |
| 1 | `src/app/api/assessments/disc/route.ts` | Allow self-access for students |
| 1 | `src/app/api/assessments/work-values/route.ts` | Allow self-access for students |
| 1 | `src/app/api/assessments/learning-styles/route.ts` | Allow self-access for students |
| 2 | `src/app/dashboard/layout.tsx` | Check student routing |
| 3 | `src/app/sign-in/[[...sign-in]]/page.tsx` | Fix forgot-password link |
| 4 | `src/app/student/settings/page.tsx` | CREATE new page |
| 5 | `src/app/api/plans/route.ts` | Debug and fix |

---

## Verification Steps

1. **Assessments (PRIMARY FIX):**
   - Sign in as student
   - Go to `/student/plan` or `/dashboard/assessment`
   - Click "Start" on any assessment (MBTI, DISC, RIASEC, etc.)
   - Complete assessment
   - POST to assessment API should return 200 (not 403)
   - Results should be saved and displayed

2. **Navigation:**
   - From student dashboard, click assessment links
   - Should navigate correctly (no 404)

3. **Forgot Password:**
   - Visit sign-in page
   - Link should work or go to Clerk flow

4. **Settings:**
   - `/student/settings` should load (not 404)

---

## Order of Execution

1. **Fix assessment API permissions** (CRITICAL - students can't take assessments)
2. **Check `/dashboard/layout.tsx`** for student handling
3. **Fix student navigation links** if needed
4. **Fix forgot-password link**
5. **Create student settings page**
6. **Debug plans API**
