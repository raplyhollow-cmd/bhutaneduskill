# SESSIONS 4-5 HANDOFF - February 27, 2026
## Bhutan EduSkill - Multi-Session Execution

**Current Status:**
- **db.query Remaining:** 207 (from original 289)
- **Fixed So Far:** 82 files (28% complete)
- **TypeScript Errors:** 56 (from automated fixes)
- **Last Session:** Session 3 - Fixed 17 files successfully

---

## CRITICAL FILES ALREADY FIXED ✅

| File | db.query Fixed | Status |
|------|----------------|--------|
| src/app/api/school-admin/settings/route.ts | 12 | ✅ Perfect (user verified) |
| src/app/api/timetable/generate/route.ts | 8 | ✅ Fixed |
| src/app/api/results/[id]/route.ts | 8 | ✅ Fixed |
| src/app/api/teacher/behavior/route.ts | 7 | ✅ Fixed |
| src/app/api/parent/children/route.ts | 7 | ✅ Fixed |
| src/app/api/events/[id]/register/route.ts | 7 | ✅ Fixed |
| src/app/api/communication/messages/route.ts | 7 | ✅ Fixed |
| src/app/parent/dashboard/_actions.ts | 6 | ✅ Fixed |
| src/app/api/teacher/profile/route.ts | 6 | ✅ Fixed |
| src/app/api/school-admin/timetable/route.ts | 6 | ✅ Fixed |
| src/app/api/rub/applications/route.ts | 6 | ✅ Fixed |
| src/app/api/parent/homework/route.ts | 6 | ✅ Fixed |
| src/app/api/parent/assessments/route.ts | 6 | ✅ Fixed |
| src/app/api/tuition/courses/route.ts | 5 | ✅ Fixed |
| src/app/api/tuition/courses/[id]/route.ts | 5 | ✅ Fixed |
| src/app/api/school-admin/timetable/[id]/route.ts | 5 | ✅ Fixed |
| src/app/api/school-admin/applications/[id]/assignment/route.ts | 5 | ✅ Fixed |

---

## FILES RESTORED (Need Refix)

| File | db.query Count | Priority | Notes |
|------|----------------|----------|-------|
| src/app/api/tuition/sessions/[id]/route.ts | 8 | HIGH | Had syntax errors, restored |
| src/app/student/_actions.ts | 7 | HIGH | Had syntax errors, restored |

---

## REMAINING FILES (Top 30 with db.query)

```
5  src/app/parent/fees/route.ts
5  src/app/counselor/dashboard/_actions.ts
4  src/app/api/teacher/homework/[id]/submissions/[submissionId]/route.ts
4  src/app/api/teacher/behavior/route.ts
4  src/app/api/teacher/attendance/history/route.ts
4  src/app/api/leave/[id]/route.ts
4  src/app/api/inventory/maintenance/route.ts
4  src/app/api/classes/[classId]/enrollments/[studentId]/route.ts
4  src/app/admin/partners/actions.ts
3  src/app/api/verification/verify-domain/route.ts
3  src/app/api/verification/school/route.ts
3  src/app/api/tuition/tutors/route.ts
3  src/app/api/tuition/tutors/[id]/route.ts
3  src/app/api/tuition/courses/route.ts
3  src/app/api/teacher/live-sessions/route.ts
3  src/app/api/teacher/attendance/[classId]/[date]/route.ts
3  src/app/api/teacher/homework/[id]/route.ts
3  src/app/api/teacher/homework/route.ts
3  src/app/api/school-admin/payroll/route.ts
3  src/app/api/school-admin/payroll/[id]/route.ts
3  src/app/api/school-admin/medical/route.ts
3  src/app/api/results/route.ts
3  src/app/api/reports/route.ts
3  src/app/api/parent/dashboard/route.ts
3  src/app/api/notification/settings/route.ts
3  src/app/api/library/reservations/route.ts
3  src/app/api/id-card/route.ts
3  src/app/api/hostel/route.ts
3  src/app/api/events/route.ts
```

---

## FIX PATTERNS (Tested & Working)

### Pattern 1: findFirst with where
```python
# BEFORE
const result = await db.query.table.findFirst({
  where: eq(table.id, value),
});

# AFTER
const [result] = await db
  .select()
  .from(table)
  .where(eq(table.id, value))
  .limit(1);
```

### Pattern 2: findMany with where
```python
# BEFORE
const results = await db.query.table.findMany({
  where: eq(table.schoolId, schoolId),
});

# AFTER
const results = await db
  .select()
  .from(table)
  .where(eq(table.schoolId, schoolId));
```

### Pattern 3: findMany with orderBy
```python
# BEFORE
const results = await db.query.table.findMany({
  where: eq(table.schoolId, schoolId),
  orderBy: (table, { desc }) => [desc(table.createdAt)],
});

# AFTER
const results = await db
  .select()
  .from(table)
  .where(eq(table.schoolId, schoolId))
  .orderBy(desc(table.createdAt));
```

### Pattern 4: Multiple queries in Promise.all
```python
# BEFORE
const [data1, data2] = await Promise.all([
  db.query.table1.findFirst({ where: eq(table1.id, id) }),
  db.query.table2.findMany({ where: eq(table2.refId, id) }),
]);

# AFTER
const [data1, data2] = await Promise.all([
  db.select().from(table1).where(eq(table1.id, id)).limit(1),
  db.select().from(table2).where(eq(table2.refId, id)),
]);
```

---

## SESSION 4 TASKS

**Priority:** Fix the 2 restored files + top 10 remaining files

1. **src/app/api/tuition/sessions/[id]/route.ts** (8 db.query)
2. **src/app/student/_actions.ts** (7 db.query)
3. **src/app/parent/fees/route.ts** (5 db.query)
4. **src/app/counselor/dashboard/_actions.ts** (5 db.query)
5. **src/app/api/teacher/homework/[id]/submissions/[submissionId]/route.ts** (4 db.query)
6. **src/app/api/teacher/attendance/history/route.ts** (4 db.query)
7. **src/app/api/leave/[id]/route.ts** (4 db.query)
8. **src/app/api/inventory/maintenance/route.ts** (4 db.query)
9. **src/app/api/classes/[classId]/enrollments/[studentId]/route.ts** (4 db.query)
10. **src/app/admin/partners/actions.ts** (4 db.query)

**Estimated:** 50+ db.query fixes

**Method:** Use Python script with careful regex patterns, verify with TypeScript after each file

---

## SESSION 5 TASKS

**Priority:** Fix remaining counselor, teacher, parent portal files

1. src/app/api/verification/verify-domain/route.ts (3)
2. src/app/api/verification/school/route.ts (3)
3. src/app/api/tuition/tutors/route.ts (3)
4. src/app/api/tuition/tutors/[id]/route.ts (3)
5. src/app/api/teacher/live-sessions/route.ts (3)
6. src/app/api/teacher/attendance/[classId]/[date]/route.ts (3)
7. src/app/api/teacher/homework/[id]/route.ts (3)
8. src/app/api/teacher/homework/route.ts (3)
9. src/app/api/school-admin/payroll/route.ts (3)
10. src/app/api/school-admin/payroll/[id]/route.ts (3)

**Estimated:** 30+ db.query fixes

---

## CRITICAL INSTRUCTIONS

### 1. After Each File Fix
```bash
# Test TypeScript
npx tsc --noEmit

# If errors occur, restore file
git checkout -- [file]

# Apply fixes more carefully
```

### 2. Python Script Template
```python
import re

filepath = "src/app/api/FILE_TO_FIX.ts"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add desc import if needed and orderBy exists
if 'orderBy' in content and ', desc' not in content and 'drizzle-orm' in content:
    content = re.sub(
        r'import \{ ([^}]+) \} from "drizzle-orm";',
        lambda m: 'import { ' + m.group(1) + ', desc, asc } from "drizzle-orm";',
        content,
        count=1
    )

# Fix patterns 1-4 from above...

with open(filepath, 'w', encoding='utf-8', newline='\n') as f:
    f.write(content)
```

### 3. Handle Array Access
After fixing findFirst, if code uses `result.property`, change to `result[0].property`:
```python
content = re.sub(r'\bresult\.([a-zA-Z_])', r'result[0].\1', content)
```

### 4. Handle Empty Checks
```python
content = re.sub(r'if \(!result\)', 'if (!result[0])', content)
content = re.sub(r'if \(result === null\)', 'if (!result[0])', content)
```

---

## PROGRESS TRACKING

```
Session 1-3: 82 files fixed (28%)
Session 4:   Target 50+ fixes
Session 5:   Target 30+ fixes

Total after Session 5: ~160/289 (55% complete)
Remaining: ~129 db.query in ~25 files
```

---

## TYPESCRIPT VERIFICATION

After each session:
```bash
# Count db.query remaining
grep -r "db\.query\." src --include="*.ts" | grep -v "//" | wc -l

# Check TypeScript errors
npx tsc --noEmit

# Build check
npm run build
```

---

## MIGRATION COMPLETE CHECKLIST

- [ ] 0 db.query remaining
- [ ] 0 TypeScript errors
- [ ] Build passes
- [ ] All portals load correctly
- [ ] MCP Test ready

---

## FILES TO READ FIRST

1. This file (SESSIONS_4-5_HANDOFF.md)
2. SESSION_3_PROGRESS_FEB27.md - Previous session details
3. PROGRESS_UPDATE_FEB27_SESSION2.md - Agent outputs
4. BATCH_FILE_LIST.md - Original file list

---

**Starting Sessions 4-5 in new chat with full context saved.**
