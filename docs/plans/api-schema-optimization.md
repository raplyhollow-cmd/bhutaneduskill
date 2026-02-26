# API & Schema Optimization Plan

> **STATUS:** Proposed | **PRIORITY:** High | **ESTIMATED EFFORT:** 4-5 weeks
> **CREATED:** 2026-02-25

---

## Context

This Bhutan EduSkill project has grown to **145+ database tables**, **354+ API routes**, and **222 `any` types**. Sprint 1 optimizations already reduced code by ~600 lines and fixed 13 N+1 query problems, achieving 95-97% query reduction in affected endpoints.

**Significant opportunities remain** to make the project smaller, smarter, and faster through:
1. Consolidating duplicate API route patterns (~95 routes need migration)
2. Further schema rationalization (some tables may be redundant)
3. Type safety improvements (222 → <50 `any` types target)
4. Component consolidation opportunities

---

## Recommended Approach

### 1. API Route Wrapper Migration (High Impact - Smaller Codebase)

**Current State:** ~354 API routes, only ~5 migrated to wrapper pattern

**Problem:** Each route repeats ~100 lines of auth/error handling:
```typescript
// Repeated 300+ times across codebase
try {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }
  const { userId, user } = authResult;
  // ... business logic
} catch (error) {
  logger.apiError(error, { route, method });
  return NextResponse.json({ error: "Failed" }, { status: 500 });
}
```

**Solution:** Migrate remaining routes to use `createApiRoute` wrapper

**Files to modify:**
- `src/lib/api/route-handler.ts` - Already exists, extend if needed
- All routes in `src/app/api/*/route.ts` (~95 remaining)

**Estimated savings:** ~1,600 lines of code

**Priority routes to migrate:**
1. All admin routes (`/api/admin/**`)
2. All school-admin routes (`/api/school-admin/**`)
3. All teacher routes (`/api/teacher/**`)
4. All student routes (`/api/student/**`)

---

### 2. Setup API Consolidation (High Impact - Smarter Architecture)

**Current State:** 6 setup APIs (student, teacher, parent, counselor, school-admin, admin)

**Problem:** Each has ~150 lines with ~120 lines duplicated

**Solution:** Create unified setup helper

**File to create:** `src/lib/api/setup-helpers.ts`

```typescript
export async function createSetupUser(
  clerkUser: ClerkUser,
  userType: UserType,
  additionalData: Record<string, unknown>
): Promise<User> {
  // Common user creation logic
  // Handle all setup in one place
}

export async function completeSetup(userId: string, userType: UserType) {
  // Common setup completion logic
}
```

**Files to modify:**
- `src/app/api/setup/*/route.ts` (6 files)

**Estimated savings:** ~600 lines of code

---

### 3. Type Safety Improvements (High Impact - Smarter Code)

**Current State:** 222 `any` types remaining (target: <50)

**Solution:** Create specific types for common patterns

**Files to modify:**
- `src/types/index.ts` - Add missing types
- All files using `any` for API responses, DB queries, component props

**Key types to add:**
```typescript
// API Response types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Common entity types
export interface DbClass { /* ... */ }
export interface DbSubject { /* ... */ }
export interface DbHomework { /* ... */ }

// Form data types
export interface ClassFormData { /* ... */ }
export interface TeacherFormData { /* ... */ }
```

**Priority areas:**
1. API route handlers (highest `any` concentration)
2. Database query results
3. Component props

---

### 4. Schema Rationalization (Medium Impact - Faster Queries)

**Current State:** 145+ tables across multiple schema files

**Potential optimizations:**

1. **Audit for redundant tables:**
   - Check for tables with similar purposes that could merge
   - Look for unused tables (check via code search)
   - Identify JSON-field opportunities (replacing related tables)

2. **Index optimization:**
   - Add composite indexes for common query patterns
   - Audit `schoolId` + `status` type queries
   - Add indexes for foreign keys used in JOINs

3. **Denormalization opportunities:**
   - Consider adding computed fields for expensive queries
   - Cache frequently accessed aggregates

**File to audit:** `src/lib/db/schema.ts` and all `*-schema.ts` files

**Action:** Run query analysis to identify:
- Most frequently accessed tables
- Slowest queries (add logging)
- Missing indexes

---

### 5. Portal Layout Consolidation (Medium Impact - Smarter Auth)

**Current State:** 7 portal layouts with duplicate auth logic

**Solution:** Create unified portal layout component

**File to create:** `src/components/layouts/portal-layout.tsx`

```typescript
export function PortalLayout({
  children,
  portalType,
  sidebarComponent,
}: PortalLayoutProps) {
  // Unified auth check, setup redirect, sidebar rendering
}
```

**Files to modify:**
- `src/app/*/layout.tsx` (7 portal layouts)

**Estimated savings:** ~350 lines of duplicate auth/setup logic

---

### 6. Response Helper Expansion (Low Effort - Consistency)

**Current State:** Response helpers exist but not used everywhere

**Solution:** Enforce usage across all routes

**File exists:** `src/lib/api/response-helpers.ts`

**Action:** Replace manual `NextResponse.json()` calls with helpers:
- `successResponse(data)`
- `createdResponse(data)`
- `badRequestResponse(message)`
- `notFoundResponse(resource)`
- `errorResponse(message, status)`

---

## Implementation Order

### Phase 1: Foundation (Week 1)
1. Extend `createApiRoute` wrapper if needed
2. Create `setup-helpers.ts`
3. Add missing types to `src/types/index.ts`

### Phase 2: Migration (Week 2-3)
1. Migrate admin routes (~15 routes)
2. Migrate school-admin routes (~25 routes)
3. Consolidate setup APIs (6 routes)

### Phase 3: Cleanup (Week 4)
1. Migrate teacher/student/parent routes
2. Consolidate portal layouts
3. Run type check, fix remaining `any` types

### Phase 4: Optimization (Week 5)
1. Schema audit and index optimization
2. Query performance analysis
3. Documentation update

---

## Verification

After each phase:

```bash
# Type check
npx tsc --noEmit

# Build check
npm run build

# Verify count of 'any' types
grep -r ": any" src/ | wc -l

# Count API lines
find src/app/api -name "*.ts" | xargs wc -l
```

**Target metrics:**
| Metric | Current | Target |
|--------|---------|--------|
| `any` types | 222 | <50 |
| API route wrapper usage | 5/354 | 300/354 |
| Code lines | ~10,000 | ~8,000 |
| N+1 query problems | 0 | 0 |

---

## Critical Files to Modify

| File | Purpose | Impact |
|------|---------|--------|
| `src/lib/api/route-handler.ts` | Extend wrapper | High |
| `src/lib/api/setup-helpers.ts` | Create new | High |
| `src/types/index.ts` | Add types | High |
| `src/app/api/admin/**/*.ts` | Migrate routes | High |
| `src/app/api/school-admin/**/*.ts` | Migrate routes | High |
| `src/app/api/setup/**/*.ts` | Consolidate | High |
| `src/components/layouts/portal-layout.tsx` | Create new | Medium |
| `src/lib/db/schema.ts` | Audit/optimize | Medium |

---

## References

- Working wrapper example: `src/app/api/classes/route.ts`
- Response helpers: `src/lib/api/response-helpers.ts`
- N+1 fix patterns: `docs/memory/code-optimization-patterns.md`
- API patterns: `docs/memory/api-patterns.md`
- Database patterns: `docs/memory/database-patterns.md`
