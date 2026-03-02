# PROGRESS TRACKER - Multi-Session Execution
## db.query → db.select() Migration

**Start Date:** February 27, 2026
**Total Files:** 212 with db.query
**Target:** 0 files with db.query

---

## OVERALL PROGRESS

```
db.query files: [████░░░░░░░░░░░░░░░░░] 7% (17/229 converted)
Sessions complete: 0/11
```

---

## SESSION LOG

| Session | Batch | Files | db.query | Status | Date | Agent ID |
|---------|-------|-------|----------|--------|------|----------|
| 1 | A | 6 Library | 31 | ⏸️ Ready | - | - |
| 2 | B | 5 Transport | 42 | ⏸️ Ready | - | - |
| 3 | C | 2 Hostel | 41 | ⏸️ Ready | - | - |
| 4 | D | 8 School Admin | 37 | ⏸️ Ready | - | - |
| 5 | E | 4 Lib Wrappers | 58 | ⏸️ Ready | - | - |
| 6 | F | 2 Services | 15 | ⏸️ Ready | - | - |
| 7 | G | 3 Reports | 24 | ⏸️ Ready | - | - |
| 8 | H | 5 Parent | 29 | ⏸️ Ready | - | - |
| 9 | I | 6 Teacher | 30 | ⏸️ Ready | - | - |
| 10 | J | 6 Counselor | 22 | ⏸️ Ready | - | - |
| 11 | K | 170+ | 100+ | ⏸️ Ready | - | - |

---

## BATCH DETAILS

### Batch A: Library APIs (6 files, 31 db.query)
- [ ] src/app/api/library/route.ts (7)
- [ ] src/app/api/library/books/route.ts (1)
- [ ] src/app/api/library/reservations/route.ts (8)
- [ ] src/app/api/library/members/route.ts (3)
- [ ] src/app/api/library/issue/route.ts (6)
- [ ] src/app/api/library/fines/route.ts (6)

### Batch B: Transport APIs (5 files, 42 db.query)
- [ ] src/app/api/transport/route.ts (6)
- [ ] src/app/api/transport/vehicles/route.ts (9)
- [ ] src/app/api/transport/drivers/route.ts (9)
- [ ] src/app/api/transport/routes/route.ts (11)
- [ ] src/app/api/transport/allocations/route.ts (7)

### Batch C: Hostel APIs (2 files, 41 db.query)
- [ ] src/app/api/hostel/route.ts (27)
- [ ] src/app/api/hostel/allocations/route.ts (14)

### Batch D: School Admin APIs (8 files, 37 db.query)
- [ ] src/app/api/school-admin/payroll/route.ts (6)
- [ ] src/app/api/school-admin/payroll/[id]/route.ts (6)
- [ ] src/app/api/school-admin/payroll/run/route.ts (11)
- [ ] src/app/api/school-admin/fees/generate/route.ts (6)
- [ ] src/app/api/school-admin/fees/defaulters/route.ts (2)
- [ ] src/app/api/school-admin/fees/structures/route.ts (1)
- [ ] src/app/api/school-admin/fees/structures/[id]/route.ts (1)
- [ ] src/app/api/school-admin/medical/route.ts (4)

### Batch E: Lib Wrappers (4 files, 58 db.query)
- [ ] src/lib/api/student.ts (20)
- [ ] src/lib/api/teacher.ts (10)
- [ ] src/lib/api/school-admin.ts (18)
- [ ] src/lib/api/counselor.ts (10)

### Batch F: Services (2 files, 15 db.query)
- [ ] src/lib/services/progress.service.ts (8)
- [ ] src/lib/services/notification.service.ts (7)

### Batch G: Reports APIs (3 files, 24 db.query)
- [ ] src/app/api/reports/route.ts (16)
- [ ] src/app/api/reports/report-card/route.ts (6)
- [ ] src/app/api/reports/fees/collection/route.ts (2)

### Batch H: Parent APIs (5 files, 29 db.query)
- [ ] src/app/api/parent/dashboard/route.ts (7)
- [ ] src/app/api/parent/children/route.ts (7)
- [ ] src/app/api/parent/attendance/route.ts (3)
- [ ] src/app/api/parent/homework/route.ts (6)
- [ ] src/app/api/parent/assessments/route.ts (6)

### Batch I: Teacher APIs (6 files, 30 db.query)
- [ ] src/app/api/teacher/homework/route.ts (7)
- [ ] src/app/api/teacher/homework/[id]/route.ts (4)
- [ ] src/app/api/teacher/lessons/route.ts (6)
- [ ] src/app/api/teacher/lessons/[id]/route.ts (5)
- [ ] src/app/api/teacher/modules/route.ts (2)
- [ ] src/app/api/teacher/modules/[id]/route.ts (6)

### Batch J: Counselor APIs (6 files, 22 db.query)
- [ ] src/app/api/counselor/red-flags/scan/route.ts (7)
- [ ] src/app/api/counselor/red-flags/route.ts (2)
- [ ] src/app/api/counselor/sessions/route.ts (3)
- [ ] src/app/api/counselor/sessions/[id]/route.ts (2)
- [ ] src/app/api/counselor/career-plans/route.ts (4)
- [ ] src/app/api/counselor/assessments/results/route.ts (4)

### Batch K: Remaining Files (170+ files, 100+ db.query)
- All remaining files across the codebase

---

## SESSION NOTES TEMPLATE

```
### Session [N] - Batch [LETTER]

**Date:** YYYY-MM-DD
**Agent ID:** xxxxx
**Worktree:** worktree-[name]

**Files Modified:**
- file1.ts - Changes made
- file2.ts - Changes made

**Issues Found:**
- [List any problems]

**Status:** ✅ Complete / ⚠️ Partial / ❌ Failed

**Next Steps:**
- [What to do next]
```

---

## MILESTONES

- [ ] Milestone 1: Batches A-C complete (Library, Transport, Hostel)
- [ ] Milestone 2: Batches A-F complete (Add School Admin, Wrappers, Services)
- [ ] Milestone 3: Batches A-J complete (All major APIs)
- [ ] Milestone 4: Batch K complete (All remaining files)
- [ ] Milestone 5: 0 db.query remaining ✅
- [ ] Milestone 6: TypeScript 0 errors
- [ ] Milestone 7: MCP Test ready

---

## QUICK STATS

```
Total Sessions: 11
Sessions Complete: 0
Sessions Remaining: 11
Total Files: 212
Files Complete: 0
Files Remaining: 212
Estimated Time: 8-12 hours parallel
```

---

*Last Updated: February 27, 2026*
*Update this file after each session completes*