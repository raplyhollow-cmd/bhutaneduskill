# Class-Based Teacher Approval System - Session Documentation

**Date:** March 2, 2026
**Session:** Bug fixes for student approval workflow and class teacher assignment

---

## Summary

This session involved implementing and fixing a **class-based teacher approval system** where only the assigned class teacher can approve students for their specific class. Multiple bugs were discovered and fixed related to database schema inconsistencies, API routing, and frontend display issues.

---

## Problems Identified

### 1. Students Bypassing Pending Approval Page
**Issue:** After completing the setup wizard, students went directly to the dashboard instead of being redirected to a pending approval page.

**Root Cause:** The middleware checked for `onboardingStatus = "restricted"` OR `"pending_approval"`, but the student setup wizard set `onboardingStatus = "pending_enrollment"` - which was NOT checked by the middleware.

**Fix:** Added `"pending_enrollment"` to the middleware check and created a `/pending-approval` page.

---

### 2. Class-Based Teacher Approval Implementation

**Initial Request:** Class teachers should be able to approve pending students for their classes.

**Implementation:**
- Modified `/api/teacher/pending-students` to filter by `classTeacherId` AND match both grade AND section
- Modified `/api/school-admin/applications/[id]/approve` to verify teacher is the assigned class teacher
- Added "Approvals" menu item to teacher portal navigation

---

### 3. Data Inconsistency: `teacherId` vs `classTeacherId`

**Critical Discovery:** The `classes` table has TWO similar columns:
- `classTeacherId` - The homeroom/class teacher (used by approval system)
- `teacherId` - Another teacher field (used by some parts of the system)

**Problems Found:**

| File | Issue | Fix |
|------|-------|-----|
| `/api/school-admin/classes/[id]/assign-teacher/route.ts` | Was setting `teacherId` instead of `classTeacherId` | Changed to set `classTeacherId` |
| `/api/teacher/students/route.ts` | Was filtering by `teacherId` instead of `classTeacherId` | Changed to filter by `classTeacherId` |
| `/api/school-admin/applications/[id]/approve/route.ts` | Auto-created classes without setting `classTeacherId` | Now sets `classTeacherId` when teacher approves |

**SQL Migration Required:**
```sql
-- One-time fix: Copy teacher_id to class_teacher_id for existing classes
UPDATE classes
SET class_teacher_id = teacher_id,
    updated_at = NOW()
WHERE teacher_id IS NOT NULL
  AND class_teacher_id IS NULL;
```

---

### 4. Student Dashboard Display Issues

**Issue:** Student dashboard showed "Class Teacher: Not Assigned" even after teacher was assigned.

**Root Cause:** The dashboard was fetching `classes.classTeacherName` (a static text field containing "To be assigned") instead of fetching the teacher's actual name from the `users` table using `classTeacherId`.

**Fix in `/lib/api/student.ts`:**
```typescript
// Before: Used classTeacherName (static field)
const [classRecord] = await db
  .select({
    name: classes.name,
    classTeacherName: classes.classTeacherName, // Static text!
  })
  .from(classes)
  .where(eq(classes.id, enrollment.classId))
  .limit(1);

// After: Fetch teacher name dynamically using classTeacherId
const [classRecord] = await db
  .select({
    name: classes.name,
    classTeacherId: classes.classTeacherId,
  })
  .from(classes)
  .where(eq(classes.id, enrollment.classId))
  .limit(1);

if (classRecord.classTeacherId) {
  const [teacher] = await db
    .select({
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(eq(users.id, classRecord.classTeacherId))
    .limit(1);
  if (teacher) {
    classTeacherName = `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim() || null;
  }
}
```

---

### 5. Student Classes Page Empty State

**Issue:** "My Classes" page showed "No classes found" even though the API returned correct data.

**Root Cause:** The API uses `successResponse()` which wraps data in a `data` property:
```json
{
  "data": {
    "classes": [...]
  }
}
```
But the frontend expected `data.classes` directly.

**Fix in `/app/student/classes/page.tsx`:**
```typescript
// Before:
.then((data) => {
  if (data.classes) {
    setClassesData(data.classes);
  }
})

// After:
.then((response) => {
  const data = response.data || response; // Unwrap successResponse
  if (data.classes) {
    setClassesData(data.classes);
  }
})
```

---

## Files Modified

### Database Schema
- `src/lib/db/schema.ts` - Added `approvedBy` and `approvedAt` columns to track who approved users

### API Routes
| File | Change |
|------|--------|
| `src/app/api/school-admin/applications/[id]/approve/route.ts` | Track approver, match by grade+section, set classTeacherId on class creation |
| `src/app/api/teacher/pending-students/route.ts` | Filter by classTeacherId and grade+section |
| `src/app/api/teacher/students/route.ts` | Use classTeacherId instead of teacherId |
| `src/app/api/school-admin/classes/[id]/assign-teacher/route.ts` | Set classTeacherId instead of teacherId |
| `src/app/api/student/classes/route.ts` | Fixed auth to use createApiRoute parameter, use classTeacherId |

### Frontend Pages
| File | Change |
|------|--------|
| `src/lib/api/student.ts` | Fetch teacher name dynamically using classTeacherId (2 occurrences) |
| `src/app/student/classes/page.tsx` | Unwrap successResponse data correctly |
| `src/config/portal-config.ts` | Added "Approvals" menu item to teacher portal |
| `src/app/teacher/approvals/page.tsx` | Fixed response parsing for successResponse |
| `src/app/school-admin/classes/create/page.tsx` | Updated labels to clarify class teacher role |
| `src/app/school-admin/students/pending/page.tsx` | Added approver info display |
| `src/app/school-admin/students/students-client.tsx` | Added "Approved By" column |

---

## Database Schema Changes

### users table
```sql
-- New columns added
ALTER TABLE users ADD COLUMN approved_by TEXT REFERENCES users(id);
ALTER TABLE users ADD COLUMN approved_at TIMESTAMP;
```

### Key Columns in classes table
```sql
-- classTeacherId: The homeroom teacher (used for approvals)
class_teacher_id TEXT REFERENCES users(id)

-- teacherId: Legacy field (some parts of system still use this)
teacher_id TEXT REFERENCES users(id)

-- classTeacherName: Static text field (should be deprecated)
class_teacher_name TEXT
```

---

## API Response Format Standard

All APIs use `successResponse()` which wraps the response:

```typescript
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// Usage
return successResponse({ classes: [...] });
// Returns: { data: { classes: [...] } }

return errorResponse("Not found", 404);
// Returns: { error: "Not found", status: 404 }
```

**Frontend must unwrap:**
```typescript
const response = await fetch("/api/...");
const data = response.data || response; // Handle both wrapped and unwrapped
```

---

## Testing Checklist

- [x] Student signup → redirects to pending approval page
- [x] Class 9A teacher can only approve Class 9A students (not 9B)
- [x] School admin can approve any student
- [x] After approval, student can access dashboard
- [x] Student dashboard shows correct class and class teacher
- [x] "My Classes" page shows enrolled classes
- [x] Teacher portal shows students in their assigned classes
- [x] Approver information is tracked and displayed

---

## Lessons Learned

1. **Schema Consistency:** Having similar columns (`teacherId` vs `classTeacherId`) causes confusion. Use one clear field per purpose.

2. **Dynamic vs Static Data:** Don't duplicate data (like `classTeacherName`). Fetch it dynamically from the source of truth (`users` table via `classTeacherId`).

3. **API Response Wrapping:** `successResponse()` wraps all responses in a `data` property. Frontends must unwrap this.

4. **Middleware Status Checks:** When adding new onboarding statuses, update middleware to include them.

5. **Class-Based Permissions:** For class-based approval systems, filter by BOTH grade AND section to ensure teachers only see their specific class.

---

## Related Documentation

- [Database Schema Reference](../database/database-schema-reference.md)
- [API Response Helpers](../../DEVELOPMENT_FRAMEWORK.md#api-routes)
- [Permission System](../core/permissions.md)
- [User Onboarding Flow](../flows/user-onboarding.md)

---

## Future Improvements

1. **Deprecate `teacherId` field** - Consolidate to only use `classTeacherId`
2. **Deprecate `classTeacherName` field** - Always fetch from users table
3. **Add caching** - Cache teacher names to avoid repeated queries
4. **Add audit log** - Track all approval actions for compliance
