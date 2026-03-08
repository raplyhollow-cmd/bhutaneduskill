# School Admin Portal - Atomic Level Flow Documentation

**Portal**: School Admin
**Base Path**: `/school-admin`
**Role**: `school-admin`

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /school-admin                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Server Layout (layout.tsx)                                    │
│    - requireAuth(['school-admin'])                               │
│    - Checks Clerk authentication                                  │
│    - Verifies user exists in database                            │
│    Conditions:                                                   │
│    - 404 (no DB record) → redirect to /setup/unified             │
│    - 401 (not authenticated) → redirect to /sign-in              │
│    - Success → pass user to client component                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client Layout (school-admin-layout-client.tsx)                │
│    - useEffect triggers on mount                                 │
│    - fetch("/api/user/profile")                                  │
│    - setIsAuthenticated(true) if successful                      │
│    - Shows loading spinner while verifying                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. SetupGuard Component                                          │
│    - fetch("/api/school-admin/settings/status")                  │
│    - Returns: { setupComplete, name, code, grades }              │
│    - If setupComplete === false → InitialSetupWizard             │
│    - School admin must complete setup before accessing features  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Dashboard Renders                                             │
│    - Welcome banner                                              │
│    - 4 stat cards                                                │
│    - Pending items (if any)                                      │
│    - Active classes table                                        │
│    - Quick actions grid                                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Data Flow

### API Calls on Mount

```typescript
// File: src/app/school-admin/dashboard/page.tsx
useEffect(() => {
  fetchDashboardStats();  // Parallel
  fetchClasses({ limit: 5 });
}, []);
```

### fetchDashboardStats Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Function Call: fetchDashboardStats()                          │
│    Location: src/app/school-admin/_actions.ts line 47           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. API Call: getDashboardStats(schoolId)                         │
│    Location: src/lib/api/school-admin.ts                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Database Queries (Parallel):                                  │
│                                                                  │
│    -- Total students                                             │
│    SELECT COUNT(*) FROM users                                    │
│    WHERE type = 'student' AND schoolId = ?                      │
│                                                                  │
│    -- Total teachers                                             │
│    SELECT COUNT(*) FROM users                                    │
│    WHERE type = 'teacher' AND schoolId = ?                      │
│                                                                  │
│    -- Total classes                                              │
│    SELECT COUNT(*) FROM classes WHERE schoolId = ?              │
│                                                                  │
│    -- Pending attendance                                         │
│    SELECT COUNT(*) FROM attendance                              │
│    WHERE date = TODAY AND status IS NULL                         │
│                                                                  │
│    -- Pending fees                                                │
│    SELECT COUNT(*) FROM users                                    │
│    WHERE type = 'student' AND feeStatus = 'pending'             │
│                                                                  │
│    -- Total revenue                                              │
│    SELECT SUM(amount) FROM fee_payments WHERE schoolId = ?      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Response Structure:                                           │
│    {                                                              │
│      totalStudents: number,                                      │
│      totalTeachers: number,                                      │
│      totalClasses: number,                                       │
│      pendingAttendance: number,                                  │
│      pendingFees: number,                                        │
│      totalRevenue: number                                        │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Transformation:                                            │
│    - Stat cards with counts                                      │
│    - Pending actions panel if attendance/fees pending            │
│    - AI insights based on stats                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Students Management Flow

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /school-admin/students                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Server Component (page.tsx)                                   │
│    - Receives searchParams                                       │
│    - Passes filters to StudentsClient                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. StudentsClient Component (students-client.tsx)                │
│    - loadStudents() called on mount                              │
│    - fetchStudents() with initial filters                        │
│    - Fetches 10 students per page                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API Call: GET /api/resources/students                         │
│    Query params:                                                 │
│    - page: 1                                                     │
│    - limit: 10                                                   │
│    - search: (optional)                                          │
│    - grade: (optional)                                           │
│    - section: (optional)                                         │
│    - status: (optional)                                          │
│    - feeStatus: (optional)                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Query:                                               │
│    SELECT * FROM users                                           │
│    WHERE type = 'student'                                        │
│      AND schoolId = ?                                            │
│      AND (name LIKE ? OR email LIKE ?)                           │
│      AND grade = ?                                               │
│      AND section = ?                                             │
│      AND status = ?                                              │
│      AND feeStatus = ?                                           │
│    ORDER BY name                                                 │
│    LIMIT 10 OFFSET 0                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Response:                                                      │
│    {                                                              │
│      data: {                                                      │
│        data: [Student objects],                                  │
│        pagination: {                                             │
│          total: 150,                                             │
│          page: 1,                                                │
│          limit: 10,                                              │
│          totalPages: 15                                          │
│        }                                                          │
│      }                                                            │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. UI Renders:                                                    │
│    - 4 stat cards (Total, Active, Fee Pending, Classes)          │
│    - Filters (search, grade, section, status, fee status)        │
│    - GoogleDataTable with student records                        │
│    - Pagination controls                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Add Student Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Add Student" button                              │
│    Location: students-client.tsx line 528                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Open Modal                                                    │
│    - setShowAddModal(true)                                       │
│    - Renders student creation form                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User fills form:                                              │
│    - First Name                                                  │
│    - Last Name                                                   │
│    - Email                                                       │
│    - Phone                                                       │
│    - Grade                                                       │
│    - Section                                                     │
│    - Roll Number                                                 │
│    - Parent Contact                                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Form Submit                                                   │
│    - POST /api/resources/students                                │
│    - Body: { formData }                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API Handler (route.ts)                                        │
│    - Maps to StudentsFeature                                     │
│    - Calls feature.api.create(data, auth)                        │
│    - Inserts into users table with type='student'                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Database Insert:                                              │
│    INSERT INTO users (                                           │
│      id, clerkUserId, type, schoolId,                            │
│      firstName, lastName, email, phone,                          │
│      grade, section, rollNumber, parentContact,                  │
│      createdAt, updatedAt                                        │
│    ) VALUES (?, ?, 'student', ?, ?, ...)                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Response:                                                      │
│    { data: { id, ...createdStudent } }                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI Update:                                                    │
│    - setStudents() adds new student to list                      │
│    - Modal closes                                                │
│    - Success toast notification                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Edit Student Inline Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks edit icon or inline editable field                │
│    Location: students-client.tsx line 361                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. InPlaceText Component Activates                                │
│    - Shows input field                                           │
│    - Focuses on field                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User edits value                                              │
│    - Types new value                                             │
│    - Presses Enter or clicks away (onBlur)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. saveStudentName() called                                      │
│    - Optimistic update: setStudents() updates local state        │
│    - PUT /api/users/{studentId}                                  │
│    - Body: { [field]: value }                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API Handler                                                   │
│    - Maps to UsersFeature                                        │
│    - Calls feature.api.update(id, data, auth)                    │
│    - Updates users.[field] = value                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Database Update:                                              │
│    UPDATE users                                                   │
│    SET [field] = ?, updatedAt = NOW()                            │
│    WHERE id = ?                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. On Success:                                                   │
│    - Update confirmed in UI                                      │
│    - Success toast                                               │
│                                                                  │
│    On Error:                                                     │
│    - Rollback UI change                                          │
│    - Error toast with message                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Delete Student Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks delete icon                                       │
│    Location: students-client.tsx line 301                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Confirmation Dialog                                           │
│    - Shows student name                                           │
│    - Warning message                                             │
│    - Confirm/Cancel buttons                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User clicks Confirm                                           │
│    - DELETE /api/users/{studentId}                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. API Handler                                                   │
│    - Maps to UsersFeature                                        │
│    - Calls feature.api.delete(id, auth)                          │
│    - Soft delete: UPDATE users SET isActive = false             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Update:                                              │
│    UPDATE users                                                   │
│    SET isActive = false, updatedAt = NOW()                       │
│    WHERE id = ?                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI Update:                                                    │
│    - loadStudents() called again                                 │
│    - Student removed from current view                           │
│    - Success toast notification                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Teachers Management Flow

### Page Load Flow
```
Similar to Students page, with additional fields:
- department
- subjects (array)
- qualification
- CID number
```

### Teacher-Specific Features
- Department assignment
- Subject assignment (multiple)
- Qualification tracking
- CID (Citizen ID) number

---

## Classes Management Flow

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. /school-admin/classes                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. fetchClasses()                                                │
│    - GET /api/resources/classes                                  │
│    - Query: classes table with schoolId                          │
│    - JOIN with users for classTeacher                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Response includes:                                            │
│    - Class id, name, grade, section                              │
│    - Class teacher name (from users table)                       │
│    - Student count (aggregated)                                  │
│    - Subject assignments                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Create Class Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Click "Add Class"                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Form fields:                                                  │
│    - Name                                                        │
│    - Grade                                                       │
│    - Section                                                     │
│    - Class Teacher (optional)                                    │
│    - Capacity                                                    │
│    - Academic Year                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. POST /api/resources/classes                                   │
│    Body: { name, grade, section, teacherId, capacity, year }    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Database Insert:                                              │
│    INSERT INTO classes (                                         │
│      id, schoolId, name, grade, section,                         │
│      classTeacherId, capacity, academicYear,                     │
│      createdAt, updatedAt                                        │
│    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())              │
└─────────────────────────────────────────────────────────────────┘
```

### Add Students to Class Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Click "Add Students" on class row                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Opens student selection modal                                 │
│    - Shows available students not in class                       │
│    - Multi-select checkboxes                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User selects students, clicks "Add"                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. POST /api/resources/classes/actions?action=add-students       │
│    Body: { classId, studentIds: [...] }                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Action Handler:                                               │
│    - For each studentId in array:                                │
│      INSERT INTO class_enrollments (                             │
│        classId, studentId, status, enrolledAt                    │
│      ) VALUES (?, ?, 'active', NOW())                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI Update:                                                    │
│    - Student count updated                                       │
│    - Class list refreshed                                        │
└─────────────────────────────────────────────────────────────────┘
```

### Remove Student from Class Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Click "Remove" next to student in class detail                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Confirmation dialog                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. DELETE /api/resources/class-students/{enrollmentId}          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Database Delete:                                              │
│    DELETE FROM class_enrollments WHERE id = ?                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Update:                                                    │
│    - Student removed from class                                  │
│    - Student count updated                                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Other Pages

### Subjects Page
- Similar CRUD pattern
- Fields: name, code, grade, color, icon

### Homework Page
- List homework assignments
- Filter by class, subject, due date
- Track submission counts

### Attendance Page
- Select class and date
- Mark attendance: present/absent/late
- Bulk actions: mark all present

### Fees Page
- View fee structures
- Track student payments
- Generate fee reports

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/resources/students` | GET | List students |
| `/api/resources/students` | POST | Create student |
| `/api/users/{id}` | PATCH | Update user |
| `/api/users/{id}` | DELETE | Delete user (soft) |
| `/api/resources/classes` | GET | List classes |
| `/api/resources/classes` | POST | Create class |
| `/api/resources/classes/actions?action=add-students` | POST | Add students to class |
| `/api/resources/class-students/{id}` | DELETE | Remove student from class |
| `/api/resources/teachers` | GET | List teachers |
| `/api/resources/subjects` | GET | List subjects |

---

## Database Tables Used

- `users` - Student and teacher profiles
- `classes` - Class information
- `class_enrollments` - Student-class relationships
- `subjects` - Subject information
- `homework` - Homework assignments
- `attendance` - Daily attendance records
- `fee_structures` - Fee definitions
- `student_fees` - Student fee records
- `fee_payments` - Payment records

---

**End of School Admin Portal Flow Documentation**
