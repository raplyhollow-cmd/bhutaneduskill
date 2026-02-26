# Technical Debt Audit Report

**Generated:** February 25, 2026
**Auditor:** Technical Debt Auditor Agent
**Scope:** Entire Bhutan EduSkill codebase

---

## Executive Summary

| Metric | Count | Status |
|--------|-------|--------|
| **Total API Routes** | 354 files | 🟡 High |
| **Total Components** | 218 files | 🟢 OK |
| **Total Lib Files** | 110 files | 🟢 OK |
| **Files >500 lines** | 16 files | 🟡 Needs Refactoring |
| **Files >1000 lines** | 3 files | 🔴 Critical |
| **Console.log occurrences** | 161 (79 files) | 🔴 Anti-pattern |
| **TODO/FIXME comments** | 32 | 🟡 Managed |
| **Files using `any` type** | 157 files | 🔴 Type Debt |
| **db.query API usage** | 854 occurrences | 🔴 Forbidden Pattern |
| **Relative imports** | 82 files | 🟡 Anti-pattern |
| **Backup files** | 3 files | 🟢 Safe to delete |

**Estimated Lines Removable:** ~5,000+ lines
**Priority Cleanup Items:** 12 critical issues

---

## 1. IMMEDIATE DELETION CANDIDATES

### 1.1 Backup Files (Safe to Delete)

| File | Lines | Action |
|------|-------|--------|
| `src/app/school-admin/reports/page.tsx.bak` | - | DELETE |
| `src/app/setup/unified/page.tsx.backup` | - | DELETE |
| `src/app/setup/unified/page.tsx.backup2` | - | DELETE |

**Total deletable:** 3 files

---

## 2. CRITICAL ISSUES (Must Fix)

### 2.1 Forbidden db.query API Usage (854 occurrences)

**Issue:** Code uses `db.query.*` which is disabled for neon-http driver.

**Impact:** Runtime errors, application failures.

**Files Affected:** 215 files (partial list):
- `src/lib/api/school-admin.ts`
- `src/lib/api/counselor.ts`
- `src/lib/api/student.ts`
- `src/lib/services/progress.service.ts`
- `src/lib/services/notification.service.ts`
- All API routes using `db.query.users.findFirst()`

**Required Action:**
```typescript
// WRONG (current):
const user = await db.query.users.findFirst({ where: eq(users.id, userId) });

// CORRECT:
const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
```

**Estimated Effort:** 40-60 hours to refactor all occurrences.

---

### 2.2 Console.log Anti-Patterns (161 occurrences in 79 files)

**Issue:** Direct console logging instead of using the project's logger.

**Files with Most Occurrences:**
- `src/lib/clerk-utils.ts` - 6 occurrences
- `src/lib/logger.ts` - 6 occurrences (ironic!)
- `src/app/school-admin/classes/[id]/page.tsx` - 10 occurrences
- `src/lib/report-cards/pdf-generator.ts` - 4 occurrences
- `src/lib/id-cards/qr-generator.ts` - 4 occurrences
- `src/lib/id-cards/generator.ts` - 2 occurrences

**Required Action:**
Replace all `console.log/debug/info/warn/error` with `logger.debug/info/warn/error`.

---

### 2.3 Type Debt: `any` Type Usage (157 files)

**Critical Files:**
- `src/lib/sentinel/sitrep-generator.ts` - Multiple `any` types in return types
- `src/lib/services/career-matching.service.ts` - Type casting with `as any`
- `src/components/ui/mobile-card.tsx` - `props as any`, `ref as any`
- `src/lib/services/progress.service.ts` - `(r as any).overallPercentage`

**Impact:** Type safety is compromised, potential runtime errors.

**Required Action:** Replace all `any` with proper types or `unknown` with type guards.

---

## 3. LARGE FILES (Need Refactoring)

### 3.1 God Files (>1000 lines)

| File | Lines | Issue | Recommendation |
|------|-------|-------|----------------|
| `src/lib/db/schema.ts` | 4,134 | All tables in one file | Split by domain (user, academic, billing) |
| `src/app/api/hostel/route.ts` | 1,290 | Too many actions | Split into separate route files |
| `src/app/api/certificates/[assessmentId]/route.ts` | 1,238 | Monolithic | Extract PDF generation logic |

### 3.2 Large Files (500-1000 lines)

| File | Lines | Issue | Recommendation |
|------|-------|-------|----------------|
| `src/app/api/ai/scholarships/route.ts` | 1,084 | Complex AI logic | Extract to service |
| `src/app/api/ai/insights/route.ts` | 1,035 | Multiple endpoints | Split by insight type |
| `src/app/api/ministry/billing/route.ts` | 986 | Billing complexity | Extract billing service |
| `src/app/api/reports/route.ts` | 862 | Report generation | Extract report generators |
| `src/app/api/school-admin/settings/route.ts` | 719 | Multiple settings | Split by setting domain |
| `src/lib/api/school-admin.ts` | 1,992 | API file too large | Split into domain files |
| `src/components/homework/homework-creator.tsx` | 1,006 | Complex component | Split into sub-components |
| `src/components/ai/interview-coach.tsx` | 947 | Large AI component | Extract logic hooks |
| `src/components/ai/scholarship-matcher.tsx` | 938 | Large component | Extract to service |
| `src/components/shared/portal-sidebar.tsx` | 926 | Navigation component | Extract menu items |
| `src/components/admin/questions-modal.tsx` | 862 | Complex modal | Extract question editor |

---

## 4. DUPLICATE CODE OPPORTUNITIES

### 4.1 Setup API Routes

**Pattern:** All 6 setup APIs (student, teacher, parent, counselor, school-admin, admin) have identical "create user if not exists" logic.

**Files:**
- `src/app/api/setup/student/route.ts`
- `src/app/api/setup/teacher/route.ts`
- `src/app/api/setup/parent/route.ts`
- `src/app/api/setup/counselor/route.ts`
- `src/app/api/setup/school-admin/route.ts`
- `src/app/api/setup/admin/route.ts`

**Action:** Extract to shared utility `ensureUserExists()` in `src/lib/api/setup.ts`.

**Estimated Savings:** ~300 lines

### 4.2 Assessment API Routes

**Pattern:** RIASEC, MBTI, DISC, Work Values, Learning Styles all follow identical pattern.

**Files:**
- `src/app/api/assessments/riasec/route.ts`
- `src/app/api/assessments/mbti/route.ts`
- `src/app/api/assessments/disc/route.ts`
- `src/app/api/assessments/work-values/route.ts`
- `src/app/api/assessments/learning-styles/route.ts`

**Action:** Create generic assessment handler.

**Estimated Savings:** ~200 lines

### 4.3 Modal Components

**Pattern:** Add/Edit modals follow identical structure.

**Files:**
- `src/components/admin/edit-counselor-modal.tsx`
- `src/components/admin/add-counselor-modal.tsx`
- `src/components/admin/edit-teacher-modal.tsx`
- `src/components/admin/add-assessment-type-modal.tsx`
- ... (15+ similar modals)

**Action:** Create generic modal wrapper.

**Estimated Savings:** ~400 lines

---

## 5. ANTI-PATTERNS FOUND

### 5.1 Relative Imports (82 files)

**Issue:** Using `import { X } from "../../lib/..."` instead of `@/` imports.

**Example:**
```typescript
// WRONG:
import { db } from "../../../lib/db";

// CORRECT:
import { db } from "@/lib/db";
```

**Files Affected:** 82 files

**Impact:** Maintenance difficulty when moving files.

---

### 5.2 TODO/FIXME Comments Without Issues

**Total:** 32 TODO comments

**High Priority TODOs:**

| File | Line | TODO | Priority |
|------|------|------|----------|
| `src/lib/rate-limit.ts` | 45 | Replace with Redis for production | Medium |
| `src/lib/auth-utils.ts` | 425 | Send to monitoring/audit service | High |
| `src/app/api/admin/users/[userId]/route.ts` | 526 | Handle related records cleanup | High |
| `src/app/api/admin/users/batch/route.ts` | 698 | Implement actual email sending | High |
| `src/app/api/parent/send-otp/route.ts` | 92, 98 | Integrate with Twilio/SendGrid | High |
| `src/lib/api/school-admin.ts` | 592 | Fetch actual enrollment count | Low |

**Action:** Create GitHub issues for each TODO or implement.

---

### 5.3 Component with React Import at Bottom

**Issue:** `src/components/landing/journey-timeline.tsx` has React import at line 223 (after usage).

**Impact:** Confusing, non-standard.

**Action:** Move to top of file.

---

## 6. UNUSED CODE CANDIDATES

### 6.1 Unused Exports

**Components with exports but no clear usage:**
- `src/components/landing/cta-premium.tsx` - Not referenced in main landing
- `src/components/landing/journey-timeline.tsx` - Not referenced in main landing
- `src/components/marketing/testimonials.tsx` - Duplicate of `testimonials-orbit.tsx`

**Action:** Verify usage, remove if unused.

### 6.2 Empty/Placeholder Files

Files that may be placeholders:
- `src/components/layouts/empty-state.tsx`
- `src/components/ui-next/` directory (next-gen UI components?)

**Action:** Integrate or remove.

---

## 7. PRIORITY CLEANUP LIST

### Phase 1: Critical (Week 1)

1. **Delete backup files** - 5 minutes
2. **Fix db.query API** - 40-60 hours (spread across sprint)
3. **Replace console.log with logger** - 8 hours
4. **Move React import in journey-timeline** - 2 minutes

### Phase 2: High Priority (Week 2-3)

5. **Refactor schema.ts** - Split into 5 domain files
6. **Extract setup API common logic** - 4 hours
7. **Fix relative imports** - 6 hours
8. **Create generic assessment handler** - 8 hours

### Phase 3: Medium Priority (Week 4-5)

9. **Split large components** - homework-creator, interview-coach, etc.
10. **Create generic modal wrapper** - 6 hours
11. **Replace `any` types with proper types** - 20 hours
12. **Address TODO comments** - Create issues or implement

### Phase 4: Low Priority (Ongoing)

13. **Verify unused landing components** - 2 hours
14. **Clean up empty-state files** - 2 hours

---

## 8. ESTIMATED EFFORT SUMMARY

| Category | Files | Lines Removable | Hours |
|----------|-------|-----------------|-------|
| Backup files | 3 | ~500 | 0.5 |
| Console.log cleanup | 79 | ~161 | 8 |
| db.query refactoring | 215 | ~2,000 | 50 |
| Setup API consolidation | 6 | ~300 | 4 |
| Assessment API consolidation | 5 | ~200 | 8 |
| Generic modal wrapper | 15 | ~400 | 6 |
| Large component splits | 12 | ~1,500 | 30 |
| Type fixes (`any` removal) | 157 | ~600 | 20 |
| Relative import fixes | 82 | ~246 | 6 |
| **TOTAL** | **574** | **~5,407** | **132.5** |

---

## 9. RECOMMENDATIONS

1. **Stop using `any` types** - Enforce via ESLint rule
2. **Ban relative imports** - Enforce via ESLint rule
3. **Ban console.log** - Enforce via ESLint rule (use logger instead)
4. **Add file size limit** - ESLint rule for max 500 lines per file
5. **Create API route wrapper** - Standardize error handling, auth, logging
6. **Split schema.ts** - By domain for better maintainability
7. **Extract duplicate modal logic** - Generic modal wrapper

---

## 10. SUCCESS METRICS

After cleanup, the codebase should have:

| Metric | Current | Target |
|--------|---------|--------|
| Console.log occurrences | 161 | 0 |
| db.query usage | 854 | 0 |
| Files with `any` type | 157 | <50 |
| Relative imports | 82 | 0 |
| Files >500 lines | 16 | <5 |
| TODO comments without issues | 32 | 0 |

---

**End of Audit Report**

*Generated by Technical Debt Auditor Agent*
*February 25, 2026*
