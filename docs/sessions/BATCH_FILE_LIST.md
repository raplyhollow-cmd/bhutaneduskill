# db.query FIX BATCHES - File List

**Audit Date:** February 27, 2026
**Source:** Honest code audit (not documentation)
**Total Files with db.query:** 212 files 🔴
**Working db.select files:** 17 files 🟢
**Migration Complete:** ~7%

## STATUS: CRITICAL - Database layer is BROKEN

## BATCH 1: Library APIs (6 files, 31 db.query)

```
src/app/api/library/route.ts
src/app/api/library/books/route.ts
src/app/api/library/reservations/route.ts
src/app/api/library/members/route.ts
src/app/api/library/issue/route.ts
src/app/api/library/fines/route.ts
```

## BATCH 2: Transport APIs (5 files, 42 db.query)

```
src/app/api/transport/route.ts
src/app/api/transport/vehicles/route.ts
src/app/api/transport/drivers/route.ts
src/app/api/transport/routes/route.ts
src/app/api/transport/allocations/route.ts
```

## BATCH 3: Hostel APIs (2 files, 41 db.query)

```
src/app/api/hostel/route.ts
src/app/api/hostel/allocations/route.ts
```

## BATCH 4: School Admin APIs (8 files, 37 db.query)

```
src/app/api/school-admin/payroll/route.ts
src/app/api/school-admin/payroll/[id]/route.ts
src/app/api/school-admin/payroll/run/route.ts
src/app/api/school-admin/fees/generate/route.ts
src/app/api/school-admin/fees/defaulters/route.ts
src/app/api/school-admin/fees/structures/route.ts
src/app/api/school-admin/fees/structures/[id]/route.ts
src/app/api/school-admin/medical/route.ts
```

## BATCH 5: Lib API Wrappers (4 files, 58 db.query)

```
src/lib/api/student.ts
src/lib/api/teacher.ts
src/lib/api/school-admin.ts
src/lib/api/counselor.ts
```

## BATCH 6: Services (2 files, 15 db.query)

```
src/lib/services/progress.service.ts
src/lib/services/notification.service.ts
```

## BATCH 7: Reports APIs (3 files, 24 db.query)

```
src/app/api/reports/route.ts
src/app/api/reports/report-card/route.ts
src/app/api/reports/fees/collection/route.ts
```

## BATCH 8: Parent APIs (5 files, 29 db.query)

```
src/app/api/parent/dashboard/route.ts
src/app/api/parent/children/route.ts
src/app/api/parent/attendance/route.ts
src/app/api/parent/homework/route.ts
src/app/api/parent/assessments/route.ts
```

## BATCH 9: Teacher APIs (6 files, 30 db.query)

```
src/app/api/teacher/homework/route.ts
src/app/api/teacher/homework/[id]/route.ts
src/app/api/teacher/lessons/route.ts
src/app/api/teacher/lessons/[id]/route.ts
src/app/api/teacher/modules/route.ts
src/app/api/teacher/modules/[id]/route.ts
```

## BATCH 10: Counselor APIs (6 files, 22 db.query)

```
src/app/api/counselor/red-flags/scan/route.ts
src/app/api/counselor/red-flags/route.ts
src/app/api/counselor/sessions/route.ts
src/app/api/counselor/sessions/[id]/route.ts
src/app/api/counselor/career-plans/route.ts
src/app/api/counselor/assessments/results/route.ts
```

---

## ALREADY FIXED (428 occurrences)

These files were already converted in previous sessions:
- src/app/api/ai/career-coach/route.ts ✅
- src/app/api/ai/career-predictor/route.ts ✅
- src/lib/bcse/* ✅
- src/app/api/classes/* ✅
- src/app/api/admin/* ✅
- src/app/api/student/* (partial) ✅
- src/app/api/teacher/* (partial) ✅
