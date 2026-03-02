# Class Bulk Operations & RBAC Plan

**Date:** 2026-03-02
**Status:** Planning Phase

---

## Problem Statement

1. **Bulk Operations Needed:** Classes need bulk student management (add/remove multiple students at once)
2. **RBAC Gap:** No distinction between "regular teacher" and "class teacher" in permissions
3. **Cross-Portal Consistency:** Bulk operations should work in both School Admin and Teacher portals
4. **Class Teacher Assignment:** Need a way to designate which teacher is the "class teacher" for a class

---

## Proposed Solution

### 1. RBAC: Class Teacher Role

#### Option A: Add `isClassTeacher` flag to teacher_assignments table
```sql
ALTER TABLE teacher_assignments ADD COLUMN is_class_teacher BOOLEAN DEFAULT false;
```

**Pros:**
- A teacher can be class teacher for multiple classes
- Flexible for schools with different models
- Existing schema can accommodate

**Cons:**
- Need to query to check if someone is class teacher
- More complex to validate

#### Option B: Add `classTeacherId` to classes table (ALREADY EXISTS!)
```sql
classes.class_teacher_id -- already exists!
```

**Pros:**
- Simple direct lookup
- Already in schema
- One class = one class teacher

**Cons:**
- Only one class teacher per class
- May need to support multiple in future

**RECOMMENDATION:** Use existing `classTeacherId` column, add helper function to check if current user is class teacher.

---

### 2. Bulk Operations Matrix

| Operation | School Admin | Class Teacher | Regular Teacher | Notes |
|-----------|--------------|---------------|-----------------|-------|
| Add students (bulk) | ✅ | ✅ | ❌ | Only for assigned class |
| Remove students (bulk) | ✅ | ✅ | ❌ | Only for assigned class |
| Assign subjects | ✅ | ✅ | ❌ | For their class only |
| Take attendance | ✅ | ✅ | ❌ | For their class only |
| View class roster | ✅ | ✅ (own class) | ❌ | Subject teachers see subject-specific |
| Edit class details | ✅ | ❌ | ❌ | Only school admin |
| Delete class | ✅ | ❌ | ❌ | Only school admin |

---

### 3. API Routes Needed

#### Bulk Student Operations
```
POST /api/school-admin/classes/[id]/students/bulk
POST /api/teacher/classes/[id]/students/bulk
DELETE /api/school-admin/classes/[id]/students/bulk
DELETE /api/teacher/classes/[id]/students/bulk
```

#### Class Teacher Check
```
GET /api/teacher/my-classes
- Returns classes where current user is class_teacher
```

#### Bulk Subject Assignments (future)
```
POST /api/school-admin/classes/[id]/subjects/bulk
```

---

### 4. Teacher Portal Changes

#### Navigation Update
```
Current: Dashboard | My Classes | Students | ...
New: Dashboard | My Classes* | Subject Assignments | ...
```

*"My Classes" = only classes where user is assigned as class_teacher*

#### Permission Check Helper
```typescript
// lib/permissions.ts
export async function isClassTeacher(classId: string, userId: string): Promise<boolean> {
  const classRecord = await db
    .select({ classTeacherId: classes.classTeacherId })
    .from(classes)
    .where(eq(classes.id, classId))
    .limit(1);

  return classRecord[0]?.classTeacherId === userId;
}

export async function requireClassTeacher(classId: string) {
  const auth = await requireAuth(['teacher']);
  if ('error' in auth) return auth;

  const isClassTeacherResult = await isClassTeacher(classId, auth.userId);
  if (!isClassTeacherResult) {
    return { error: "Only class teachers can perform this action", status: 403 };
  }

  return auth;
}
```

---

### 5. UI Components

#### Bulk Add Students Panel (School Admin & Teacher)
```
┌─────────────────────────────────────────┐
│ Add Students to Class 9-A               │
├─────────────────────────────────────────┤
│ Search: [_________________] [Select All] │
│                                         │
│ ☑ Sonam Wangchuk   sonam@school.edu    │
│ ☑ Karma Tshering    karma@school.edu    │
│ ☐ Tashi Dorji       tashi@school.edu    │
│                                         │
│ [Cancel]             [Add 2 Students]   │
└─────────────────────────────────────────┘
```

#### School Admin Classes Page
- Bulk create classes (already exists)
- Bulk assign teachers
- Bulk activate/deactivate

#### Teacher Portal - My Classes Page
- Only show classes where user is class_teacher
- Bulk add/remove students
- Class roster view
- Attendance quick actions

---

### 6. Implementation Steps

#### Phase 1: Backend (Priority 1)
1. ✅ Add `classTeacherId` check helper function
2. ✅ Create bulk add students API
3. ✅ Create bulk remove students API
4. ✅ Create "my classes" API for teachers

#### Phase 2: School Admin UI (Priority 1)
1. ✅ Bulk add students in class slide-over
2. ✅ Bulk remove students option
3. ✅ Visual indicator for selected students

#### Phase 3: Teacher Portal (Priority 2)
1. ✅ Create "My Classes" page
2. ✅ Class slide-over with bulk operations
3. ✅ Only show class teacher permissions

#### Phase 4: Additional Features (Priority 3)
1. Bulk assign subjects to classes
2. Bulk attendance marking
3. Export class roster (PDF/Excel)

---

### 7. Permission Logic Flow

```
User tries to access class management
         ↓
    Check user type
         ↓
  ┌──────┴──────┐
  │             │
School Admin   Teacher
  │             │
  │        Check: is user classTeacherId for this class?
  │             │
  │        ┌────┴────┐
  │       Yes        No
  │        │          │
  │     Allow      Deny (403)
  │        │
  │    Allow bulk operations for THIS CLASS ONLY
  │
  Allow all operations for ALL classes
```

---

### 8. Database Schema Considerations

#### Current Schema (Already Good!)
```sql
classes (
  id,
  name,
  grade,
  section,
  class_teacher_id, -- ← Already exists!
  school_id,
  ...
)
```

#### No changes needed! The existing schema supports this.

---

### 9. Open Questions

1. **Can a teacher be class teacher for multiple classes?**
   - Current schema: YES (class_teacher_id is per class, not per teacher)
   - Recommendation: Allow it, many schools have this

2. **Should subject teachers have any bulk permissions?**
   - Recommendation: NO, only class teachers get bulk operations
   - Subject teachers can only mark attendance for their subject

3. **Should we add "assistant class teacher" role?**
   - Recommendation: Not for MVP, can add later if needed

4. **Bulk operations audit trail?**
   - Recommendation: Log who added/removed which students and when

---

### 10. API Response Standards

#### Success Response
```json
{
  "success": true,
  "data": {
    "added": 5,
    "failed": 0,
    "students": [...]
  }
}
```

#### Partial Success Response
```json
{
  "success": true,
  "data": {
    "added": 3,
    "failed": 2,
    "errors": [
      { "studentId": "xxx", "reason": "Already enrolled" }
    ]
  }
}
```

---

### 11. Frontend State Management

```typescript
// Bulk selection state
const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());

// Toggle all
const toggleSelectAll = () => {
  if (selectedStudentIds.size === availableStudents.length) {
    setSelectedStudentIds(new Set());
  } else {
    setSelectedStudentIds(new Set(availableStudents.map(s => s.id)));
  }
};

// Bulk action
const bulkAdd = async () => {
  const response = await fetch(`/api/classes/${classId}/students/bulk`, {
    method: "POST",
    body: JSON.stringify({ studentIds: Array.from(selectedStudentIds) })
  });
  // Handle response...
};
```

---

## Summary

| Feature | Status | Priority |
|---------|--------|----------|
| Use existing class_teacher_id | ✅ Already in schema | - |
| Bulk add students API | 🔨 In Progress | P1 |
| School Admin bulk UI | 🔨 In Progress | P1 |
| Teacher "My Classes" page | 📋 Planned | P2 |
| Teacher portal bulk UI | 📋 Planned | P2 |
| Permission helper function | 📋 Planned | P1 |

---

## Next Steps

1. ✅ Finish bulk add students UI in class slide-over
2. Create bulk students API endpoint
3. Test bulk add/remove functionality
4. Create "My Classes" page for teacher portal
5. Add permission checks to teacher portal routes