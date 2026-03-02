# SESSION HANDOFF - February 27, 2026
## Bhutan EduSkill - Multi-Session Parallel Execution Plan

**Session Status:** TypeScript 0 errors, Core fixes complete, Audit complete
**Token Budget:** 200k per session
**Remaining Work:** 212 files with broken db.query, 89 APIs with mock data

**IMPORTANT FILES TO READ FIRST:**
1. `NEW_SESSION_EXECUTION_PLAN.md` ⭐ **READ THIS FIRST**
2. `PROGRESS_TRACKER.md` - Track session progress
3. `docs/AUDIT_REPORT_FEB27.md` - Honest assessment
4. `BATCH_FILE_LIST.md` - File lists by batch

**Documentation claims 100% complete → Reality is ~70% complete**

---

## QUICK START - For Next Session

```
1. Read this file
2. Launch parallel agents (see below)
3. Each agent takes 20-30 files max
4. Work in isolation (worktree mode)
5. Report progress to central tracker
```

---

## WHAT'S BEEN DONE ✅

### TypeScript Errors
- **Status:** 0 errors (was 391)
- **Fixed:** Route handlers, motion components, schemas, imports

### Files Fixed This Session
1. `src/lib/db/subscription-schema.ts` - Added import
2. `src/lib/db/seed.ts` - Removed nameDzongkha field
3. `src/lib/hooks/use-push-notification.ts` - Uint8Array fix
4. `src/lib/motion/loading.ts` - Variant type casts
5. `src/lib/ai/gemini-server.ts` - SafetySettings casts
6. `src/components/motion/animated-wrapper.tsx` - Props spread fix
7. `src/components/motion/progress-indicator.tsx` - Props spread
8. `src/components/ui/field-validation.tsx` - onChange handler
9. `src/lib/data/bhutan-data.ts` - District insert cast
10. `src/lib/data-export/import.ts` - ExportRecord types
11. `src/lib/bcse/importer.ts` - Index signature fix

### AI Features
- **Career Coach:** Fixed db.query → db.select() conversions
- **RUB Predictor:** Verified working (already existed)

---

## CRITICAL REMAINING WORK 🔴

### Problem: db.query API is DISABLED
- **Issue:** neon-http driver doesn't support db.query
- **Impact:** 757 occurrences across 195 files are BROKEN
- **Fix Required:** Convert all to db.select().from().where() pattern

### Files with db.query (Top 50 by count)

| File | Count | Priority |
|------|-------|----------|
| src/app/api/hostel/route.ts | 27 | HIGH |
| src/app/api/hostel/allocations/route.ts | 14 | HIGH |
| src/app/api/transport/vehicles/route.ts | 9 | HIGH |
| src/app/api/transport/drivers/route.ts | 9 | HIGH |
| src/app/api/transport/routes/route.ts | 11 | HIGH |
| src/app/api/school-admin/payroll/run/route.ts | 11 | HIGH |
| src/app/api/reports/route.ts | 16 | HIGH |
| src/app/api/parent/dashboard/route.ts | 7 | MEDIUM |
| src/app/api/teacher/homework/route.ts | 7 | MEDIUM |
| src/app/api/counselor/red-flags/scan/route.ts | 7 | MEDIUM |
| src/lib/api/teacher.ts | 10 | HIGH |
| src/lib/api/school-admin.ts | 18 | HIGH |
| src/lib/api/student.ts | 20 | HIGH |
| src/lib/api/counselor.ts | 10 | HIGH |
| src/lib/services/progress.service.ts | 8 | HIGH |
| src/lib/services/notification.service.ts | 7 | HIGH |

---

## PARALLEL EXECUTION PLAN

### Strategy: Divide by Directory

**Batch 1: Library APIs (6 files)**
```
src/app/api/library/
├── route.ts (7 db.query)
├── books/route.ts (1 db.query)
├── reservations/route.ts (8 db.query)
├── members/route.ts (3 db.query)
├── issue/route.ts (6 db.query)
└── fines/route.ts (6 db.query)
```

**Batch 2: Transport APIs (5 files)**
```
src/app/api/transport/
├── route.ts (6 db.query)
├── vehicles/route.ts (9 db.query)
├── drivers/route.ts (9 db.query)
├── routes/route.ts (11 db.query)
└── allocations/route.ts (7 db.query)
```

**Batch 3: Hostel APIs (2 files)**
```
src/app/api/hostel/
├── route.ts (27 db.query)
└── allocations/route.ts (14 db.query)
```

**Batch 4: School Admin APIs (8 files)**
```
src/app/api/school-admin/
├── payroll/route.ts (6 db.query)
├── payroll/[id]/route.ts (6 db.query)
├── payroll/run/route.ts (11 db.query)
├── fees/generate/route.ts (6 db.query)
├── fees/defaulters/route.ts (2 db.query)
├── fees/structures/route.ts (1 db.query)
├── fees/structures/[id]/route.ts (1 db.query)
└── medical/route.ts (4 db.query)
```

**Batch 5: Lib API Wrappers (4 files)**
```
src/lib/api/
├── student.ts (20 db.query)
├── teacher.ts (10 db.query)
├── school-admin.ts (18 db.query)
└── counselor.ts (10 db.query)
```

**Batch 6: Services (2 files)**
```
src/lib/services/
├── progress.service.ts (8 db.query)
└── notification.service.ts (7 db.query)
```

**Batch 7: Reports APIs (3 files)**
```
src/app/api/reports/
├── route.ts (16 db.query)
├── report-card/route.ts (6 db.query)
└── fees/collection/route.ts (2 db.query)
```

**Batch 8: Parent APIs (5 files)**
```
src/app/api/parent/
├── dashboard/route.ts (7 db.query)
├── children/route.ts (7 db.query)
├── attendance/route.ts (3 db.query)
├── homework/route.ts (6 db.query)
└── assessments/route.ts (6 db.query)
```

**Batch 9: Teacher APIs (6 files)**
```
src/app/api/teacher/
├── homework/route.ts (7 db.query)
├── homework/[id]/route.ts (4 db.query)
├── lessons/route.ts (6 db.query)
├── lessons/[id]/route.ts (5 db.query)
├── modules/route.ts (2 db.query)
└── modules/[id]/route.ts (6 db.query)
```

**Batch 10: Counselor APIs (6 files)**
```
src/app/api/counselor/
├── red-flags/scan/route.ts (7 db.query)
├── red-flags/route.ts (2 db.query)
├── sessions/route.ts (3 db.query)
├── sessions/[id]/route.ts (2 db.query)
├── career-plans/route.ts (4 db.query)
└── assessments/results/route.ts (4 db.query)
```

---

## CONVERSION PATTERN

### WRONG (db.query - BROKEN)
```typescript
const user = await db.query.users.findFirst({
  where: eq(users.clerkUserId, clerkUserId)
});
```

### CORRECT (db.select - WORKS)
```typescript
const userResult = await db
  .select()
  .from(users)
  .where(eq(users.clerkUserId, clerkUserId))
  .limit(1);

const user = userResult[0] || null;
```

### COMMON PATTERNS

**Pattern 1: findFirst with where**
```typescript
// WRONG
const result = await db.query.table.findFirst({
  where: eq(table.id, id)
});

// CORRECT
const result = await db
  .select()
  .from(table)
  .where(eq(table.id, id))
  .limit(1)
  .then(rows => rows[0] || null);
```

**Pattern 2: findMany with where**
```typescript
// WRONG
const results = await db.query.table.findMany({
  where: eq(table.schoolId, schoolId)
});

// CORRECT
const results = await db
  .select()
  .from(table)
  .where(eq(table.schoolId, schoolId));
```

**Pattern 3: findMany with relations (use join)**
```typescript
// WRONG
const results = await db.query.classes.findMany({
  where: eq(classes.schoolId, schoolId),
  with: {
    students: true,
    teachers: true
  }
});

// CORRECT (use manual JOINs)
const results = await db
  .select({
    class: classes,
    student: students,
    teacher: teachers
  })
  .from(classes)
  .leftJoin(students, eq(classes.id, students.classId))
  .leftJoin(teachers, eq(classes.id, teachers.classId))
  .where(eq(classes.schoolId, schoolId));
```

**Pattern 4: findFirst with orderBy**
```typescript
// WRONG
const result = await db.query.results.findFirst({
  where: eq(results.studentId, studentId),
  orderBy: [desc(results.createdAt)]
});

// CORRECT
const result = await db
  .select()
  .from(results)
  .where(eq(results.studentId, studentId))
  .orderBy(desc(results.createdAt))
  .limit(1)
  .then(rows => rows[0] || null);
```

---

## AGENT LAUNCH INSTRUCTIONS

### For Each Batch:

```bash
# Agent template for batch work
Task: Fix db.query in {directory}

1. Navigate to: {directory}
2. Find all files with db.query
3. Convert to db.select() pattern
4. Test TypeScript compiles
5. Report files fixed

Budget: 30k tokens max
Mode: Worktree isolation
```

### Example Agent Launch:

```
Task: Fix Batch 1 - Library APIs

Files to fix:
- src/app/api/library/route.ts
- src/app/api/library/books/route.ts
- src/app/api/library/reservations/route.ts
- src/app/api/library/members/route.ts
- src/app/api/library/issue/route.ts
- src/app/api/library/fines/route.ts

Pattern: db.query → db.select()
Estimated: 45 min
Token budget: 30k
```

---

## PROGRESS TRACKING

### Status Dashboard

| Batch | Files | db.query | Status | Agent |
|-------|-------|----------|--------|-------|
| Batch 1: Library | 6 | 31 | Pending | - |
| Batch 2: Transport | 5 | 42 | Pending | - |
| Batch 3: Hostel | 2 | 41 | Pending | - |
| Batch 4: School Admin | 8 | 37 | Pending | - |
| Batch 5: Lib Wrappers | 4 | 58 | Pending | - |
| Batch 6: Services | 2 | 15 | Pending | - |
| Batch 7: Reports | 3 | 24 | Pending | - |
| Batch 8: Parent | 5 | 29 | Pending | - |
| Batch 9: Teacher | 6 | 30 | Pending | - |
| Batch 10: Counselor | 6 | 22 | Pending | - |
| **Remaining** | **47** | **329** | | |

**Already Fixed in previous sessions:** ~428 occurrences
**Total:** 757 → 329 remaining after Batch 1-10

---

## SESSION COMMANDS

### Start New Session:
```
1. Read SESSION_HANDOFF_FEB27.md
2. Launch 3-4 agents in parallel (different batches)
3. Monitor token usage (stop at 180k)
4. Update progress table
5. Save status before ending
```

### Verify Progress:
```bash
# Count remaining db.query
grep -r "db\.query" src/app/api src/lib --include="*.ts" | wc -l

# Type check
npx tsc --noEmit

# Build check
npm run build
```

---

## FILE BACKUPS

Before starting work, backup key files:
```bash
cp -r src/app/api src/app/api.backup.$(date +%s)
cp -r src/lib/api src/lib/api.backup.$(date +%s)
```

---

## MCP TEST CHECKLIST (After All db.query Fixed)

- [ ] TypeScript 0 errors
- [ ] npm run build succeeds
- [ ] npm run dev starts successfully
- [ ] All portals accessible
- [ ] Authentication works
- [ ] Database queries return real data
- [ ] No console errors in browser

---

## OFFICE ROLES

**System Administrator:**
- Monitor tokens (200k limit)
- Auto-stop agents at 180k
- Health check dashboard

**Project Manager:**
- Assign batches to agents
- Track progress
- Merge completed worktrees
- Update handoff file

**Implementation Agents:**
- Fix db.query in assigned files
- Test TypeScript compilation
- Report completion

---

## NEXT STEPS

1. **Immediate:** Fix remaining 329 db.query calls (Batches 1-10)
2. **Then:** Verify all APIs return real data
3. **Then:** Remove mock/TODO code (549 occurrences)
4. **Finally:** MCP Test for production readiness

---

**Session End:** February 27, 2026
**TypeScript Status:** 0 errors ✅
**Build Status:** Passing ✅
**Next Milestone:** Fix all db.query → db.select()
**Estimated Time:** 8-12 hours parallel execution

---

*This file will be updated as batches complete.*
