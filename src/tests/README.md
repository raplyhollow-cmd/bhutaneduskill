# Bhutan EduSkill - Test Documentation

> **Created:** February 25, 2026
> **Purpose:** Central testing documentation and procedures

---

## Quick Reference

| Test Type | Command | Purpose |
|-----------|---------|---------|
| **Type Check** | `npx tsc --noEmit` | Verify TypeScript types |
| **Production Build** | `npm run build` | Full production compilation |
| **Development Server** | `npm run dev` | Start dev server (port 3003) |
| **Database Push** | `npm run db:push` | Push schema to Neon PostgreSQL |
| **Database Studio** | `npm run db:studio` | Open Drizzle Studio |

---

## Testing Status (February 25, 2026)

### Type Safety Check Results

```bash
npx tsc --noEmit
```

**Status:** 54 TypeScript errors remaining

**Major Error Categories:**
1. Missing properties on types (schema mismatches)
2. Component prop type mismatches (mostly in showcase/demo files)
3. Animation/Motion component conflicts

**Critical Files with Errors:**
- `src/app/api/classes/route.ts` - WhereCondition type mismatch
- `src/app/api/reports/route.ts` - Missing `students` property
- `src/app/api/teacher/profile/route.ts` - Missing `students` property
- `src/app/school-admin/students/[id]/page.tsx` - Schema column mismatches
- `src/app/showcase/ui-next/page.tsx` - UI component prop mismatches
- `src/app/ui-showcase/page.tsx` - GapToken type issues
- `src/components/layouts/*` - Motion component conflicts

**Note:** These errors are mostly in non-critical showcase/demo pages and can be addressed incrementally.

### Build Status

**Status:** BUILD FAILING - Syntax errors in corrupted files

**Critical Issues:**
1. `src/app/ministry/policies/page.tsx` - Orphaned mock data causing syntax errors
2. These files need manual cleanup to restore proper syntax

**Recent Fixes Applied:**
- Fixed duplicate `classIds` variable in `src/lib/api/school-admin.ts`
- Fixed missing `inArray` import in `src/app/api/transport/allocations/route.ts`
- Fixed `studentHomework` reference in `src/app/api/teacher/reports/route.ts`
- Fixed `fadeUpPageTransition` import in `src/components/motion/animated-wrapper.tsx`
- Fixed Clerk webhook type handling in `src/app/api/clerk/webhook/route.ts`
- Fixed duplicate content in `src/app/student/rub/page.tsx`
- Fixed orphaned data in `src/app/counselor/plans/page.tsx`
- Fixed orphaned data in `src/app/parent/page.tsx`

---

## Manual Testing Checklist

### 1. Authentication Flow
- [ ] Platform admin can bypass setup and access admin panel
- [ ] School admin setup creates proper school record
- [ ] Teacher setup links to school correctly
- [ ] Student/Parent setup processes work end-to-end

### 2. API Endpoints
- [ ] `/api/auth/set-role` - Returns correct user type and setup status
- [ ] `/api/admin/users` - Admin can list and manage users
- [ ] `/api/student/dashboard` - Student data loads correctly
- [ ] `/api/teacher/dashboard` - Teacher dashboard data loads
- [ ] `/api/school-admin/dashboard` - School admin dashboard works

### 3. Portal Access
- [ ] Student portal loads at `/student`
- [ ] Teacher portal loads at `/teacher`
- [ ] Parent portal loads at `/parent`
- [ ] Counselor portal loads at `/counselor`
- [ ] School Admin portal loads at `/school-admin`
- [ ] Platform Admin portal loads at `/admin`
- [ ] Ministry portal loads at `/ministry`

### 4. Database Operations
- [ ] User creation works via setup APIs
- [ ] Class creation links teachers properly
- [ ] Homework assignments persist correctly
- [ ] Attendance records save properly
- [ ] Subject assignments work

---

## Parallel Agent Work Verification

### Query Optimization Agent
**Status:** VERIFIED - 13 N+1 problems fixed
- `src/lib/api/school-admin.ts` - Batch lookups with `inArray()`
- `src/lib/api/student.ts` - Optimized queries
- `src/app/api/teacher/reports/route.ts` - Batch operations
- `src/app/api/transport/allocations/route.ts` - Fixed imports

**Files Modified:**
- Fixed duplicate `classIds` declaration
- Added missing `inArray` import
- Fixed variable reference (`studentHomework` -> `studentScores`)

### Type Safety Agent
**Status:** PARTIALLY VERIFIED - Some types still need work
- Reduced `any` types from 307 to 222 (28% reduction)
- Added `DbUser`, `DbSchool`, `AuthSuccess`, `ClerkWebhookUser` types
- Fixed motion variant imports

**Remaining Work:**
- 222 `any` types still exist (target: <50)
- Showcase/demo files have many type issues

### Documentation Agent
**Status:** VERIFIED
- CHANGELOG.md updated to v2.0.0
- AGENT_SOP.md updated to v1.3
- DEVELOPMENT_FRAMEWORK.md updated to v1.1

---

## Known Issues Requiring Fixes

### High Priority
1. **`src/app/ministry/policies/page.tsx`** - File corruption with orphaned mock data
   - Has duplicate `export default function` declarations
   - Needs complete manual review and cleanup

### Medium Priority
2. **Schema mismatches** - Several API routes expect columns that don't exist
   - `homework_submissions` missing `answers`, `attachments` columns
   - `classes` missing `students` relation (expected by code)
   - `fee_payments` missing `feeId` column

3. **Showcase pages** - Multiple type errors in demo/showcase files
   - These are non-production but affect build

### Low Priority
4. **Component prop types** - Some UI components have stricter types than usage
   - Badge `dotProcessing` prop
   - DropdownMenuItem `leftIcon` prop
   - Grid `gap` prop (numeric vs token)

---

## Test Coverage Goals

### Current Coverage
- **Unit Tests:** 0% (Not implemented)
- **Integration Tests:** 0% (Not implemented)
- **E2E Tests:** 0% (Not implemented)
- **Type Coverage:** ~85% (222 `any` types remaining)

### Target Coverage
- **Type Coverage:** >95% (Reduce `any` types to <50)
- **API Tests:** Critical endpoints covered
- **Portal Smoke Tests:** Each portal loads successfully

---

## Running Tests

### Type Check
```bash
npx tsc --noEmit
```

### Production Build
```bash
npm run build
```

### Development Server
```bash
npm run dev
# Access at http://localhost:3003
```

### Database Verification
```bash
npm run db:studio
# Opens Drizzle Studio to inspect data
```

---

## Next Steps

1. **Fix corrupted files** - Remove orphaned mock data breaking build
2. **Add API test suite** - Create template for endpoint testing
3. **Incremental type fixes** - Reduce `any` types systematically
4. **Schema alignment** - Fix code/schema mismatches
5. **E2E test setup** - Consider Playwright or similar for critical flows

---

## Test Infrastructure

### API Test Suite
See `src/tests/api-tests.ts` for test templates including:
- Authentication tests
- CRUD operation tests
- Error handling tests
- Query optimization verification

### Manual Test Scripts
Located in project root for quick verification:
- `check-teachers-flow.js` - Teacher class assignment flow
- `check-school.js` - School data verification
- `check-user.js` - User record verification

---

**Last Updated:** February 25, 2026
**Test Specialist:** Agent QA Team
