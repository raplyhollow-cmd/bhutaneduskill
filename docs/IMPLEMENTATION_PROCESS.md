# Standard Implementation Process

## Overview

This document outlines the proven step-by-step process for implementing the teacher approval and class assignment flow.

---

## Phase 1: API Layer First (Backend)

**Rule:** Always build the API before the UI. This allows you to test functionality independently.

### 1.1 Teacher Approval API

Create `/api/school-admin/teachers/pending/route.ts`:

```typescript
// GET /api/school-admin/teachers/pending
// Returns list of teacher applications awaiting approval

// POST /api/school-admin/teachers/[teacherId]/approve
// Approves teacher, links to school, enables login

// POST /api/school-admin/teachers/[teacherId]/reject
// Rejects teacher with reason
```

### 1.2 Teacher Setup API Fix

Update `/api/setup/teacher/route.ts`:

```typescript
// When teacher completes setup:
// 1. Create user entry (if not exists)
// 2. Create teacher_applications entry with status="pending"
// 3. Return success
```

---

## Phase 2: Database Verification

**Before building UI, verify the data flow:**

```bash
# 1. Check teacher_applications table structure
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT * FROM teacher_applications LIMIT 5\`.then(console.log).catch(console.error);
"

# 2. Test the approval flow manually
# - Insert a teacher application
# - Call approve endpoint
# - Verify status changed
# - Verify user.schoolId is set
```

---

## Phase 3: Server Actions (For Form Submissions)

Create reusable server actions in `/app/school-admin/_actions.ts`:

```typescript
/**
 * TEACHER APPROVAL ACTIONS
 */

export async function fetchPendingTeachers() {
  // Get current school ID
  // Fetch teacher applications with status="pending"
  // Join with users to get teacher details
  // Return list
}

export async function approveTeacher(teacherId: string) {
  // Update teacher_applications.status = "approved"
  // Update users.schoolId = current school
  // Update users.onboardingComplete = true
  // Return success
}

export async function rejectTeacher(teacherId: string, reason: string) {
  // Update teacher_applications.status = "rejected"
  // Update rejection_reason
  // Return success
}
```

---

## Phase 4: UI Layer (Client Component)

### 4.1 Pending Teachers Page

Create `/app/school-admin/teachers/pending/page.tsx`:

```typescript
// Server Component (fetches data)
export default async function PendingTeachersPage() {
  const teachers = await fetchPendingTeachers();
  return <PendingTeachersClient teachers={teachers} />;
}
```

### 4.2 Client Component (Interactive)

Create `/app/school-admin/teachers/pending/pending-teachers-client.tsx`:

```typescript
"use client";

export function PendingTeachersClient({ teachers }) {
  // Display teachers in a table/card layout
  // Approve button -> calls approveTeacher() -> refresh
  // Reject button -> opens dialog -> calls rejectTeacher() -> refresh
}
```

---

## Phase 5: Navigation Integration

### 5.1 Add to Portal Sidebar

Update `src/config/portal-config.ts`:

```typescript
schoolAdmin: {
  navigationItems: [
    { name: "Dashboard", href: "/school-admin/dashboard", icon: Home },
    { name: "Teachers", href: "/school-admin/teachers", icon: GraduationCap },
    { name: "Pending Teachers", href: "/school-admin/teachers/pending", icon: UserCheck }, // NEW
    // ... other items
  ]
}
```

---

## Phase 6: Testing Checklist

Before considering any feature "done":

### Backend Testing
- [ ] API returns correct data for empty state (0 records)
- [ ] API returns correct data for populated state (1+ records)
- [ ] Error handling works (invalid ID, already approved, etc.)
- [ ] Database transactions are atomic (all or nothing)

### UI Testing
- [ ] Page loads without errors
- [ ] Empty state shows helpful message
- [ ] Loading state shows during API calls
- [ ] Success/error toasts appear after actions
- [ ] Navigation works after actions

### Integration Testing
- [ ] Teacher signup → application created
- [ ] School-admin approves → teacher can login
- [ ] Teacher sees correct dashboard after approval
- [ ] Rejected teachers cannot login

---

## Phase 7: Teacher-Class Assignment

After teacher approval works, implement class assignment:

### 7.1 Update Class Creation Form

Modify `/app/school-admin/classes/create/page.tsx`:

```typescript
// Add to form:
// - Class Teacher dropdown (filtered by approved teachers)
// - Subject Teachers multi-select
```

### 7.2 Save Assignments

Update `createClass` action:

```typescript
// After creating class:
if (data.homeroomTeacherId) {
  await db.insert(teacherAssignments).values({
    id: `ta-${nanoid()}`,
    teacherId: data.homeroomTeacherId,
    classId: classId,
    role: "homeroom",
    isPrimary: true,
    // ...
  });
}

// For each subject teacher:
for (const subjectTeacherId of data.subjectTeacherIds) {
  await db.insert(teacherAssignments).values({
    id: `ta-${nanoid()}`,
    teacherId: subjectTeacherId,
    classId: classId,
    subjectId: correspondingSubjectId,
    role: "subject_teacher",
    isPrimary: false,
    // ...
  });
}
```

---

## Implementation Order (Priority)

### Sprint 1: Core Approval Flow
1. ✅ Platform Admin creates school
2. ✅ School-admin signup + approval
3. 🔲 **Teacher signup → pending approval**
4. 🔲 **School-admin approves teacher**
5. 🔲 **Teacher can login**

### Sprint 2: Class Management
6. ✅ School-admin creates class
7. 🔲 **School-admin assigns class teacher**
8. 🔲 **School-admin assigns subject teachers**
9. 🔲 **Teacher sees assigned classes**

### Sprint 3: Student Enrollment
10. 🔲 Student signup → pending approval
11. 🔲 School-admin approves student
12. 🔲 School-admin enrolls student in class
13. 🔲 Teacher sees enrolled students

---

## Quick Start Command

To implement teacher approval flow now, run:

```
1. Create API routes for pending teachers
2. Create server actions in _actions.ts
3. Create pending teachers page
4. Add navigation menu item
5. Test the full flow
```

---

## Anti-Patterns to Avoid

❌ **Don't:** Build full UI before API works
✅ **Do:** Test API with curl/Postman first

❌ **Don't:** Use hardcoded data in production
✅ **Do:** Always fetch from database

❌ **Don't:** Skip error handling
✅ **Do:** Wrap everything in try-catch with logging

❌ **Don't:** Build all features at once
✅ **Do:** One feature at a time, test thoroughly

❌ **Don't:** Skip navigation updates
✅ **Do:** Add menu items as soon as pages exist

---

## File Structure (Reference)

```
src/
├── app/
│   ├── api/
│   │   └── school-admin/
│   │       └── teachers/
│   │           ├── pending/
│   │           │   └── route.ts           # GET pending teachers
│   │           ├── [teacherId]/
│   │           │   ├── approve/
│   │           │   │   └── route.ts       # POST approve
│   │           │   └── reject/
│   │           │       └── route.ts       # POST reject
│   │           └── route.ts               # GET all teachers
│   ├── school-admin/
│   │   ├── _actions.ts                    # Server actions
│   │   ├── teachers/
│   │   │   ├── page.tsx                  # All teachers
│   │   │   └── pending/
│   │   │       ├── page.tsx              # Pending teachers (server)
│   │   │       └── pending-client.tsx    # Pending teachers (client)
│   │   └── classes/
│   │       ├── page.tsx                  # All classes
│   │       └── create/
│   │           └── page.tsx              # Create class with teacher selection
│   └── setup/
│       └── teacher/
│           └── route.ts                  # Teacher signup (creates application)
├── config/
│   └── portal-config.ts                   # Navigation config
└── lib/
    ├── db/
    │   └── schema.ts                      # Database schema
    └── api/
        └── school-admin.ts                # Data fetching utilities
```

---

## Ready to Implement?

I can start building the teacher approval flow. The order will be:

1. **Fix teacher setup API** - Creates pending application
2. **Create pending teachers API** - Fetch and approve/reject
3. **Create pending teachers page** - UI for school-admin
4. **Test full flow** - Signup → Pending → Approve → Login

Should I proceed?
