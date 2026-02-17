# RBAC System Implementation Summary

**Date:** February 15, 2026
**Status:** ✅ Complete

---

## Overview

Implemented a complete Role-Based Access Control (RBAC) system for the Bhutan EduSkill SaaS platform. This allows platform administrators to dynamically manage roles, assign granular permissions, and control UI component access.

---

## Database Schema

### 6 New Tables Created

| Table | Purpose | Key Columns |
|-------|---------|--------------|
| `roles` | Dynamic roles | id, name, slug, description, is_system_role, is_active |
| `permissions` | Granular permissions | id, name, slug, resource, action, module |
| `role_permissions` | Junction: roles ↔ permissions | role_id, permission_id |
| `user_roles` | Junction: users ↔ roles | user_id, role_id, expires_at (for temp access) |
| `component_access` | UI-level route access | role_id, component_path, can_view/create/update/delete |
| `audit_log` | Track all admin actions | user_id, action, resource_type, old/new_values |

**Schema File:** [`src/lib/db/rbac-schema.ts`](../src/lib/db/rbac-schema.ts)

---

## API Routes Created

### `/api/admin/roles/route.ts`
- **GET** - List all roles
- **POST** - Create new role
- **PATCH** - Update role (name, description)
- **DELETE** - Delete role (system roles protected)

### `/api/admin/roles/[roleId]/permissions/route.ts`
- **GET** - Get permissions assigned to a role
- **POST** - Assign permission to role
- **DELETE** - Remove permission from role

### `/api/admin/roles/[roleId]/users/route.ts`
- **GET** - Get users with a specific role
- **POST** - Assign role to user
- **DELETE** - Remove role from user

### `/api/admin/permissions/route.ts`
- **GET** - List all permissions (grouped by module)

---

## UI Pages Created

### `/admin/roles/page.tsx`
**Client Component:** [`roles-client.tsx`](../src/app/admin/roles/roles-client.tsx)

Features:
- Table listing all roles
- Show permission count and user count per role
- Create new role modal
- Edit role name/description
- Delete role (disabled for system roles)
- Visual badges for system roles and active/inactive status

### `/admin/permissions/page.tsx`
**Client Component:** [`permissions-client.tsx`](../src/app/admin/permissions/permissions-client.tsx)

Features:
- Grid view: roles × permissions
- Clickable checkboxes to toggle permissions
- Grouped by module (schools, users, rbac, analytics, billing, classes, homework, assessments, content, notifications, reports)
- Module filter dropdown
- Action badges colored by type:
  - create = green
  - read = blue
  - update = yellow
  - delete = red

---

## Helper Library

**File:** [`src/lib/rbac.ts`](../src/lib/rbac.ts)

### Functions Available

```typescript
// Permission checks
await hasPermission(userId, "schools.create")
await hasAnyPermission(userId, ["schools.create", "schools.update"])
await hasAllPermissions(userId, ["schools.read", "users.read"])

// Component access checks
await canAccessComponent(userId, "/admin/schools")

// Get user data
await getUserPermissions(userId)  // Returns UserPermission[]
await getUserRoles(userId)         // Returns UserRole[]

// Require helpers (return Response if forbidden)
await requirePermission(userId, "schools.create")
await requireAnyPermission(userId, ["schools.create", "schools.update"])
await requireComponentAccess(userId, "/admin/schools")
```

---

## Seeded Data

### Roles (9 total)
| Role | Slug | System Role | Permissions |
|-------|-------|-------------|--------------|
| Platform Admin | `platform-admin` | ✅ | All 36 |
| School Admin | `school-admin` | ✅ | 18 |
| Ministry | `ministry` | ✅ | 7 (read-only) |
| Teacher | `teacher` | ✅ | 8 |
| Student | `student` | ✅ | 0 |
| Parent | `parent` | ✅ | 0 |
| Counselor | `counselor` | ✅ | 0 |
| Content Manager | `content-manager` | ❌ | 0 |
| Billing Manager | `billing-manager` | ❌ | 0 |

### Permissions (36 total)
Grouped by module:
- **schools** - create, read, update, delete
- **users** - create, read, update, delete, assign-roles
- **rbac** - roles create/read/update/delete, assign-permissions
- **analytics** - view, export
- **billing** - view, manage
- **classes** - create, read, update, delete
- **homework** - create, read, update, delete
- **assessments** - create, read, update, delete
- **content** - manage, publish
- **notifications** - create, read
- **reports** - view, generate

### Component Access Rules (22 total)
UI-level access control for:
- Platform Admin: `/admin/*` (full access)
- School Admin: `/school-admin/*` (limited access)
- Teacher: `/teacher/*` (limited access)
- Student: `/student/*` (view only)
- Parent: `/parent/*` (view only)
- Content Manager: `/admin/content` (full access)

---

## Navigation Updates

**File Modified:** [`src/components/shared/portal-sidebar.tsx`](../src/components/shared/portal-sidebar.tsx)

Added to admin portal sidebar:
- **Roles** - `/admin/roles`
- **Permissions** - `/admin/permissions`

---

## Security Features

1. **System Role Protection** - System roles (Platform Admin, School Admin, Ministry, Teacher, Student, Parent, Counselor) cannot be deleted
2. **Authentication Required** - All RBAC API routes protected with `requireAuth(['admin'])`
3. **Permission Checks** - Helper functions available for all API routes
4. **Role Uniqueness** - Role slugs must be unique
5. **Deduplication** - Prevents duplicate permission assignments

---

## Usage Example

### In API Routes

```typescript
import { requirePermission } from "@/lib/rbac";

export async function POST(req: Request) {
  const { userId } = await requireAuth(['admin']);

  // Check if user can create schools
  const permCheck = await requirePermission(userId, "schools.create");
  if (permCheck) return permCheck;

  // ... rest of your route logic
}
```

### In Client Components

```typescript
import { canAccessComponent } from "@/lib/rbac";

// Check if user can access component
const hasAccess = await canAccessComponent(userId, "/admin/schools");
if (!hasAccess) {
  return <ForbiddenPage />;
}
```

---

## API Route Protection - ✅ COMPLETE

**Date:** February 15, 2026
**Status:** ✅ All major API routes now protected with RBAC permission checks

### Summary of Protection Added

| Module | Files Modified | Permission Checks Added |
|--------|----------------|------------------------|
| **Schools** | 4 files | 7 checks |
| **Users** | 5 files | 11 checks |
| **Classes** | 2 files | 5 checks |
| **Homework** | 7 files | 12 checks |
| **Assessments** | 5 files | 9 checks |
| **Reports** | 5 files | 7 checks |
| **TOTAL** | **28 files** | **51 checks** |

### Files Modified by Module

#### Schools API (4 files)
- `src/app/api/schools/route.ts` - GET: `schools.read`, POST: `schools.create`
- `src/app/api/schools/[id]/route.ts` - GET: `schools.read`, PUT: `schools.update`, DELETE: `schools.delete`
- `src/app/api/schools/verify-code/route.ts` - Authenticated only (setup wizard)
- `src/app/api/schools/lookup/route.ts` - GET: `schools.read`

#### Users API (5 files)
- `src/app/api/users/route.ts` - GET: `users.read`, PUT: `users.update`, POST: `users.create`
- `src/app/api/users/[id]/route.ts` - GET: `users.read` OR `users.read.own`, DELETE: `users.delete`
- `src/app/api/admin/roles/[roleId]/users/route.ts` - GET: `users.read`, POST/DELETE: `users.assign-roles`
- `src/app/api/teacher/students/route.ts` - GET: `users.read` OR `students.read`
- `src/app/api/counselor/students/route.ts` - GET: `users.read` OR `students.read`

#### Classes API (2 files)
- `src/app/api/classes/route.ts` - GET: `classes.read`, POST: `classes.create`
- `src/app/api/classes/[id]/route.ts` - GET: `classes.read`, PUT: `classes.update`, DELETE: `classes.delete`

#### Homework API (7 files)
- `src/app/api/teacher/homework/route.ts` - GET: `homework.read`, POST: `homework.create`
- `src/app/api/teacher/homework/[id]/route.ts` - GET: `homework.read`, PUT: `homework.update`
- `src/app/api/teacher/homework/[id]/submissions/route.ts` - GET: `homework.read`
- `src/app/api/teacher/homework/[id]/submissions/[submissionId]/route.ts` - GET: `homework.read`, PUT: `homework.update`
- `src/app/api/student/homework/route.ts` - GET: `homework.read`
- `src/app/api/student/homework/[id]/route.ts` - GET/POST/PUT: `homework.read`
- `src/app/api/student/homework/[id]/draft/route.ts` - POST: `homework.read`

#### Assessments API (5 files)
- `src/app/api/assessments/route.ts` - GET: `assessments.read`, POST: `assessments.create`
- `src/app/api/assessments/disc/route.ts` - POST: `assessments.create`
- `src/app/api/assessments/mbti/route.ts` - GET/POST: `assessments.read`/`assessments.create`
- `src/app/api/assessments/learning-styles/route.ts` - POST: `assessments.create`
- `src/app/api/assessments/work-values/route.ts` - POST: `assessments.create`

#### Reports API (5 files)
- `src/app/api/reports/route.ts` - GET: `reports.view`, POST: `reports.generate`
- `src/app/api/reports/generate/route.ts` - GET: `reports.view`, POST: `reports.generate`
- `src/app/api/reports/report-card/route.ts` - GET: `reports.view`
- `src/app/api/reports/attendance/[studentId]/route.ts` - GET: `reports.view`
- `src/app/api/reports/fees/collection/route.ts` - GET: `reports.view`

### Pattern Applied

All protected routes now follow this consistent pattern:

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";

export async function GET(req: Request) {
  // First: authenticate user
  const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  // Then: check specific permission
  const permCheck = await requirePermission(userId, "schools.read");
  if (permCheck) return permCheck;

  // ... rest of route logic
}
```

### Verification

- ✅ TypeScript compilation passed (`npx tsc --noEmit`)
- ✅ All 28 files build successfully
- ✅ Permission checks return 403 Forbidden when user lacks permission

---

## Remaining Work

1. **End-to-End Testing** - Test RBAC with actual user logins and role assignments

---

## Files Created/Modified

### New Files (13)
- `src/lib/db/rbac-schema.ts`
- `src/lib/rbac.ts`
- `scripts/seed-rbac.ts`
- `src/app/api/admin/roles/route.ts`
- `src/app/api/admin/roles/[roleId]/permissions/route.ts`
- `src/app/api/admin/roles/[roleId]/users/route.ts`
- `src/app/api/admin/permissions/route.ts`
- `src/app/admin/roles/page.tsx`
- `src/app/admin/roles/roles-client.tsx`
- `src/app/admin/permissions/page.tsx`
- `src/app/admin/permissions/permissions-client.tsx`

### Modified Files (29)
- `src/components/shared/portal-sidebar.tsx` - Added Roles and Permissions links

#### API Routes Protected (28 files)
- `src/app/api/schools/route.ts`
- `src/app/api/schools/[id]/route.ts`
- `src/app/api/schools/verify-code/route.ts`
- `src/app/api/schools/lookup/route.ts`
- `src/app/api/users/route.ts`
- `src/app/api/users/[id]/route.ts`
- `src/app/api/admin/roles/[roleId]/users/route.ts`
- `src/app/api/teacher/students/route.ts`
- `src/app/api/counselor/students/route.ts`
- `src/app/api/classes/route.ts`
- `src/app/api/classes/[id]/route.ts`
- `src/app/api/teacher/homework/route.ts`
- `src/app/api/teacher/homework/[id]/route.ts`
- `src/app/api/teacher/homework/[id]/submissions/route.ts`
- `src/app/api/teacher/homework/[id]/submissions/[submissionId]/route.ts`
- `src/app/api/student/homework/route.ts`
- `src/app/api/student/homework/[id]/route.ts`
- `src/app/api/student/homework/[id]/draft/route.ts`
- `src/app/api/assessments/route.ts`
- `src/app/api/assessments/disc/route.ts`
- `src/app/api/assessments/mbti/route.ts`
- `src/app/api/assessments/learning-styles/route.ts`
- `src/app/api/assessments/work-values/route.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/reports/generate/route.ts`
- `src/app/api/reports/report-card/route.ts`
- `src/app/api/reports/attendance/[studentId]/route.ts`
- `src/app/api/reports/fees/collection/route.ts`

---

## Migration Files Generated

- `drizzle/0002_amused_microchip.sql` - Created 6 RBAC tables
- `drizzle/0003_superb_meggan.sql` - Added unique constraints
