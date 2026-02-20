# Bhutan EduSkill - Hierarchical Ecosystem Implementation Plan

## Context

**Problem:** The current system has all 7 portals but lacks proper hierarchy. Users can sign in but nothing works because there's no organized flow. The system is "like a town, full of different types of people, unorganized, lawless."

**Vision:** Create a proper ecosystem with clear hierarchy and order:
1. **Platform Admin** (Super User) - Creates schools, generates school codes, approves school admins after payment
2. **School Admin** - Sets up their school (classes, sections, departments), approves students/teachers/faculty
3. **Faculty/Students** - Join with school code, get approved by school admin
4. **School as Container** - Each school is isolated with its own data ecosystem

---

## Current State Analysis

### What EXISTS (Working)
- ✅ Clerk authentication for all portals
- ✅ Database schema with 90+ tables (schools, users, classes, subjects, etc.)
- ✅ School code verification (basic)
- ✅ Student application system (pending → approve/reject)
- ✅ RBAC schema foundation (user_roles, permissions, role_permissions)
- ✅ Multi-tenant structure (tenantId fields exist)

### What's BROKEN/INCOMPLETE
- ❌ No payment integration for school subscriptions
- ❌ No school admin approval workflow (automatic approval)
- ❌ No platform admin approval UI
- ❌ Permission system exists but needs new permissions for approval workflows
- ❌ No role hierarchy implementation
- ❌ Tenant isolation not enforced in queries
- ❌ School admin can't properly set up departments/classes
- ❌ Many portal features are UI placeholders without backend

### What's MISSING
- ❌ Platform admin school creation UI
- ❌ School admin setup wizard
- ❌ Department management system
- ❌ Payment/billing system
- ❌ Subscription management
- ❌ Approval dashboards
- ❌ Proper role hierarchy

---

## Implementation Plan

### Phase 1: Platform Admin - School Creation & Management

**Goal:** Platform admin can create schools, generate codes, track subscriptions.

**Files to Create/Modify:**

1. **`src/app/admin/schools/create/page.tsx`** (NEW)
   - School creation form (name, code, type, address, capacity, etc.)
   - Auto-generate unique school code
   - Set initial status: `pending_payment`
   - Collect billing information

2. **`src/app/api/admin/schools/route.ts`** (ENHANCE)
   - Add payment status tracking
   - Generate unique school codes
   - Send invitation to school admin email
   - Create audit log entry

3. **`src/app/admin/schools/[id]/approve/page.tsx`** (NEW)
   - Approve school after payment verification
   - Change status from `pending_payment` → `active`
   - Send welcome email to school admin
   - Create initial tenant record

4. **`src/app/admin/schools/[id]/billing/page.tsx`** (NEW)
   - View payment status
   - Invoice generation
   - Subscription management (per seat/pricing tier)

**Database Changes:**
```sql
-- Schools table already has maxStudents field
-- Add new fields to schools table
ALTER TABLE schools ADD COLUMN subscription_status TEXT DEFAULT 'pending_payment';
ALTER TABLE schools ADD COLUMN subscription_tier TEXT;
ALTER TABLE schools ADD COLUMN activated_at TIMESTAMP;
ALTER TABLE schools ADD COLUMN setup_complete BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN setup_completed_at TIMESTAMP;
```

---

### Phase 2: School Admin - Signup & Approval

**Goal:** School admin signs up with school code, platform admin approves after payment.

**Files to Create/Modify:**

1. **`src/app/setup/school-admin/page.tsx`** (ENHANCE)
   - Multi-step wizard:
     - Step 1: Enter school code (verify it exists)
     - Step 2: Personal details
     - Step 3: Create password with Clerk
     - Step 4: Awaiting approval message

2. **`src/app/api/setup/school-admin/route.ts`** (ENHANCE)
   - Create user with `type: "school-admin"`
   - Create `schoolAdminApplications` record with status: `pending_approval`
   - Send notification to platform admin
   - Set `onboardingStatus: "pending_approval"`

3. **`src/app/admin/school-admin-applications/page.tsx`** (NEW)
   - List all pending school admin applications
   - View school code, payment status
   - Approve/Reject buttons
   - Payment verification checkbox

4. **`src/app/api/admin/school-admin-applications/[id]/approve/route.ts`** (NEW)
   - Verify payment received
   - Link school admin to school
   - Send approval notification
   - Set `onboardingComplete: true`

**Database Changes:**
```sql
-- New table for school admin applications
CREATE TABLE school_admin_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  school_id TEXT REFERENCES schools(id),
  status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, rejected
  payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
  payment_amount NUMERIC,
  payment_date TIMESTAMP,
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT
);
```

---

### Phase 3: School Admin - School Setup Wizard

**Goal:** After approval, school admin sets up their complete school ecosystem.

**Files to Create/Modify:**

1. **`src/app/school-admin/setup/page.tsx`** (NEW)
   - Multi-step wizard shown to new school admins:
     - Step 1: School Profile (logo, tagline, facilities)
     - Step 2: Academic Year Setup (current year, terms, holidays)
     - Step 3: Department Creation
     - Step 4: Subject Management
     - Step 5: Class Structure
     - Step 6: Complete

2. **`src/app/api/school-admin/setup/complete/route.ts`** (NEW)
   - Mark setup as complete
   - Enable school for student/teacher join
   - Send notification to platform admin

**Database Changes:**
```sql
-- New table for departments
CREATE TABLE departments (
  id TEXT PRIMARY KEY,
  school_id TEXT REFERENCES schools(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  head_of_department TEXT REFERENCES users(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Note: schools table subscription fields added in Phase 1
```

---

### Phase 4: Department & Subject Management

**Goal:** School admin can organize subjects under departments.

**Files to Create/Modify:**

1. **`src/app/school-admin/departments/page.tsx`** (NEW)
   - List departments with subject counts
   - Create/Edit/Delete departments
   - Assign department head
   - View department teachers

2. **`src/app/school-admin/departments/create/page.tsx`** (NEW)
   - Department form (name, code, HOD selection)

3. **`src/app/api/school-admin/departments/route.ts`** (NEW)
   - GET: List departments (school-scoped)
   - POST: Create department
   - Validate department code uniqueness

4. **`src/app/school-admin/subjects/page.tsx`** (ENHANCE)
   - Link subjects to departments
   - Mark as core/elective/language
   - Assign grade levels
   - Bulk create subjects

5. **`src/app/api/school-admin/subjects/route.ts`** (ENHANCE)
   - Add departmentId to subject
   - Add subjectType (core/elective/language)
   - Add applicableGrades array

**Database Changes:**
```sql
-- Add to subjects table (check if exists first)
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS department_id TEXT REFERENCES departments(id);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS subject_type TEXT DEFAULT 'core'; -- core, elective, language
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS applicable_grades TEXT; -- JSON array of grades
```

---

### Phase 5: Student/Teacher/Faculty Signup & Approval

**Goal:** Students, teachers, and other staff join with school code, await approval.

**Files to Create/Modify:**

1. **Enhanced Setup Wizards** (MODIFY ALL):
   - `src/app/setup/student/page.tsx`
   - `src/app/setup/teacher/page.tsx`
   - `src/app/setup/counselor/page.tsx`
   - All: Verify school code, show "pending approval" state

2. **`src/app/school-admin/applications/page.tsx`** (NEW)
   - Unified approval dashboard
   - Tabs: Students | Teachers | Counselors | Other Staff
   - Filter by status (pending, approved, rejected)
   - Batch approve option

3. **`src/app/api/school-admin/applications/[id]/approve/route.ts`** (NEW)
   - Approve student application:
     - Create enrollment record
     - Assign to class (if specified)
     - Send welcome notification
   - Approve teacher application:
     - Set active status
     - Assign subjects (if specified)
     - Send notification

4. **`src/app/api/school-admin/applications/[id]/reject/route.ts`** (NEW)
   - Reject with reason
   - Send notification
   - Update application status

**Database Changes:**
```sql
-- student_applications table already has reviewedBy and reviewedAt fields

-- New table for teacher applications
CREATE TABLE teacher_applications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  school_id TEXT REFERENCES schools(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  qualifications TEXT, -- JSON
  experience INTEGER,
  subjects TEXT, -- JSON array of subject IDs
  desired_classes TEXT, -- JSON array of class IDs
  applied_at TIMESTAMP DEFAULT NOW(),
  reviewed_by TEXT REFERENCES users(id),
  reviewed_at TIMESTAMP,
  rejection_reason TEXT
);
```

---

### Phase 6: Role Hierarchy & Permissions

**Goal:** Implement proper RBAC with role hierarchy.

**Files to Create/Modify:**

1. **`src/lib/rbac/hierarchy.ts`** (NEW)
   ```typescript
   export const ROLE_HIERARCHY = {
     'admin': ['school-admin', 'ministry'],
     'school-admin': ['teacher', 'counselor'],
     'teacher': ['student'],
     'counselor': ['student'],
     'parent': ['student'] // Can view their children
   };
   ```

2. **`src/lib/rbac/permissions.ts`** (NEW)
   - Define all permissions
   - Role-permission mappings
   - Helper functions

3. **`scripts/seed-rbac.ts`** (EXISTS - ENHANCE)
   - Already creates roles and permissions (37 permissions exist)
   - Add new permissions for approval workflows:
     - `schools.approve` - Approve school applications
     - `school_admins.approve` - Approve school admin applications
     - `students.approve` - Approve student applications
     - `teachers.approve` - Approve teacher applications
   - Update role-permission mappings
   - Run with: `npx tsx scripts/seed-rbac.ts`

4. **`src/lib/auth-utils.ts`** (ENHANCE)
   - Add `checkRoleHierarchy()` helper
   - Add `canAccessSchool()` helper

5. **`src/lib/rbac.ts`** (EXISTS - ENHANCE)
   - Already has `hasPermission()`, `requirePermission()`, etc.
   - Add new permissions for approval workflows

6. **`src/middleware.ts`** (ENHANCE)
   - Add tenant isolation middleware
   - Filter queries by tenantId automatically

**Permissions to Define:**
```typescript
const PERMISSIONS = {
  // Platform Admin
  'schools.create': ['admin'],
  'schools.approve': ['admin'],
  'schools.view.all': ['admin', 'ministry'],

  // School Admin
  'schools.view.own': ['school-admin'],
  'departments.manage': ['school-admin'],
  'classes.manage': ['school-admin'],
  'students.approve': ['school-admin'],
  'teachers.approve': ['school-admin'],

  // Teacher
  'students.view.class': ['teacher'],
  'homework.create': ['teacher'],
  'attendance.mark': ['teacher'],
  'grades.assign': ['teacher'],

  // Student
  'homework.view': ['student', 'parent'],
  'attendance.view': ['student', 'parent'],
  'grades.view.own': ['student', 'parent'],

  // Parent
  'children.view': ['parent'],
  'fees.pay': ['parent'],
};
```

---

### Phase 7: Tenant Isolation

**Goal:** Ensure each school's data is properly isolated.

**Files to Modify:**

1. **All API routes** (BATCH UPDATE)
   - Add `tenantId` filter to all queries
   - Use `verifySchoolAccess()` helper
   - Example pattern:

   ```typescript
   // BEFORE
   const students = await db.select().from(users).where(eq(users.type, 'student'));

   // AFTER
   const authResult = await requireAuth(['school-admin', 'teacher']);
   const { user, userId } = authResult;

   const students = await db.select().from(users)
     .where(
       and(
         eq(users.type, 'student'),
         eq(users.schoolId, user.schoolId),
         eq(users.tenantId, user.tenantId)
       )
     );
   ```

2. **`src/lib/db/tenant-scope.ts`** (NEW)
   - Helper function to scope queries by tenant
   - Automatic tenant filtering

---

### Phase 8: School Container Activation

**Goal:** Only allow a school to function when fully set up and approved.

**Files to Modify:**

1. **`src/app/api/auth/set-role/route.ts`** (ENHANCE)
   - Check if school is active (`subscriptionStatus: 'active'`)
   - Check if school setup is complete
   - Return appropriate error if school not ready

2. **Portal Layouts** (ALL 7)
   - Add check for school status
   - Show "School not yet activated" message if pending

---

## Critical Files to Modify

| File | Phase | Changes |
|------|-------|---------|
| `src/lib/db/schema.ts` | 1, 2, 3, 5 | Add subscriptionStatus, departments table, etc. |
| `src/app/admin/schools/page.tsx` | 1 | Add school creation link, payment status |
| `src/app/setup/school-admin/page.tsx` | 2 | Multi-step wizard with approval state |
| `src/app/school-admin/departments/page.tsx` | 4 | NEW - Department CRUD |
| `src/app/school-admin/applications/page.tsx` | 5 | NEW - Unified approval dashboard |
| `src/lib/rbac/hierarchy.ts` | 6 | NEW - Role hierarchy definitions |
| `src/lib/rbac.ts` | 6 | ENHANCE - Add approval permissions |
| `src/lib/auth-utils.ts` | 6 | Add permission helpers |
| `src/middleware.ts` | 7 | Add tenant isolation |
| All API routes | 7 | Add tenantId filtering |

---

## Verification Checklist

After implementation, verify:

1. **Platform Admin Flow:**
   - [ ] Can create school with auto-generated code
   - [ ] Can view school admin applications
   - [ ] Can approve school admin after payment verification
   - [ ] Can see subscription status for each school

2. **School Admin Flow:**
   - [ ] Can sign up with school code
   - [ ] Sees "pending approval" until platform admin approves
   - [ ] After approval, can run setup wizard
   - [ ] Can create departments and subjects
   - [ ] Can approve student/teacher applications

3. **Student/Teacher Flow:**
   - [ ] Can sign up with school code
   - [ ] Sees "pending approval" until school admin approves
   - [ ] After approval, can access their portal
   - [ ] Only sees data from their school

4. **Data Isolation:**
   - [ ] School A users cannot see School B data
   - [ ] Teachers only see their assigned classes
   - [ ] Parents only see their own children

5. **Role Hierarchy:**
   - [ ] Platform admin > School admin
   - [ ] School admin > Teachers/Students
   - [ ] Proper permission checks on all APIs

---

## Order of Implementation

1. **Phase 1** - Platform admin school creation (foundation)
2. **Phase 2** - School admin signup & approval workflow
3. **Phase 3** - School admin setup wizard
4. **Phase 4** - Department & subject management
5. **Phase 5** - Student/teacher signup & approval
6. **Phase 6** - Role hierarchy & permissions
7. **Phase 7** - Tenant isolation (can be done in parallel)
8. **Phase 8** - School container activation

---

## User Decisions

- **Payment:** Manual verification (platform admin checkbox)
- **Existing Data:** Migrate to new flow (create migration script)
- **Implementation:** Full implementation (all 8 phases)

---

## Phase 0: Data Migration (Before Phase 1)

**Goal:** Migrate existing schools and users to work with new hierarchy.

**Files to Create:**

1. **`src/scripts/migrate-to-hierarchy.ts`** (NEW)
   - Set all existing schools as `subscriptionStatus: 'active'`
   - Set all existing schools as `setupComplete: true`
   - Create tenant records for existing schools
   - Link existing users to their tenant
   - Mark existing users as `onboardingComplete: true`
   - Create missing department records (group by subject)
   - Set school codes if missing (generate unique codes)

2. **`src/scripts/seed-departments.ts`** (NEW)
   - Create default departments for each existing school:
     - Mathematics
     - Science (Physics, Chemistry, Biology)
     - Languages (Dzongkha, English)
     - Social Studies
     - IT/Computer Science
     - Arts & Music
     - Physical Education

**Migration Steps:**
```bash
# Run migration
npm run migrate:hierarchy

# Verify migration
npm run verify:migration
```

---

## Notes

- **Payment:** Manual verification via checkbox (Stripe can be added later)
- **AI Features:** Already integrated, will work within school container automatically
- **Existing Data:** Will be migrated using scripts in Phase 0
- **Testing:** Create test schools with different codes to verify isolation