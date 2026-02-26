# Teacher & Student Approval Flow Implementation

**Date:** February 23, 2026
**Issue:** Teachers and students who signed up with school code were going directly to dashboard without requiring school admin approval.

---

## Problem Statement

When teachers and students signed up using a school code, they were able to access their dashboard immediately without waiting for school admin approval. This was a security concern as schools want to vet all teachers and students before granting access.

**Current behavior:**
- **Teachers**: Direct dashboard access after setup
- **Students**: Already had approval flow implemented (creates `studentApplications`)

**Desired behavior:**
- Both teachers and students should:
  1. Complete setup wizard
  2. Be redirected to `/pending-approval` page
  3. Wait for school admin to approve their application
  4. Access dashboard only after approval

---

## Root Cause Analysis

### Teacher Setup Flow Issues

The teacher setup API (`src/app/api/setup/teacher/route.ts`) was:
1. Setting `onboardingComplete: true` without creating an application record
2. Not setting `onboardingStatus` to `pending_enrollment`
3. Not notifying school admins about new teacher applications

### Layout Issues

The teacher and student layouts:
- Didn't check for `pending_approval` or `pending_enrollment` status
- Allowed users with pending status to access their portal dashboards

---

## Solution Implemented

### 1. Teacher Setup API Changes

**File:** `src/app/api/setup/teacher/route.ts`

**Changes:**
- Set `onboardingStatus: "pending_enrollment"` when creating teacher user
- Create `teacherApplications` record when setup is completed
- Validate school is active and subscription is valid
- Notify school admins via in-app notifications
- Added `notifySchoolAdminsAboutNewTeacher()` function

**Key code:**
```typescript
onboardingStatus: "pending_enrollment", // Teachers start as pending until school admin approves

// When step === "complete":
if (step === "complete") {
  await db.insert(teacherApplications).values({
    id: applicationId,
    userId: dbUser.id,
    schoolId: dbUser.schoolId,
    status: "pending",
    qualifications: data.qualifications || null,
    experience: data.experience || null,
    subjects: JSON.stringify(subjectsArray),
    // ... other fields
  });

  await notifySchoolAdminsAboutNewTeacher(dbUser.schoolId, dbUser);
}
```

### 2. Teacher Layout Changes

**File:** `src/app/teacher/layout.tsx`

**Changes:**
- Added `isPendingApproval` check based on `onboardingStatus`
- Pass `isPendingApproval` prop to client component

**Key code:**
```typescript
const needsSetup = !user.onboardingComplete &&
  user.onboardingStatus !== "pending_approval" &&
  user.onboardingStatus !== "pending_enrollment";
const isPendingApproval = user.onboardingStatus === "pending_approval" ||
  user.onboardingStatus === "pending_enrollment";
```

### 3. Teacher Layout Client Changes

**File:** `src/app/teacher/teacher-layout-client.tsx`

**Changes:**
- Added `isPendingApproval` prop to interface
- Redirect to `/pending-approval` when pending
- Added `pathname` to useEffect dependencies

**Key code:**
```typescript
if (isPendingApproval && !pathname.includes("pending-approval")) {
  router.push("/pending-approval");
  return;
}
```

### 4. Student Layout Changes

**File:** `src/app/student/layout.tsx` and `src/app/student/student-layout-client.tsx`

**Changes:**
- Same pattern as teacher layout
- Students already had application creation in setup API
- Just needed the redirect logic in layouts

### 5. Pending Teacher Applications Page (NEW)

**File:** `src/app/school-admin/teachers/pending/page.tsx`

**Features:**
- Lists all pending teacher applications for the school
- Shows teacher details (qualifications, experience, subjects, etc.)
- Approve/Reject buttons with confirmation
- Rejection requires a reason
- Real-time updates after action

### 6. Pending Teacher Applications API (NEW)

**File:** `src/app/api/school-admin/teachers/pending/route.ts`

**Endpoints:**
- `GET /api/school-admin/teachers/pending` - Fetch pending applications
- `POST /api/school-admin/teachers/pending` - Approve/reject applications

**Approval logic:**
```typescript
if (action === "approve") {
  await db.update(teacherApplications).set({ status: "approved", ... });
  await db.update(users).set({ onboardingStatus: "enrolled", ... });
}
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/app/teacher/layout.tsx` | Added `isPendingApproval` prop |
| `src/app/teacher/teacher-layout-client.tsx` | Added pending approval redirect |
| `src/app/student/layout.tsx` | Added `isPendingApproval` prop |
| `src/app/student/student-layout-client.tsx` | Added pending approval redirect |
| `src/app/api/setup/teacher/route.ts` | Creates applications, notifies admins |

## Files Created

| File | Purpose |
|------|---------|
| `src/app/school-admin/teachers/pending/page.tsx` | School admin pending teachers page |
| `src/app/api/school-admin/teachers/pending/route.ts` | API for teacher applications |

---

## Complete User Flow

### For Teachers:
1. Teacher signs up with school code → Completes setup wizard
2. `teacherApplications` record created with status "pending"
3. Teacher redirected to `/pending-approval` page
4. School admin navigates to `/school-admin/teachers/pending`
5. School admin reviews and approves/rejects application
6. If approved: Teacher's `onboardingStatus` → "enrolled", dashboard accessible

### For Students:
1. Student signs up with school code → Completes setup wizard
2. `studentApplications` record created with status "pending" (already implemented)
3. Student redirected to `/pending-approval` page
4. School admin navigates to `/school-admin/students/pending` (existing page)
5. School admin reviews and approves/rejects application
6. If approved: Student's `onboardingStatus` → "enrolled", dashboard accessible

---

## Database Tables Used

### `teacherApplications`
```sql
- id (text, PK)
- userId (text, FK → users.id)
- schoolId (text, FK → schools.id)
- status (text): "pending" | "approved" | "rejected"
- qualifications (text)
- experience (integer)
- subjects (text, JSON array)
- desiredClasses (text, JSON array)
- previousSchool (text)
- specialization (text)
- appliedAt (timestamp)
- reviewedBy (text, FK → users.id)
- reviewedAt (timestamp)
- rejectionReason (text)
- notes (text)
- createdAt (timestamp)
- updatedAt (timestamp)
```

### `studentApplications`
Already existed, similar structure to teacher applications.

---

## Testing Steps

1. Sign up a new teacher with a valid school code
2. Complete the setup wizard
3. Verify teacher is redirected to `/pending-approval`
4. Sign in as school admin
5. Navigate to `/school-admin/teachers/pending`
6. Verify the teacher application appears in the list
7. Approve the application
8. Sign in as teacher again
9. Verify teacher can now access the dashboard

---

## Related Documentation

- [Student Setup API](../api/setup/student/route.ts) - Reference for similar implementation
- [Pending Approval Page](../../pending-approval/page.tsx) - Universal pending page
- [School Admin Layout](../../school-admin/layout.tsx) - Approval pattern reference

---

## Notes

- The `/pending-approval` page is universal and works for all user types (teacher, student, school-admin)
- The page polls the server every 30 seconds to check for approval status
- Notifications are sent to all school admins when a new application is submitted
- Rejection requires a reason which is stored and can be viewed later
