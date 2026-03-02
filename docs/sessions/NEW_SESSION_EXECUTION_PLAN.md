# NEW SESSION EXECUTION PLAN
## System Administrator + Project Manager - Multi-Session Parallel Work

**Date:** February 27, 2026
**Goal:** Fix all audit findings in parallel sessions
**Strategy:** Each agent in isolated session/worktree

---

## CRITICAL AUDIT FINDINGS TO FIX

```
┌─────────────────────────────────────────────────────────────┐
│  PRIORITY 1: Database Layer (CRITICAL)                       │
├─────────────────────────────────────────────────────────────┤
│  212 files using broken db.query API                        │
│  Must convert to db.select().from().where()                 │
│  Estimated: 40-60 hours (can be parallelized)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRIORITY 2: Mock Data Removal                              │
├─────────────────────────────────────────────────────────────┤
│  ~89 APIs returning hardcoded values                        │
│  Must replace with real database queries                    │
│  Estimated: 20-30 hours                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  PRIORITY 3: Component Integration                          │
├─────────────────────────────────────────────────────────────┤
│  17 unused components need integration                      │
│  Estimated: 10-15 hours                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## MULTI-SESSION STRATEGY

### Each Agent Gets Its Own Session

**Why:** Prevent token overflow, enable parallel work, easy recovery

**How:**
```
Session 1 → Agent A (Batch 1: Library) → worktree-a
Session 2 → Agent B (Batch 2: Transport) → worktree-b
Session 3 → Agent C (Batch 3: Hostel) → worktree-c
Session 4 → Agent D (Batch 4: School Admin) → worktree-d
...and so on
```

---

## BATCHES FOR PARALLEL SESSIONS

### Phase 1: Database Layer (212 files)

| Session | Batch | Files | db.query Count | Focus Area | Worktree |
|---------|-------|-------|----------------|------------|----------|
| 1 | A | 6 | 31 | Library APIs | worktree-lib |
| 2 | B | 5 | 42 | Transport APIs | worktree-trans |
| 3 | C | 2 | 41 | Hostel APIs | worktree-hostel |
| 4 | D | 8 | 37 | School Admin APIs | worktree-sa |
| 5 | E | 4 | 58 | Lib API Wrappers | worktree-libwrap |
| 6 | F | 2 | 15 | Services | worktree-svc |
| 7 | G | 3 | 24 | Reports APIs | worktree-reports |
| 8 | H | 5 | 29 | Parent APIs | worktree-parent |
| 9 | I | 6 | 30 | Teacher APIs | worktree-teacher |
| 10 | J | 6 | 22 | Counselor APIs | worktree-counselor |
| 11 | K | 170+ | ~100+ | All remaining files | worktree-remaining |

### Phase 2: Mock Data Removal (89 APIs)

| Session | Batch | Focus Area | Files |
|---------|-------|------------|-------|
| 12 | L | Dashboard mock data | Teacher, School Admin |
| 13 | M | Analytics mock data | Admin, Ministry |
| 14 | N | Placeholder returns | Student, Parent |
| 15 | O | GNH/Ministry data | Ministry portal |

### Phase 3: Component Integration

| Session | Batch | Focus | Components |
|---------|-------|-------|-------------|
| 16 | P | Unused components | 17 components to integrate |

---

## INSTRUCTIONS FOR NEXT CHAT SESSION

### When User Says "start new session" or "continue work":

**Step 1: System Administrator Check**
```bash
# Check current state
npx tsc --noEmit  # Should be 0 errors
grep -r "db\.query" src --include="*.ts" | wc -l  # Count remaining
```

**Step 2: Project Manager Assigns Work**
- Pick NEXT batch from above table
- Read BATCH_FILE_LIST.md for file details
- Create session-specific instructions

**Step 3: Launch Agent (Isolated Worktree)**
```
Task: Fix Batch [LETTER] - [Name]
Files: [list from BATCH_FILE_LIST.md]
Pattern: db.query → db.select()
Budget: 30k tokens
Mode: worktree isolation
Worktree: worktree-[name]
```

**Step 4: Report & Handoff**
- Save results to PROGRESS_TRACKER.md
- Mark batch complete
- Move to next batch

---

## SESSION TEMPLATE

Copy this for each new session:

```
## SESSION [NUMBER] - Batch [LETTER]

**Date:** [Current date]
**Batch:** [LETTER] - [Name]
**Files:** [count] files, [db.query] occurrences
**Worktree:** worktree-[name]

### Files to Fix:
[list from BATCH_FILE_LIST.md]

### Conversion Pattern:
db.query.table.findFirst() → db.select().from(table).where().limit(1)

### Success Criteria:
- All db.query converted to db.select()
- TypeScript compiles with 0 errors
- No runtime errors expected

### Report:
Files modified: [list]
Issues found: [notes]
Status: ✅ Complete / ⚠️ Issues / ❌ Failed
```

---

## PROGRESS TRACKING

Update this table after each session:

| Batch | Session | Files | Status | Date | Notes |
|-------|---------|-------|--------|------|-------|
| A | 1 | 6 Library | Pending | - | - |
| B | 2 | 5 Transport | Pending | - | - |
| C | 3 | 2 Hostel | Pending | - | - |
| D | 4 | 8 School Admin | Pending | - | - |
| E | 5 | 4 Lib Wrappers | Pending | - | - |
| F | 6 | 2 Services | Pending | - | - |
| G | 7 | 3 Reports | Pending | - | - |
| H | 8 | 5 Parent | Pending | - | - |
| I | 9 | 6 Teacher | Pending | - | - |
| J | 10 | 6 Counselor | Pending | - | - |
| K | 11 | 170+ Remaining | Pending | - | - |

---

## CONVERSION CHEAT SHEET

### Pattern 1: findFirst with where
```typescript
// BEFORE (BROKEN)
const result = await db.query.users.findFirst({
  where: eq(users.id, id)
});

// AFTER (WORKING)
const [result] = await db
  .select()
  .from(users)
  .where(eq(users.id, id))
  .limit(1);
```

### Pattern 2: findMany
```typescript
// BEFORE (BROKEN)
const results = await db.query.classes.findMany({
  where: eq(classes.schoolId, schoolId)
});

// AFTER (WORKING)
const results = await db
  .select()
  .from(classes)
  .where(eq(classes.schoolId, schoolId));
```

### Pattern 3: with relations (use JOIN)
```typescript
// BEFORE (BROKEN)
const data = await db.query.homework.findMany({
  where: eq(homework.classId, classId),
  with: { students: true, submissions: true }
});

// AFTER (WORKING)
const data = await db
  .select({
    homework: homework,
    student: students,
    submission: homeworkSubmissions
  })
  .from(homework)
  .leftJoin(students, eq(homework.id, students.homeworkId))
  .leftJoin(homeworkSubmissions, eq(homework.id, homeworkSubmissions.homeworkId))
  .where(eq(homework.classId, classId));
```

### Pattern 4: orderBy
```typescript
// BEFORE (BROKEN)
const latest = await db.query.results.findFirst({
  orderBy: [desc(results.createdAt)]
});

// AFTER (WORKING)
const [latest] = await db
  .select()
  .from(results)
  .orderBy(desc(results.createdAt))
  .limit(1);
```

---

## SUCCESS METRICS

### After All Sessions Complete:

- ✅ 0 files using db.query
- ✅ 0 TypeScript errors
- ✅ All APIs return real data
- ✅ 0 mock/hardcoded values
- ✅ Build passes
- ✅ MCP Test ready

---

## FILES TO READ FIRST

1. **SESSION_HANDOFF_FEB27.md** - Overall context
2. **BATCH_FILE_LIST.md** - File lists by batch
3. **docs/AUDIT_REPORT_FEB27.md** - Full audit findings
4. **PROGRESS_TRACKER.md** - (Create this) Session progress

---

## QUICK COMMAND REFERENCE

```bash
# Count remaining db.query
grep -r "db\.query" src --include="*.ts" | wc -l

# Type check
npx tsc --noEmit

# Find files with db.query in specific dir
grep -l "db\.query" src/app/api/library/*.ts

# Build check
npm run build
```

---

**Ready for multi-session parallel execution.**

**First Action:** Start Session 1 - Batch A (Library APIs)