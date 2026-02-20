# Hierarchical Ecosystem - Implementation Progress

**Date:** February 20, 2026
**Status:** Foundation Complete (Backend APIs & Database)

---

## Completed Work

### ✅ Phase 1: Database Schema

**Tables Created:**
- `school_admin_applications` - Tracks school admin signup applications awaiting approval
- `teacher_applications` - Tracks teacher signup applications awaiting approval
- `departments` - Academic departments within schools

**Columns Added:**
- `schools` table:
  - `subscription_status` - pending_payment, active, suspended, cancelled
  - `subscription_tier` - basic, standard, premium, enterprise
  - `activated_at` - Timestamp when subscription was activated
  - `setup_complete` - Boolean flag for school setup completion
  - `setup_completed_at` - Timestamp when setup was completed

- `subjects` table:
  - `department_id` - Link to departments table
  - `subject_type` - core, elective, language
  - `applicable_grades` - JSON array of applicable grades

### ✅ Phase 2: School Admin Approval Workflow

**API Routes Created:**
- `/api/admin/school-admin-applications` - GET: List all applications
- `/api/admin/school-admin-applications/[id]/approve` - POST: Approve, PATCH: Reject
- `/api/setup/school-admin` - ENHANCED: Creates application record for approval

**Flow:**
1. School admin signs up with school code
2. Application created with status `pending_approval`
3. Platform admin reviews, verifies payment, and approves
4. School admin role assigned, onboarding marked complete

### ✅ Phase 4: Department Management

**API Route Created:**
- `/api/school-admin/departments` - GET: List departments, POST: Create department

**Features:**
- School-scoped department listing
- Subject counts per department
- Head of Department assignment
- Department code uniqueness validation

### ✅ Phase 6: Role Hierarchy & Permissions

**Files Created:**
- `src/lib/rbac/hierarchy.ts` - Role hierarchy definitions and helper functions
  - `ROLE_HIERARCHY` - Authority relationships
  - `ROLE_LEVEL` - Numeric authority levels
  - `hasAuthorityOver()` - Check if one role can manage another
  - `canAccessSchool()` - Check school access permissions
  - `canApproveApplications()` - Check approval permissions

**RBAC Enhancements:**
- Added 6 new permissions:
  - `schools.approve` - Approve school subscriptions
  - `school_admins.approve` - Approve school admin applications
  - `students.approve` - Approve student applications
  - `teachers.approve` - Approve teacher applications
  - `departments.manage` - Manage departments
  - `subscriptions.view` - View subscription status

- Updated role permissions:
  - School Admin: Added students.approve, teachers.approve, departments.manage
  - Ministry: Added subscriptions.view
  - Platform Admin: Has all permissions

**Auth Utils Enhancements:**
- Added to `src/lib/auth-utils.ts`:
  - `hasAuthorityOver()` - User authority checking
  - `canAccessSchool()` - School access checking
  - `canApproveApplications()` - Approval permission checking
  - `needsSetup()` - Check if user needs setup
  - `getSetupRedirectPath()` - Get setup redirect path

### ✅ Phase 8: School Activation Checks

**Enhanced:**
- `/api/auth/set-role` - Now checks:
  - School admin application approval status
  - School subscription status
  - School setup completion status
  - Platform admin bypass for immediate access

---

## Pending Work (UI Pages)

### Phase 1: Platform Admin UI
- `/admin/schools/create` - School creation form
- `/admin/schools/[id]/approve` - School approval page
- `/admin/schools/[id]/billing` - Billing management page

### Phase 2: School Admin Application Dashboard
- `/admin/school-admin-applications` - List pending applications with approve/reject buttons

### Phase 3: School Admin Setup Wizard
- `/school-admin/setup` - Multi-step school configuration wizard

### Phase 4: Department Management UI
- `/school-admin/departments` - Department list with CRUD
- `/school-admin/departments/create` - Department creation form

### Phase 5: Unified Approval Dashboard
- `/school-admin/applications` - Student/Teacher application approval

---

## Key Files Modified/Created

| File | Purpose |
|------|---------|
| `src/lib/db/schema.ts` | Added new tables and columns |
| `src/lib/rbac/hierarchy.ts` | Role hierarchy definitions (NEW) |
| `src/lib/auth-utils.ts` | Added hierarchy helpers |
| `scripts/seed-rbac.ts` | Added approval permissions |
| `scripts/migrate-hierarchy.ts` | Database migration script (NEW) |
| `src/app/api/school-admin/departments/route.ts` | Departments API (NEW) |
| `src/app/api/admin/school-admin-applications/route.ts` | Applications list (NEW) |
| `src/app/api/admin/school-admin-applications/[id]/approve/route.ts` | Approval API (NEW) |
| `src/app/api/setup/school-admin/route.ts` | Enhanced with application creation |
| `src/app/api/auth/set-role/route.ts` | Enhanced with activation checks |

---

## Database Migration

Run to update database schema:
```bash
npx tsx scripts/migrate-hierarchy.ts
```

Run to seed RBAC permissions:
```bash
npx tsx scripts/seed-rbac.ts
```

---

## Next Steps

1. Create Platform Admin UI pages for school management
2. Create School Admin Setup Wizard
3. Create Department Management UI
4. Create Unified Approval Dashboard for school admins
5. Test complete flow from platform admin to student approval
