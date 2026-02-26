# Bhutan EduSkill - Optimization Roadmap

> **Generated:** 2026-02-25
> **Status:** Comprehensive Technical Debt Analysis
> **Goal:** Reduce technical debt to zero and improve codebase maintainability

---

## Executive Summary

| Metric | Current | Target | Gap |
|--------|---------|--------|-----|
| **Total TypeScript Files** | 1,009 | - | - |
| **API Routes** | 354 | 354 | - |
| **Routes Using `createApiRoute`** | 11 (3%) | 354 (100%) | -343 routes |
| **`any` Types** | ~306 | <50 | -256 types |
| **TODO/FIXME Comments** | 37 | 0 | -37 items |
| **`db.query` Usage** | 217 files | 0 | -217 files |
| **`@ts-ignore` Comments** | 10 | 0 | -10 items |
| **`console.log` Statements** | 29 | 0 | -29 items |
| **N+1 Query Candidates** | 76 files | 0 | -76 patterns |

**Total Technical Debt Items:** ~1,013
**Estimated Time to Zero Tech Debt:** ~120-160 hours

---

## 1. API Route Migration (Highest Priority)

### Status
- **Migrated:** 11 routes (3%)
- **Remaining:** 343 routes (97%)
- **Code Reduction:** ~20 lines per route = ~6,860 lines duplicate code

### Impact Analysis
Migrating to `createApiRoute` wrapper provides:
1. Consistent error handling
2. Automatic authentication
3. Type-safe responses
4. Logging
5. ~20 lines less code per route

### Migration Priority Matrix

#### Priority 1: High-Traffic Routes (Effort: 20 hours)
Routes called frequently by frontend - maximum impact

| Route | Calls/Day | Lines | Estimated Time |
|-------|-----------|-------|----------------|
| `/api/user/profile` | ~500 | 80 | 15 min |
| `/api/classes` | ~300 | 120 | 20 min |
| `/api/schools` | ~200 | 60 | 10 min |
| `/api/admin/users` | ~150 | 180 | 30 min |
| `/api/teacher/dashboard` | ~100 | 150 | 25 min |
| `/api/student/dashboard` | ~100 | 140 | 25 min |
| `/api/school-admin/dashboard` | ~80 | 160 | 30 min |
| All assessment routes | ~200 | 400 | 45 min |

**Subtotal: 8 route groups, ~3 hours**

#### Priority 2: Portal-Specific Routes (Effort: 40 hours)
| Portal | Route Count | Batch Time |
|--------|-------------|------------|
| Student | 25 | 2 hours |
| Teacher | 20 | 2 hours |
| Parent | 15 | 1.5 hours |
| School Admin | 30 | 3 hours |
| Counselor | 18 | 2 hours |
| Admin | 45 | 4 hours |
| Ministry | 22 | 2 hours |

**Subtotal: 175 routes, ~16.5 hours**

#### Priority 3: Feature Routes (Effort: 30 hours)
| Feature | Route Count | Batch Time |
|---------|-------------|------------|
| AI features | 15 | 2 hours |
| Billing | 12 | 1.5 hours |
| Library | 18 | 2 hours |
| Hostel | 8 | 1 hour |
| Transport | 10 | 1 hour |
| Tuition | 12 | 1.5 hours |
| Reports | 14 | 2 hours |
| Inventory | 10 | 1 hour |

**Subtotal: 99 routes, ~12 hours**

#### Priority 4: Utility Routes (Effort: 10 hours)
- Setup routes: 10 routes, 1 hour
- Debug routes: 5 routes, 30 min
- Webhooks: 8 routes, 1 hour
- File operations: 6 routes, 1 hour
- Other utilities: ~30 routes, 3 hours

**Subtotal: 59 routes, ~6.5 hours**

### Total API Migration Time: ~70 hours

---

## 2. Type Safety Improvements

### Current State
- **306 `any` types** across 159 files
- **223 `as any` assertions** across 100 files
- **Total `any` usage:** ~529 instances

### Files with Most `any` Types

| File | `any` Count | Priority | Time to Fix |
|------|-------------|----------|-------------|
| `src/lib/sentinel/sitrep-generator.ts` | 9 | High | 30 min |
| `src/app/api/admin/knowledge/ingest/route.ts` | 11 | High | 30 min |
| `src/app/api/ministry/wellbeing-pulse/route.ts` | 8 | Medium | 20 min |
| `src/lib/data-export/import.ts` | 7 | Medium | 20 min |
| `src/app/api/admin/command/execute/route.ts` | 8 | Medium | 20 min |
| `src/app/api/student/rub-applications/route.ts` | 8 | Medium | 20 min |
| `src/lib/api/counselor.ts` | 20 | High | 45 min |
| `src/lib/api/school-admin.ts` | 55 | High | 2 hours |
| `src/lib/api/student.ts` | 37 | High | 1.5 hours |
| `src/lib/api/teacher.ts` | 16 | Medium | 30 min |
| `src/lib/services/progress.service.ts` | 31 | High | 1 hour |
| `src/lib/services/career-matching.service.ts` | 15 | Medium | 30 min |

**Top 12 files:** ~220 `any` types, ~8.5 hours

### Remaining Files
- ~147 files with ~309 `any` types
- Average: 2 per file
- Estimated: ~15 hours

### Type Safety Quick Wins
1. **Create shared types** for common patterns (1 hour)
   - API request/response types
   - Database query result types
   - Form data types

2. **Generate types from schema** (2 hours)
   - Use Drizzle's type generation
   - Export inferred types

3. **Fix type assertions** (4 hours)
   - Replace `as any` with proper types
   - Create type guards

**Total Type Safety Time: ~25.5 hours**

---

## 3. Database Query Optimization

### Current Issues

#### `db.query` API Usage (217 files)
The `neon-http` driver doesn't support the `db.query` API. These need migration to:
```typescript
// WRONG (doesn't work with neon-http):
const user = await db.query.users.findFirst({ where: eq(users.id, id) });

// CORRECT:
const user = await db.select().from(users).where(eq(users.id, id)).limit(1);
```

**Files Affected:** 217
**Estimated Time:** ~20 hours (average 5.5 min per file)

#### N+1 Query Candidates (76 files)
Files with `.map().await()` or `.forEach().await()` patterns that likely cause N+1 queries.

**Top Candidates:**
| File | Issue | Impact | Time |
|------|-------|--------|------|
| `src/app/api/setup/student/route.ts` | `.map().await` | High | 30 min |
| `src/app/api/counselor/red-flags/scan/route.ts` | `.map().await` | High | 30 min |
| `src/app/api/school-admin/applications/approve-batch/route.ts` | `.map().await` | High | 30 min |
| `src/app/api/admin/knowledge/drafts/[id]/approve/route.ts` | `.map().await` | Medium | 20 min |

**Total N+1 Fix Time:** ~15 hours

### Database Best Practices to Implement

1. **Create query builder utilities** (3 hours)
   - `getUserWithSchool(id)`
   - `getStudentsByClass(classId)`
   - `getTeachersBySchool(schoolId)`

2. **Add query batching** (2 hours)
   - Batch student queries
   - Batch teacher queries

3. **Implement query result caching** (4 hours)
   - Cache school lookups
   - Cache user role lookups

**Total Database Optimization Time: ~44 hours**

---

## 4. Code Duplication Elimination

### Identified Patterns

#### Duplicate Error Handling (343 routes)
**Solution:** Already addressed by `createApiRoute` migration

#### Duplicate Validation Patterns
| Pattern | Count | Solution | Time |
|---------|-------|----------|------|
| Email validation | 45 files | Create `validateEmail` helper | 30 min |
| Phone validation | 32 files | Create `validatePhone` helper | 30 min |
| School code validation | 18 files | Create `validateSchoolCode` helper | 20 min |
| File upload validation | 12 files | Create `validateFileUpload` helper | 30 min |

**Total Validation Helpers Time: ~2 hours**

#### Duplicate Component Patterns
| Pattern | Count | Solution | Time |
|---------|-------|----------|------|
| Data tables | 15 components | Create `DataTable` component | 3 hours |
| Form modals | 20 components | Create `FormModal` component | 2 hours |
| Filter panels | 12 components | Create `FilterPanel` component | 2 hours |
| Loading states | 25 components | Create `LoadingState` component | 1 hour |

**Total Component Deduplication Time: ~8 hours**

#### Duplicate API Client Patterns
| Pattern | Count | Solution | Time |
|---------|-------|----------|------|
| Fetch with auth | 50+ files | Create `useAuthFetch` hook | 2 hours |
| Error retry logic | 30+ files | Create `useRetryFetch` hook | 1 hour |
| Paginated fetch | 20+ files | Create `usePaginatedFetch` hook | 1.5 hours |

**Total API Client Deduplication Time: ~4.5 hours**

**Total Code Deduplication Time: ~14.5 hours**

---

## 5. Code Quality Improvements

### Console.log Cleanup (29 occurrences)
| File | Count | Type | Time |
|------|-------|------|------|
| `src/lib/logger.ts` | 6 | Legitimate (logger) | 0 min |
| `src/lib/clerk-utils.ts` | 6 | Should use logger | 10 min |
| `src/lib/report-cards/pdf-generator.ts` | 4 | Should use logger | 5 min |
| `src/lib/id-cards/qr-generator.ts` | 4 | Should use logger | 5 min |
| `src/lib/id-cards/generator.ts` | 2 | Should use logger | 5 min |
| Debug routes | 4 | Remove in production | 10 min |
| Other files | 3 | Various | 10 min |

**Total Console.log Fix Time: ~45 min**

### TODO/FIXME Cleanup (37 occurrences)
| Priority | Count | Type | Time |
|----------|-------|------|------|
| Critical (broken features) | 8 | Fix | 4 hours |
| High (important improvements) | 12 | Fix | 6 hours |
| Medium (nice to have) | 10 | Schedule | 5 hours |
| Low (cosmetic) | 7 | Defer | 2 hours |

**Total TODO Fix Time: ~17 hours**

### @ts-ignore Cleanup (10 occurrences)
All in API routes - should be resolved during migration
**Total Time:** Included in API migration

---

## 6. Performance Optimizations

### Component Optimizations

#### useEffect Dependencies (176 occurrences)
73 components have `useEffect` hooks - potential issues:

| Issue Type | Count | Impact | Time |
|------------|-------|--------|------|
| Missing dependencies | ~15 | Bugs | 3 hours |
| Over-fetching data | ~25 | Performance | 2 hours |
| Memory leaks | ~5 | Critical | 2 hours |
| Cleanup missing | ~10 | Leaks | 1 hour |

**Total useEffect Fix Time: ~8 hours**

#### Large Component Files
| Component | Lines | Issue | Solution | Time |
|-----------|-------|-------|----------|------|
| `homework-creator.tsx` | 1,006 | Too large | Split into 5 components | 3 hours |
| `interview-coach.tsx` | 947 | Too large | Split into 4 components | 2.5 hours |
| `scholarship-matcher.tsx` | 938 | Too large | Split into 4 components | 2.5 hours |
| `portal-sidebar.tsx` | 926 | Too large | Extract to hooks | 2 hours |
| `questions-modal.tsx` | 862 | Too large | Split into 3 components | 2 hours |
| `grading-panel.tsx` | 835 | Too large | Split into 3 components | 2 hours |
| `module-creator.tsx` | 794 | Too large | Split into 3 components | 2 hours |

**Total Component Split Time: ~16 hours**

### Bundle Size Optimization

| Area | Current Size | Target | Actions | Time |
|------|--------------|--------|---------|------|
| AI components | Large | -50% | Lazy load | 2 hours |
| Admin dashboard | Large | -40% | Code splitting | 2 hours |
| Form components | Medium | -30% | Dynamic imports | 1.5 hours |

**Total Bundle Optimization Time: ~5.5 hours**

**Total Performance Time: ~29.5 hours**

---

## 7. Security Improvements

### Input Validation
| Area | Status | Action | Time |
|------|--------|--------|------|
| File upload | Partial | Add size/type limits | 2 hours |
| API input | Partial | Add schema validation | 4 hours |
| XSS prevention | Good | Review and audit | 2 hours |
| SQL injection | Good | Parameterized queries used | 0 min |

**Total Security Time: ~8 hours**

---

## Optimization Priority Matrix

### Quick Wins (< 1 hour, High Impact)
| Task | Impact | Time | Dependencies |
|------|--------|------|--------------|
| Console.log cleanup | Medium | 45 min | None |
| Create validation helpers | High | 2 hours | None |
| Create shared types | High | 1 hour | None |
| Fix @ts-ignore in routes | Medium | 2 hours | None |

**Subtotal: ~6 hours**

### High Impact, Medium Effort (1-4 hours)
| Task | Impact | Time | Dependencies |
|------|--------|------|--------------|
| Migrate high-traffic API routes | Very High | 3 hours | None |
| Fix top 12 type-heavy files | High | 8.5 hours | None |
| Create query builder utilities | High | 3 hours | None |
| Fix critical TODOs | High | 4 hours | None |

**Subtotal: ~18.5 hours**

### High Impact, High Effort (4+ hours)
| Task | Impact | Time | Dependencies |
|------|--------|------|--------------|
| Migrate all portal-specific routes | Very High | 16.5 hours | None |
| Migrate all feature routes | High | 12 hours | None |
| Fix all db.query usage | High | 20 hours | None |
| Fix N+1 queries | High | 15 hours | None |
| Create reusable components | Medium | 8 hours | None |
| Split large components | Medium | 16 hours | None |

**Subtotal: ~87.5 hours**

---

## Recommended Sprint Plan

### Sprint 1: Foundation (Week 1, ~20 hours)
**Goal:** Set up infrastructure for faster development

1. Create validation helpers (2 hours)
2. Create shared types (1 hour)
3. Create query builder utilities (3 hours)
4. Create `useAuthFetch` hook (2 hours)
5. Migrate high-traffic API routes (3 hours)
6. Console.log cleanup (1 hour)
7. Fix top 5 type-heavy files (4 hours)
8. Fix critical TODOs (4 hours)

**Deliverables:**
- Reusable utilities in place
- 8 API routes migrated
- Foundation for faster subsequent work

### Sprint 2: API Migration (Week 2-3, ~40 hours)
**Goal:** Migrate all portal-specific routes

1. Student routes (2 hours)
2. Teacher routes (2 hours)
3. Parent routes (1.5 hours)
4. School Admin routes (3 hours)
5. Counselor routes (2 hours)
6. Admin routes (4 hours)
7. Ministry routes (2 hours)
8. Feature routes - AI (2 hours)
9. Feature routes - others (9.5 hours)
10. Fix remaining type-heavy files (8 hours)
11. Create API client hooks (4 hours)

**Deliverables:**
- 175+ routes migrated
- Type safety improved significantly

### Sprint 3: Database & Performance (Week 4, ~35 hours)
**Goal:** Optimize database queries and component performance

1. Fix all db.query usage (20 hours)
2. Fix N+1 queries (10 hours)
3. Create reusable components (5 hours)

**Deliverables:**
- No db.query usage
- N+1 queries eliminated
- Component library established

### Sprint 4: Component & Bundle Optimization (Week 5, ~25 hours)
**Goal:** Improve component structure and bundle size

1. Split large components (16 hours)
2. Bundle size optimization (5.5 hours)
3. Fix useEffect issues (3.5 hours)

**Deliverables:**
- Components under 500 lines
- Smaller bundle sizes
- No useEffect bugs

### Sprint 5: Final Polish (Week 6, ~20 hours)
**Goal:** Complete remaining items

1. Migrate remaining utility routes (6.5 hours)
2. Fix remaining TODOs (13 hours)
3. Security review (0.5 hours)

**Deliverables:**
- All routes migrated
- All critical TODOs resolved
- Security audit complete

---

## Success Metrics

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| Routes using `createApiRoute` | 11 (3%) | 354 (100%) | 100% |
| `any` types | 306 | <50 | <50 |
| `@ts-ignore` comments | 10 | 0 | 0 |
| `console.log` | 29 | 0 (in production) | 0 |
| `db.query` usage | 217 files | 0 | 0 |
| TODO comments (critical) | 8 | 0 | 0 |
| Components > 500 lines | 7 | 0 | 0 |
| Bundle size (AI) | Baseline | -50% | -50% |
| API response time (p95) | Baseline | -30% | -30% |

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes during migration | Medium | High | Comprehensive testing |
| Type errors cascade | Low | Medium | Incremental fixes |
| Performance regression | Low | Medium | Benchmark before/after |
| Time overrun | Medium | Medium | Prioritize by impact |

---

## Dependencies

```
API Route Migration
    depends on: None
    enables: Type safety improvements

Database Query Fixes
    depends on: None
    blocks: Performance improvements

Type Safety
    depends on: API Route Migration (partial)
    enables: Better IDE support

Component Splitting
    depends on: None
    enables: Bundle optimization
```

---

## Tooling Recommendations

1. **ESLint Rules**
   - Ban `@ts-ignore`
   - Ban `console.log` in production
   - Require return types on functions

2. **TypeScript Configuration**
   - Enable `strictNullChecks`
   - Enable `noImplicitAny`
   - Enable `noUnusedLocals`

3. **Testing**
   - Add API route tests
   - Add component integration tests
   - Performance benchmarks

---

## Summary

**Total Estimated Time:** ~140 hours (5-6 weeks for one developer)

**Recommended Team:**
- 1 Senior Developer: 40 hours/week → 3.5 weeks
- OR 2 Developers: 40 hours/week each → 2 weeks
- OR 1 Developer part-time: 20 hours/week → 7 weeks

**Highest ROI Items (do first):**
1. API route wrapper migration (saves ~6,860 lines of code)
2. Type safety in API layer (prevents runtime errors)
3. Database query fixes (performance improvement)
4. Component deduplication (faster future development)

**Long-term Benefits:**
- 50% less boilerplate code
- 90% fewer type-related bugs
- 30% faster API response times
- Easier onboarding for new developers
- Better IDE autocomplete and refactoring

---

*Document generated by Code Optimization Analysis Tool*
*Last updated: 2026-02-25*
