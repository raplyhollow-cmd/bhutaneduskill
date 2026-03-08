# Platform Admin Portal - Atomic Level Flow Documentation

**Portal**: Platform Admin
**Base Path**: `/admin`
**Role**: `admin`

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /admin or /admin/dashboard                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Server Layout (layout.tsx)                                    │
│    - requireAuth(['admin'])                                      │
│    - Checks Clerk authentication                                  │
│    - Verifies user exists in database                            │
│    Conditions:                                                   │
│    - 404 (no DB record) → redirect to /setup/unified             │
│    - 401 (not authenticated) → redirect to /sign-in              │
│    - Success → pass user to client component                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client Layout (admin-layout-client.tsx)                       │
│    - useEffect triggers on mount                                 │
│    - fetch("/api/resources/users/actions?action=get-role")       │
│    - Verify userType === 'admin'                                 │
│    - If wrong portal → redirect to correct portal                │
│    - setIsAuthenticated(true) if successful                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Dashboard Renders                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Data Flow

### API Calls on Mount

```typescript
// File: src/app/admin/page.tsx
const response = await fetch("/api/admin/dashboard");
```

### Database Queries (Parallel)

```sql
-- Total schools
SELECT COUNT(*) as total FROM schools;

-- Total students
SELECT COUNT(*) as total FROM users WHERE type = 'student';

-- Total teachers
SELECT COUNT(*) as total FROM users
WHERE type IN ('teacher', 'school-admin');

-- Total assessments
SELECT COUNT(*) as total FROM assessments
WHERE completedAt IS NOT NULL;

-- Completion rate
SELECT
  (COUNT(DISTINCT assessmentResults.userId) * 100.0 /
   (SELECT COUNT(*) FROM users WHERE type = 'student'))
  as completionRate;

-- Active now (estimated)
SELECT COUNT(*) * 0.06 as activeNow
FROM users WHERE type = 'student';

-- Pending applications
SELECT COUNT(*) as pending
FROM schoolAdminApplications
WHERE status = 'pending_approval';
```

### Top Schools Query

```sql
SELECT
  schools.*,
  COUNT(users.id) as student_count,
  (
    SELECT COUNT(DISTINCT assessmentResults.userId)
    FROM assessmentResults
    JOIN users ON assessmentResults.userId = users.id
    WHERE users.schoolId = schools.id
  ) / NULLIF(
    (SELECT COUNT(*) FROM users WHERE schoolId = schools.id AND type = 'student'),
    0
  ) * 100 as completion_rate
FROM schools
LEFT JOIN users ON schools.id = users.schoolId AND users.type = 'student'
GROUP BY schools.id
ORDER BY schools.created_at DESC
LIMIT 5;
```

### Career Interests Aggregation

```sql
SELECT career_title, COUNT(*) as count
FROM career_matches
GROUP BY career_title
ORDER BY count DESC
LIMIT 100;
```

### Response Structure

```typescript
{
  stats: {
    totalSchools: number,
    totalStudents: number,
    totalTeachers: number,
    totalAssessments: number,
    completionRate: number,
    activeNow: number,
    pendingApplications: number
  },
  topSchools: Array<SchoolWithStats>,
  careerInterests: Array<{career_title: string, count: number}>
}
```

---

## Schools Management Flow

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /admin/schools                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Server Component (page.tsx)                                   │
│    - Server-side data fetch on render                            │
│    - db.select().from(schools).orderBy(desc(schools.createdAt))  │
│    - For each school: getSchoolStats(school.id)                  │
│    - Pass to client as props                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client Component Receives                                      │
│    - schools: Array<SchoolWithStats>                             │
│    - Initial data already loaded                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. GoogleDataTable Renders                                       │
│    - Schools with stats                                          │
│    - Inline editing capability                                   │
│    - Status toggle                                               │
│    - Delete confirmation                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Add School Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Add School" button                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. AddSchoolSlideIn Modal Opens                                  │
│    - Form fields:                                                │
│      - Name *                                                   │
│      - Code *                                                   │
│      - School Type * (Public/Private)                            │
│      - Level * (PP-12)                                          │
│      - Contact Email *                                          │
│      - Contact Phone                                            │
│      - Address                                                   │
│      - District                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User fills form and clicks "Create School"                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. POST /api/schools                                             │
│    Body: {                                                       │
│      name, code, schoolType, level,                              │
│      contactEmail, contactPhone, address                         │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API Handler                                                   │
│    - Validates input                                             │
│    - Checks if code already exists                               │
│    - Generates ID                                                │
│    - Inserts into database                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Database Insert:                                              │
│    INSERT INTO schools (                                         │
│      id, name, code, schoolType, level,                          │
│      contactEmail, contactPhone, address, district,              │
│      isActive, createdAt, updatedAt                              │
│    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW());     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Response:                                                     │
│    { data: { id, ...createdSchool } }                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI Update:                                                    │
│    - onSuccess callback called                                   │
│    - refreshData() → router.refresh()                            │
│    - Modal closes                                                │
│    - Success toast                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Inline Edit Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks on editable field (name, code, email, etc.)       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Inline Edit Activates                                          │
│    - Input field appears                                         │
│    - Focuses on field                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User edits value, presses Enter or clicks away                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Optimistic UI Update                                          │
│    - Local state updated immediately                             │
│    - Shows saving indicator                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. PATCH /api/schools/{id}                                       │
│    Body: { [field]: value }                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Database Update:                                              │
│    UPDATE schools                                                │
│    SET [field] = ?, updatedAt = NOW()                            │
│    WHERE id = ?                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. On Success:                                                   │
│    - Update confirmed, saving indicator removed                 │
│                                                                  │
│    On Error:                                                     │
│    - Rollback UI change                                          │
│    - Show error message                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Toggle Status Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks status button (active/inactive)                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Optimistic UI Update                                          │
│    - Status toggles immediately in UI                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. PATCH /api/schools/{schoolId}                                 │
│    Body: { isActive: newStatus }                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Database Update:                                              │
│    UPDATE schools                                                │
│    SET isActive = ?, updatedAt = NOW()                           │
│    WHERE id = ?                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. On Success: Status confirmed                                  │
│    On Error: Rollback to previous status                         │
└─────────────────────────────────────────────────────────────────┘
```

### Delete School Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks delete icon                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Confirmation Modal Opens                                      │
│    - Shows school name                                           │
│    - Displays school statistics:                                 │
│      - Total students                                            │
│      - Total teachers                                            │
│      - Total classes                                             │
│    - Warning about data loss                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User clicks "Delete School"                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. DELETE /api/schools/{schoolId}                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Delete (Soft):                                       │
│    UPDATE schools                                                │
│    SET isActive = false, deletedAt = NOW()                       │
│    WHERE id = ?                                                  │
│                                                                  │
│    OR Hard Delete (depending on config):                         │
│    DELETE FROM schools WHERE id = ?                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI Update:                                                    │
│    - School removed from UI state                                │
│    - Success toast                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Users Management Flow

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /admin/users                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Build Query Parameters                                         │
│    - page: 1 (default)                                           │
│    - limit: 20 (default)                                         │
│    - search: (optional)                                          │
│    - role: (optional filter)                                     │
│    - status: (optional filter)                                   │
│    - school: (optional filter)                                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GET /api/admin/users?{params}                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Database Query:                                               │
│    SELECT users.*, schools.name as school_name                   │
│    FROM users                                                    │
│    LEFT JOIN schools ON users.schoolId = schools.id              │
│    WHERE                                                          │
│      (search condition OR role filter OR status filter)          │
│    ORDER BY [sort column] [direction]                            │
│    LIMIT 20 OFFSET 0                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Response:                                                      │
│    {                                                              │
│      data: {                                                      │
│        data: [User objects],                                     │
│        pagination: {                                             │
│          total: 500,                                             │
│          page: 1,                                                │
│          limit: 20,                                              │
│          totalPages: 25                                          │
│        }                                                          │
│      }                                                            │
│    }                                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Add User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Add User" button                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. AddUserModal Opens                                            │
│    - Form fields:                                                │
│      - First Name *                                              │
│      - Last Name *                                               │
│      - Email *                                                   │
│      - Phone                                                     │
│      - Role * (student/teacher/parent/                           │
│                counselor/school-admin/admin)                     │
│      - School (if role is school-related) *                      │
│      - Grade/Section (for students)                              │
│      - Department (for teachers)                                 │
│      - Parent Contact (for students)                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User fills form and clicks "Create User"                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. POST /api/admin/users                                         │
│    Body: { formData }                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. API Handler - Two Step Process:                               │
│                                                                  │
│    Step 1: Create in Clerk.com                                   │
│    - const clerkUser = await clerkClient.users.createUser({     │
│        emailAddress: [email],                                   │
│        firstName, lastName,                                     │
│        skipPasswordRequirement: true                            │
│      })                                                         │
│                                                                  │
│    Step 2: Create in local database                             │
│    - const result = await db.insert(users).values({             │
│        clerkUserId: clerkUser.id,                               │
│        type: role,                                              │
│        schoolId, firstName, lastName, email, phone,             │
│        ...other fields                                          │
│      })                                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Audit Logging:                                                │
│    await logUserCreated(createdUser.id, data, userId, req);     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Response:                                                     │
│    { data: { id, ...createdUser } }                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. UI Update:                                                    │
│    - refreshData() → router.refresh()                            │
│    - Modal closes                                                │
│    - Success toast                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Edit User Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Edit User" on a row                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. EditUserModal Opens                                           │
│    - Pre-fills form with current user data                       │
│    - Shows editable fields based on role                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User modifies fields and clicks "Update User"                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. PATCH /api/admin/users/{id}                                   │
│    Body: { updatedFields }                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Database Update:                                              │
│    UPDATE users                                                   │
│    SET                                                            │
│      firstName = ?, lastName = ?, email = ?,                     │
│      phone = ?, [role-specific fields], updatedAt = NOW()        │
│    WHERE id = ?                                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. UI Update:                                                    │
│    - refreshData()                                               │
│    - Modal closes                                                │
│    - Success toast                                               │
└─────────────────────────────────────────────────────────────────┘
```

### Bulk Actions Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User selects users via checkboxes                              │
│    - selectedUsers Set populated with user IDs                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. User clicks bulk action button:                               │
│    - "Enable Selected"                                           │
│    - "Disable Selected"                                          │
│    - "Delete Selected"                                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. For each selected user:                                       │
│    - PATCH /api/admin/users/{userId}                             │
│    - Body: { isActive: newStatus } OR                            │
│    - DELETE /api/admin/users/{userId}                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Process all users in parallel or sequence                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. UI Update:                                                    │
│    - refreshData() after all operations complete                 │
│    - Clear selected users                                        │
│    - Success/failure summary toast                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analytics Flow

### Page Load Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /admin/analytics                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. fetchAnalytics() called on mount                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GET /api/admin/analytics-data                                 │
│    Query params: timeRange (default: '30d')                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Aggregated queries based on time range:                       │
│    - School engagement metrics                                   │
│    - User growth trends                                          │
│    - Career interests distribution                               │
│    - Assessment completion metrics                               │
│    - Academic performance                                        │
│    - Revenue metrics                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Response includes chart data and statistics                    │
└─────────────────────────────────────────────────────────────────┘
```

### Export Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Export Report"                                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Prompt for format: CSV or PDF                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. GET /api/admin/analytics-data/export?format={format}          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Generate file:                                                │
│    - CSV: Generate CSV content, return as text/csv              │
│    - PDF: Generate PDF, return as application/pdf               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Download file:                                                │
│    - Create blob URL                                             │
│    - Trigger download link                                       │
│    - Clean up blob URL                                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/dashboard` | GET | Dashboard statistics |
| `/api/schools` | GET | List schools |
| `/api/schools` | POST | Create school |
| `/api/schools/{id}` | PATCH | Update school |
| `/api/schools/{id}` | DELETE | Delete school |
| `/api/admin/users` | GET | List users |
| `/api/admin/users` | POST | Create user |
| `/api/admin/users/{id}` | PATCH | Update user |
| `/api/admin/users/{id}` | DELETE | Delete user |
| `/api/admin/analytics-data` | GET | Analytics data |
| `/api/admin/analytics-data/export` | GET | Export report |
| `/api/resources/users/actions?action=get-role` | POST | Get user role |

---

**End of Platform Admin Portal Flow Documentation**
