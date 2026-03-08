# Unified API Migration - Root Cause Analysis Report

**Date**: March 6, 2026
**Commit Reference**: `c9b693f` (last working) → `1149ab9` (breaking)
**Analyst**: Claude Agent
**Scope**: All 7 portals, unified API system, component integrations

---

## Executive Summary

The unified API migration introduced **multiple breaking changes** that were not properly tested. The system now has a mix of old and new API routes, causing:

1. **Auth/redirect loops** - Users with completed setup are redirected to `/setup/unified`
2. **API calls returning empty/incorrect responses** - Wrong URLs being called
3. **Frontend components not properly updated** - Response format mismatches

**Total Issues Found**: 50+
- Breaking Issues: 7
- Important Issues: 8
- Minor Issues: 35+

---

## Part 1: Critical Issues (Must Fix Immediately)

### 1. Auth/Redirect Loop - ALL 7 Portals Affected

**Root Cause**: `!user.onboardingComplete` evaluates to `true` when `onboardingComplete` is `null`

**Affected Files**:

| Portal | File | Line | Current Code | Should Be |
|--------|------|------|--------------|-----------|
| Teacher | `teacher/layout.tsx` | 57-59 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| Student | `student/layout.tsx` | 57-59 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| School Admin | `school-admin/layout.tsx` | 44-46 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| Parent | `parent/layout.tsx` | 42 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| Counselor | `counselor/layout.tsx` | 40 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| Ministry | `ministry/layout.tsx` | 40 | `!user.onboardingComplete` | `user.onboardingComplete !== true` |
| Admin | `admin/layout.tsx` | 35-36 | **No needsSetup check** | Add check |

**Other Affected Files**:
- `src/lib/auth-utils.ts` line 908-909
- `src/middleware.ts` lines 226, 304-306
- `src/hooks/use-portal-auth.ts` line 54

### 2. Wrong API Endpoints - 3 Files

| File | Line | Wrong URL | Should Be |
|------|------|-----------|-----------|
| `counselor-layout-client.tsx` | 59 | `/api/auth/set-role` | `/api/resources/users/actions?action=get-role` |
| `use-portal-auth.ts` | 45 | `/api/auth/set-role` | `/api/resources/users/actions?action=get-role` |
| `setup/[roleId]/route.ts` | 22 | `/api/auth/set-role` | `/api/resources/users/actions?action=get-role` |

### 3. Notification System - Missing Resource Mapping

**File**: `src/app/api/resources/[resource]/route.ts`

**Issue**: "notifications" not in CRUD resource mapping

**Impact**: Direct CRUD operations on notifications return 404

**Workaround**: Action routes work because they have separate mapping

### 4. Response Format Inconsistencies

**Problem**: APIs return different formats:

| API Returns | Frontend Expects | Status |
|-------------|------------------|--------|
| `{ data: { data: [], pagination: {} } }` | `{ data: [] }` | MISMATCH |
| `{ success: true, userType: ... }` | `{ success: true, data: { userType: ... } }` | MISMATCH |

**Affected Components**:
- FeatureListPage
- Counselor Reports
- UserContext
- Use Portal Auth

---

## Part 2: API Endpoint Migration Status

### Unified API (Working)

**Pattern**: `/api/resources/[resource]/route.ts`

**Resources Migrated**:
- users
- students
- teachers
- classes
- subjects
- schools
- assessments
- attendance
- homework
- transport-routes
- transport-allocations
- And 30+ more

**Action Handlers**:
- `/api/resources/[resource]/actions?action=[action-name]`
- Examples: `mark-read`, `unread-count`, `set-role`, `get-role`

### Legacy API Routes (Still Exist - 100+ endpoints)

**Counselor Portal** (13 endpoints):
```
/api/counselor/students
/api/counselor/assessments/results
/api/counselor/dashboard
/api/counselor/career-plans
/api/counselor-notes
/api/counselor/interventions
/api/counselor/sessions
/api/counselor/resources
```

**Teacher Portal** (13 endpoints):
```
/api/teacher/timetable
/api/teacher/students
/api/teacher/profile
/api/teacher/schedule
/api/teacher/reports
/api/teacher/payslips
/api/teacher/dashboard
/api/teacher/my-assignments
/api/teacher/messages
/api/teacher/live-sessions
/api/teacher/modules
/api/teacher/leave
```

**School Admin Portal** (5+ endpoints):
```
/api/school-admin/teachers
/api/school-admin/classes
/api/tuition/tutors
/api/tuition/enrollments
/api/transport/routes
```

### Status Summary

| Status | Count | Notes |
|--------|-------|-------|
| Fully Migrated | 42 resources | Using unified API |
| Partially Migrated | ~30 endpoints | Some actions, some CRUD |
| Not Migrated | ~100 endpoints | Still use legacy pattern |

---

## Part 3: Portal-by-Portal Atomic Flow Analysis

### School Admin Portal

**Authentication Flow**:
```
User navigates to /school-admin
  ↓
layout.tsx: requireAuth(['school-admin'])
  ↓
If no DB record → redirect to /setup/unified
  ↓
school-admin-layout-client.tsx: useEffect
  ↓
fetch("/api/user/profile")
  ↓
SetupGuard: fetch("/api/school-admin/settings/status")
  ↓
If setupComplete === false → InitialSetupWizard
```

**Dashboard Data Flow**:
```
fetchDashboardStats()
  ↓
Queries: totalStudents, totalTeachers, totalClasses, pendingAttendance, pendingFees
  ↓
fetchClasses({ limit: 5 })
  ↓
UI transforms → stat cards, pending items, active classes
```

**Students CRUD Flow**:
```
LOAD: GET /api/resources/students
  → DB: SELECT * FROM users WHERE type='student' AND schoolId=?
  → Returns { data: { data: [...], pagination: {...} } }

CREATE: POST /api/resources/students
  → { name, grade, section, schoolId }
  → Returns { data: { id, ... } }

EDIT: PATCH /api/users/{id}
  → Optimistic UI update
  → On error: rollback

DELETE: DELETE /api/users/{id}
  → DB: UPDATE users SET isActive=false
```

### Platform Admin Portal

**Authentication Flow**:
```
/admin → layout.tsx: requireAuth(['admin'])
  ↓
admin-layout-client.tsx: fetch("/api/resources/users/actions?action=get-role")
  ↓
Verify userType === 'admin'
  ↓
If wrong portal → redirect to correct portal
```

**Dashboard Queries** (Parallel):
```sql
-- Total schools
COUNT(*) FROM schools

-- Total students
COUNT(*) FROM users WHERE type='student'

-- Total teachers
COUNT(*) FROM users WHERE type IN ('teacher','school-admin')

-- Completion rate
(students_with_assessments / totalStudents) * 100

-- Active now (estimated)
totalStudents * 0.06
```

**Schools Management**:
```
CREATE: POST /api/schools
  → { name, code, schoolType, level, contactEmail, ... }

EDIT INLINE: PATCH /api/schools/{id}
  → { [field]: value }
  → Optimistic update, rollback on error

TOGGLE STATUS: PATCH /api/schools/{schoolId}
  → { isActive: newStatus }

DELETE: DELETE /api/schools/{schoolId}
  → Remove from UI state
```

### Teacher Portal

**Dashboard Queries**:
```sql
-- Teacher's classes
SELECT * FROM classes WHERE classTeacherId = ?

-- Student enrollments
SELECT * FROM enrollments WHERE classId IN (?)

-- Attendance (last 30 days)
SELECT * FROM attendance WHERE classId IN (?) AND date >= ?

-- Pending homework
SELECT * FROM homeworkSubmissions WHERE status = 'submitted'

-- Behavior logs
SELECT * FROM teacher_behavior_logs WHERE classId IN (?)
```

**Real-time Events**:
- `NOTIFICATION_SENT`
- `HOMEWORK_SUBMITTED`
- `ANNOUNCEMENT_CREATED`
- Channel: `private-class-{classId}`

### Student Portal

**Dashboard Queries** (Parallel):
```
1. users: Student profile
2. classes: Enrolled classes
3. homework: Pending/graded
4. assessments: Completed count
5. attendance: Rate & days
6. achievements: XP-based
7. deadlines: Upcoming
8. careerMatches: From assessments
9. studentFees: Payment status
```

**Assessment Flow**:
```
CATALOG → 5 parallel API calls
  → /api/assessments/mbti
  → /api/assessments/riasec
  → /api/assessments/disc
  → /api/assessments/work-values
  → /api/assessments/learning-styles

TAKING ASSESSMENT (RIASEC):
  → 18 questions
  → handleAnswer(value) → update state
  → Auto-advance after 300ms
  → calculateAndSaveResults()
    → Category scores (R,I,A,S,E,C)
    → Normalize to 0-100
    → Generate Holland Code
    → POST /api/assessments/riasec
```

### Parent Portal

**Authentication Issue**:
```
parent-layout-client.tsx: fetch("/api/auth/set-role") [WRONG]
```

**Data Pattern** (All parent APIs):
```
1. Get parent's userId
2. Get parent-student relationships
3. Filter data by parent's children
4. Return filtered results
```

### Counselor Portal

**Authentication Issue**:
```
counselor-layout-client.tsx: fetch("/api/auth/set-role") [WRONG]
```

**Career Review Workflow**:
```
AI generates suggestion
  ↓
Counselor reviews (approve/conditions/not recommended)
  ↓
Student responds (accept/reject)
  ↓
Parent approval
```

### Ministry Portal

**Authentication Issue**:
```
ministry-layout-client.tsx: fetch("/api/auth/set-role") [WRONG]
```

**Missing Endpoints**:
- `/api/ministry/briefing`
- `/api/ministry/schools`
- `/api/ministry/analytics`
- `/api/ministry/gnh`

---

## Part 4: Component Integration Analysis

### GoogleDataTable Component

**Props Interface**:
```typescript
{
  data: T[];                          // Raw data array
  columns: GoogleColumn<T>[];         // Column definitions
  keyField: string;                   // Unique identifier
  isLoading?: boolean;                // Loading state
  actions?: GoogleAction<T>[];        // Row actions
  onUpdate?: (id, field, value) => Promise<void>;
  onDelete?: (row: T) => void;
  expandable?: boolean | "single" | "multiple";
}
```

**Data Flow**:
1. Parent component fetches data (GoogleDataTable does NOT fetch)
2. Passes data as `data` prop
3. Internal useMemo handles: sorting, filtering, pagination
4. Renders rows with actions menu

### SmartField Component

**Reference Field API Flow**:
```
1. User types in search input
2. Debounce 300ms
3. If searchQuery.length < 2 → clear options
4. Fetch: {endpoint}/?search={query}&limit=20
5. Parse response: result.data or result.data.data
6. Map to {value: id, label: displayField}
```

---

## Part 5: Unified API System Architecture

### Main Route Handler (`/api/resources/[resource]/route.ts`)

**Resource Mapping**:
```typescript
mapping: Record<string, FeatureName> = {
  users: "users",
  students: "students",
  teachers: "teachers",
  classes: "classes",
  subjects: "subjects",
  schools: "schools",
  // Missing: notifications (BUG!)
};
```

**GET Request Flow**:
```
1. Extract {resource, id} from params
2. Map to feature: getFeatureFromResource(resource)
3. Check public endpoint param
4. Validate permissions: feature.config.permissions.read
5. If id: feature.api.get(id[0], auth)
6. If no id: feature.api.list(params, auth)
7. Returns: { data: { data: [...], pagination: {...} } }
```

### Actions Route Handler

**Action Name Extraction**:
```typescript
const actionName = url.searchParams.get("action");
// Supports kebab-case: mark-read
// Converts to camelCase: markRead
```

**Action Mapping Flow**:
```
1. Resource to feature mapping
2. Case conversion: kebab-case → camelCase
3. Get action handler from feature.actions
4. Check allowedRoles
5. Execute action.handler(context)
```

### Response Format Standardization

**Success Response**:
```typescript
{ data, status: 200 }
```

**Error Response**:
```typescript
{ error: message, status }
```

**Pagination Format**:
```typescript
{
  data: [...],
  pagination: {
    total: number,
    page: number,
    limit: number,
    totalPages: number
  }
}
```

---

## Part 6: Database Schema Reference

### USERS Table (Core)
```typescript
id: text (primary)
clerkUserId: text (unique)
type: text (student|teacher|parent|school_admin|admin|counselor|ministry)
schoolId: text (foreign key)
firstName, lastName: text
email, phone: text
grade: integer
section: json
isActive: boolean (soft delete)
onboardingComplete: boolean  // ← ROOT CAUSE OF REDIRECT LOOP
onboardingStatus: text
createdAt, updatedAt: timestamp
```

### Key Relationships
```
users.schoolId → schools.id
classes.classTeacherId → users.id
class_enrollments.classId → classes.id
class_enrollments.studentId → users.id
homework.classId → classes.id
homeworkSubmissions.homeworkId → homework.id
homeworkSubmissions.studentId → users.id
```

---

## Part 7: Feature File Issues

### File Extension Inconsistencies (5 files)
- attendance.feature.tsx → should be .feature.ts
- behavior-records.feature.tsx → should be .feature.ts
- interventions.feature.tsx → should be .feature.ts
- results.feature.tsx → should be .feature.ts
- student-skills.feature.tsx → should be .feature.ts

### Stub Features (4 incomplete)
1. AppointmentFeature
2. CareerMatcheFeature
3. GnhIndicatorFeature
4. GradeFeature

---

## Part 8: Recommended Fix Approach

### Phase 1: Fix Breaking Issues (Immediate)

1. **All 7 Layout Files**: Change `!user.onboardingComplete` to `user.onboardingComplete !== true`
2. **Middleware**: Add proper `onboardingComplete` checks
3. **3 Files with Wrong API**: Update `/api/auth/set-role` to `/api/resources/users/actions?action=get-role`
4. **Notification Hook**: Either revert to legacy routes or fix unified routes
5. **Response Formats**: Choose ONE format and apply consistently

### Phase 2: Fix Important Issues (Soon)

1. **100+ Legacy API Endpoints**: Migrate to unified OR document as legacy
2. **5 Feature File Extensions**: Rename .tsx to .ts
3. **4 Stub Features**: Implement or mark as TODO
4. **Resource Mapping**: Add "notifications" to CRUD mapping

### Phase 3: Fix Minor Issues (Later)

1. **Field Name Consistency**: `deliveryId` vs `id`
2. **Code Comments**: Update outdated comments
3. **Import Cleanup**: Remove unused imports

---

## Part 9: Testing Checklist

### Authentication Flow
- [ ] Sign in as each role type (7 portals)
- [ ] Verify no redirect loops to /setup/unified
- [ ] Verify correct portal routing based on role
- [ ] Test with onboardingComplete = false (should go to setup)
- [ ] Test with onboardingComplete = true (should go to portal)

### Portal Functionality
- [ ] School Admin: Dashboard, Students, Teachers, Classes CRUD
- [ ] Platform Admin: Dashboard, Schools, Users management
- [ ] Teacher: Dashboard, Classes, Students, Homework
- [ ] Student: Dashboard, Homework, Assessments, Careers
- [ ] Parent: Dashboard, Children, Attendance, Fees
- [ ] Counselor: Dashboard, Students, Sessions, Career Review
- [ ] Ministry: Dashboard, Schools, Analytics

### Notification System
- [ ] Unread count displays correctly
- [ ] Notifications load
- [ ] Mark as read works
- [ ] Real-time updates work

### Response Formats
- [ ] All APIs return consistent format
- [ ] Frontend handles responses correctly
- [ ] Pagination works

---

## Summary

**Root Cause**: Unified API migration was incomplete
- Frontend NOT properly updated
- Middleware NOT updated
- Response formats inconsistent
- No integration testing

**Recommended Approach**:
1. Fix breaking issues first (auth/redirect)
2. Migrate remaining legacy APIs systematically
3. Standardize response formats
4. Add integration tests

**Files Analyzed**: 200+
**Portals Analyzed**: 7
**Components Analyzed**: GoogleDataTable, SmartField, QuickActionMenu, Unified components
**API Routes Analyzed**: Unified CRUD, Actions, Public endpoints
**Feature Files Analyzed**: 42 feature definitions

---

**End of Report**
