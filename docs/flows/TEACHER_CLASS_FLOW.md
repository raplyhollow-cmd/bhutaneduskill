# Teacher & Class Management Flow

## Current Status (Working)

✅ Platform Admin creates school (with code)
✅ School-admin signs up with school code
✅ Platform admin approves school-admin application
✅ Teacher signs up with school code
✅ School-admin creates class

---

## Missing Flows (To Implement)

### 1. Teacher Approval Flow

**Current Issue:** Teachers sign up but aren't being approved by school-admins.

**Required Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ TEACHER SIGNUP FLOW                                                          │
└─────────────────────────────────────────────────────────────────────────────┘

1. Teacher visits /signup or /setup/teacher
2. Selects "Teacher" role
3. Enters school code (validated against schools table)
4. Fills personal details, qualifications, experience
5. Submits

┌─────────────────────────────────────────────────────────────────────────────┐
│ DATABASE: teacher_applications table created                                │
│ - userId: links to users table                                              │
│ - schoolId: links to schools table                                          │
│ - status: "pending"                                                         │
│ - qualifications, experience, subjects, desiredClasses                      │
└─────────────────────────────────────────────────────────────────────────────┘

6. School-admin logs in
7. Goes to /school-admin/teachers/pending
8. Sees list of pending teacher applications
9. Reviews each application:
   - View qualifications, experience, subjects
   - Approve OR Reject
10. On approve:
    - teacher_applications.status = "approved"
    - users.type = "teacher" (already set)
    - users.schoolId = linked to school
    - users.onboardingComplete = true

11. Teacher can now login and access /teacher dashboard
```

---

### 2. Teacher-Class Assignment Flow

**Current Issue:** Classes are created but teachers aren't properly assigned.

**Required Flow:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ CLASS CREATION & TEACHER ASSIGNMENT                                          │
└─────────────────────────────────────────────────────────────────────────────┘

OPTION A: Assign During Class Creation
───────────────────────────────────────
1. School-admin goes to /school-admin/classes/create
2. Fills class details:
   - Name: "Class 9 A"
   - Grade: 9
   - Section: "A"
   - Room Number: "Room 101"
   - Capacity: 40
3. Selects Class Teacher (dropdown of approved teachers)
4. Selects Subject Teachers (multi-select)
5. Creates class

DATABASE:
┌─────────────────────────────────────────────────────────────────────────────┐
│ classes table:                                                               │
│ - id, schoolId, name, grade, section, roomNumber, capacity                   │
│ - classTeacherId (main homeroom teacher)                                    │
│ - classTeacherName (denormalized for display)                               │
│ - teacherId (primary teacher)                                               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ teacher_assignments table:                                                   │
│ - id, teacherId, classId, subjectId, academicYear                          │
│ - role: "homeroom" | "subject_teacher" | "both"                            │
│ - isPrimary: boolean                                                        │
└─────────────────────────────────────────────────────────────────────────────┘

OPTION B: Assign After Class Creation
───────────────────────────────────────
1. School-admin goes to /school-admin/classes
2. Clicks on a class
3. Clicks "Assign Teachers" button
4. Selects:
   - Class Teacher (homeroom)
   - Subject Teachers with their subjects
5. Saves

┌─────────────────────────────────────────────────────────────────────────────┐
│ MULTIPLE TEACHERS PER CLASS                                                  │
│                                                                              │
│ A class can have:                                                            │
│ - 1 Class Teacher (homeroom) - manages the class                            │
│ - Multiple Subject Teachers - teach specific subjects                       │
│                                                                              │
│ Example: Class 9 A                                                           │
│ - Class Teacher: Mr. Karma Wangchuk (homeroom)                              │
│ - Math Teacher: Ms. Tashi Deki                                              │
│ - Science Teacher: Mr. Pema Lhamo                                            │
│ - English Teacher: Mrs. Sangay Choden                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Subject Management Flow

**Required before proper teacher assignment:**

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ SUBJECT CREATION                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. School-admin goes to /school-admin/subjects
2. Creates subjects for each grade:
   - Math (Grade 9)
   - Science (Grade 9)
   - English (Grade 9)
   - Dzongkha (Grade 9)
   - etc.
3. Each subject has:
   - name, code, grade, type (core/elective)
   - description, weekly periods

┌─────────────────────────────────────────────────────────────────────────────┐
│ TEACHER-SUBJECT-CLASS MAPPING                                                │
│                                                                              │
│ When assigning a subject teacher to a class:                               │
│ - Create entry in teacher_assignments with:                                │
│   - teacherId: the teacher's user ID                                        │
│   - classId: the class ID                                                   │
│   - subjectId: the subject ID                                               │
│   - role: "subject_teacher"                                                 │
│   - academicYear: "2025-2026"                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Summary

### Key Tables for Teacher-Class Flow

```sql
-- Users table (teachers, students, school-admins, etc.)
users (
  id, clerk_user_id, type, role, name, first_name, last_name, email,
  school_id,      -- Links to school after approval
  employee_id,    -- For teachers
  subjects,       -- JSON array of subject IDs teacher can teach
  onboarding_complete, onboarding_status, is_active
)

-- Teacher applications (pending approval)
teacher_applications (
  id, user_id, school_id, status,  -- "pending" | "approved" | "rejected"
  qualifications, experience, subjects, desired_classes,
  applied_at, reviewed_by, reviewed_at, rejection_reason
)

-- Classes
classes (
  id, school_id, name, grade, section, room_number, capacity,
  class_teacher_id,      -- Primary homeroom teacher
  class_teacher_name,    -- Denormalized for display
  teacher_id,            -- Alias for class_teacher_id
  homeroom_teacher_id,   -- Another homeroom teacher field
  homeroom_teacher_name, -- Denormalized for display
  academic_year, is_active
)

-- Teacher assignments (many-to-many: teachers × classes × subjects)
teacher_assignments (
  id, teacher_id, class_id, subject_id, academic_year,
  role,  -- "homeroom" | "subject_teacher" | "both"
  is_primary, is_active
)

-- Subjects
subjects (
  id, school_id, name, code, grade, type, description,
  is_active
)

-- Enrollments (students in classes)
enrollments (
  id, student_id, class_id, school_id, status,  -- "active" | "inactive" | "withdrawn"
  enrollment_date, roll_number
)
```

---

## Implementation Checklist

### Phase 1: Teacher Approval (Priority: HIGH)

- [ ] **Create `/school-admin/teachers/pending` page**
  - List all pending teacher applications for the school
  - Show teacher details (qualifications, experience, subjects)
  - Approve/Reject buttons with confirmation
  - Add rejection reason dialog

- [ ] **Create approval API action** (`/api/school-admin/teachers/approve`)
  - Update `teacher_applications.status` to "approved"
  - Link `users.schoolId` to the school
  - Set `users.onboardingComplete = true`
  - Send notification to teacher

- [ ] **Update teacher setup flow**
  - When teacher completes setup, create entry in `teacher_applications`
  - Set status to "pending"
  - Redirect to "pending approval" page

### Phase 2: Subject Management (Priority: MEDIUM)

- [ ] **Create `/school-admin/subjects` page**
  - List all subjects for the school
  - Create/Edit/Delete subjects
  - Filter by grade

- [ ] **Seed initial subjects**
  - Core subjects for all grades (6-12)
  - Include Dzongkha, English, Math, Science, etc.

### Phase 3: Teacher-Class Assignment (Priority: HIGH)

- [ ] **Update `/school-admin/classes/create` form**
  - Add "Class Teacher" dropdown (approved teachers only)
  - Add "Subject Teachers" multi-select
  - Save to `teacher_assignments` table

- [ ] **Create `/school-admin/classes/[id]/teachers` page**
  - View current teacher assignments for a class
  - Add/remove teacher assignments
  - Assign subjects to teachers

### Phase 4: Student Enrollment (Priority: MEDIUM)

- [ ] **Create `/school-admin/students/enroll` page**
  - Select class
  - Select students to enroll (or add new students)
  - Create entries in `enrollments` table

---

## API Endpoints Needed

### Teacher Approval

```typescript
// GET /api/school-admin/teachers/pending
// Get list of pending teacher applications

// POST /api/school-admin/teachers/[teacherId]/approve
// Approve a teacher application

// POST /api/school-admin/teachers/[teacherId]/reject
// Reject a teacher application with reason
```

### Teacher Assignments

```typescript
// GET /api/school-admin/classes/[classId]/teachers
// Get all teacher assignments for a class

// POST /api/school-admin/classes/[classId]/teachers
// Assign teacher to class with subject

// DELETE /api/school-admin/teacher-assignments/[assignmentId]
// Remove teacher assignment
```

### Subject Management

```typescript
// GET /api/school-admin/subjects
// Get all subjects for school

// POST /api/school-admin/subjects
// Create new subject

// PUT /api/school-admin/subjects/[subjectId]
// Update subject

// DELETE /api/school-admin/subjects/[subjectId]
// Delete subject
```

---

## Next Steps

1. **Start with Teacher Approval Flow** - This is blocking everything else
2. **Add Subject Management** - Need subjects before teacher-subject assignment
3. **Complete Class Creation** - Add teacher selection to class creation form
4. **Build Enrollment System** - Add students to classes

Would you like me to implement any of these flows?
