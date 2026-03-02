# Teacher-Class-Subject Workflow Documentation

**Last Updated:** February 25, 2026
**Status:** ✅ ALL PHASES COMPLETE

---

## Quick Reference

| Phase | Feature | Status | File Reference |
|-------|---------|--------|----------------|
| 0 | Platform Admin creates global subjects | ✅ Complete | `/admin/content` |
| 1 | School Admin copies subjects to school | ✅ Complete | `/school-admin/subjects/page.tsx` |
| 2 | School Admin creates classes | ✅ Complete | `/school-admin/classes/create/page.tsx` |
| 3 | Teacher signup with application | ✅ Complete | `/setup/teacher/page.tsx` |
| 4 | School Admin approves teachers | ✅ Complete | `/school-admin/teachers/pending/page.tsx` |
| 5 | Subject-Teacher assignment | ✅ Complete | `/school-admin/subjects/[id]/page.tsx` |
| 6 | Class-Subject-Teacher mapping | ✅ Complete | `/school-admin/classes/[id]/page.tsx` |
| 7 | Teacher Portal assignment view | ✅ Complete | `/teacher/my-classes/page.tsx` |
| 8 | Timetable system | ✅ Complete | `/school-admin/timetable`, `/teacher/timetable` |

---

## Flow Diagrams

### Visual Flow Overview

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│ Platform     │────▶│ School       │────▶│ Teacher      │
│ Admin        │     │ Admin        │     │              │
│              │     │              │     │              │
│ ✅ Create    │     │ ✅ Copy      │     │ ✅ Sign Up   │
│   Global     │     │   Subjects   │     │   with Setup │
│   Subjects   │     │ ✅ Create    │     │ ✅ Apply     │
│ ✅ Create    │     │   Class      │     │              │
│   Schools    │     │ ✅ Approve   │     │              │
└──────────────┘     │   Teachers   │     └──────────────┘
                    └──────────────┘              │
                           │                      │
                           ▼                      ▼
                    ┌──────────────────────────────┐
                    │  ❌ MISSING LINKAGES        │
                    │                             │
                    │  ┌─────────────────────┐    │
                    │  │ Subject→Teacher     │    │
                    │  │ Assignment UI       │    │
                    │  └─────────────────────┘    │
                    │             ↓               │
                    │  ┌─────────────────────┐    │
                    │  │ Class→Subject→      │    │
                    │  │ Teacher Mapping     │    │
                    │  └─────────────────────┘    │
                    │             ↓               │
                    │  ┌─────────────────────┐    │
                    │  │ Teacher Portal      │    │
                    │  │ View                │    │
                    │  └─────────────────────┘    │
                    │             ↓               │
                    │  ┌─────────────────────┐    │
                    │  │ Timetable System    │    │
                    │  └─────────────────────┘    │
                    └──────────────────────────────┘
```

---

## Phase-by-Phase Details

### Phase 0: Platform Setup (Platform Admin)

**Who:** Platform Admin (`/admin`)
**What:** Creates the foundation for all schools

**Steps:**
1. Navigate to `/admin/content`
2. Create global subject templates (REC curriculum)
   - Mathematics, Science, Dzongkha, English, etc.
   - Each subject has grade levels (6-12)
3. Create schools with auto-generated codes
4. Approve school admin applications

**Database Tables:**
- `global_subjects` - Platform-level subject templates
- `schools` - School records with codes
- `school_admin_applications` - Pending approvals

**Files:**
- `/src/app/admin/content` - Global subject management
- `/src/app/admin/schools` - School creation
- `/src/app/api/subjects/global` - Global subjects API

---

### Phase 1: School Setup (School Admin)

**Who:** School Admin (`/school-admin`)
**What:** Copies global subjects and creates school-specific subjects

**Steps:**
1. Login to School Admin portal
2. Navigate to `/school-admin/subjects`
3. Click "Add Subject"
4. Dropdown shows:
   - Mathematics (Grade 6)
   - Mathematics (Grade 7)
   - ...
   - Science (Grade 6)
   - ...
   - **+ Add Custom Subject**
5. Selection creates subject in school's database

**Database Tables:**
- `subjects` - School-specific subjects with `schoolId`

**Files:**
- `/src/app/school-admin/subjects/page.tsx`
- `/src/app/api/school-admin/subjects/route.ts`

---

### Phase 2: Class Creation (School Admin)

**Who:** School Admin
**What:** Creates class sections and assigns teachers

**Steps:**
1. Navigate to `/school-admin/classes`
2. Click "Create New Class"
3. Fill form:
   - Grade (6-12)
   - Section (A-F)
   - Room Number
   - Capacity
   - Academic Year
   - Homeroom Teacher (dropdown)
   - Subject Teachers (multi-select)
4. Submit → Class created

**Database Tables:**
- `classes` - Class records
- `enrollments` - Student enrollment in classes

**Files:**
- `/src/app/school-admin/classes/create/page.tsx`
- `/src/app/api/school-admin/classes/route.ts`

**Gap:** Subject teachers are added but NOT linked to specific subjects. The form just adds teacher IDs to the class.

---

### Phase 3: Teacher Applications (Teacher Signup)

**Who:** Teacher
**What:** Teacher signs up and creates application

**Steps:**
1. Teacher visits `/signup`
2. Selects "Teacher" role
3. Completes setup wizard:
   - Qualifications
   - Subjects (comma-separated text)
   - Experience (years)
   - Desired Classes
   - Specialization
   - Previous School
4. Creates `teacher_applications` record with `status='pending'`

**Database Tables:**
- `teacher_applications` - Applications awaiting approval
- `users` - Teacher user record

**Files:**
- `/src/app/setup/teacher/page.tsx`
- `/src/app/api/setup/teacher/route.ts`

**Gap:** Subjects stored as text/JSON, not linked to actual subject IDs.

---

### Phase 4: Teacher Approval (School Admin)

**Who:** School Admin
**What:** Reviews and approves teacher applications

**Steps:**
1. Navigate to `/school-admin/teachers/pending`
2. View application details:
   - Qualifications
   - Subjects taught
   - Experience
   - Previous School
3. Click "Approve" or "Reject"
4. Approved teachers appear in teacher selection dropdowns

**Database Tables:**
- `teacher_applications` - Status updated to `approved`/`rejected`
- `users` - `onboardingStatus` updated to `enrolled`

**Files:**
- `/src/app/school-admin/teachers/pending/page.tsx`
- `/src/app/api/school-admin/teachers/pending/route.ts`

---

### Phase 5: Subject-Teacher Assignment ❌ MISSING

**What Should Happen:**
1. School admin goes to `/school-admin/subjects`
2. Clicks on a subject card (e.g., "Mathematics - Grade 10")
3. Sees detail page at `/school-admin/subjects/[id]`
4. Clicks "Assign Teachers"
5. Modal shows:
   - Available teachers (filtered by subject expertise)
   - Grade sections that teach this subject
   - Primary/Secondary designation
6. Saves assignments to `teacher_assignments`

**Database Tables:**
- `teacher_assignments` - Need to populate with:
  - `teacherId`
  - `subjectId`
  - `role = 'subject_expert'`
  - `academicYear`

**What Needs to Be Built:**
1. `/src/app/school-admin/subjects/[id]/page.tsx` - Subject detail page
2. `/src/components/school-admin/assign-subject-teachers-modal.tsx` - Assignment modal
3. `/src/app/api/school-admin/subjects/[id]/teachers/route.ts` - Assignment API

---

### Phase 6: Class-Subject-Teacher Mapping ❌ INCOMPLETE

**What Exists:**
- Class detail page at `/school-admin/classes/[id]`
- Shows subjects for the grade
- Shows teacher assignments

**What's Missing:**
- UI to assign teachers to specific subjects within a class
- Form to specify: "For Class 10-A, Mathematics is taught by Mr. X"
- Period per week assignment

**What Needs to Be Built:**
1. Enhance class detail page with "Manage Subject Teachers" section
2. For each subject in the grade:
   - Dropdown to select teacher
   - Input for periods per week
   - Room assignment
3. Creates `teacher_assignments` records with:
   - `teacherId`
   - `classId`
   - `subjectId` ← This is the critical missing link
   - `role = 'subject_teacher'`
   - `periodsPerWeek`
   - `roomNumber`

**Files to Modify:**
- `/src/app/school-admin/classes/[id]/page.tsx`
- `/src/app/api/school-admin/classes/[id]/subject-teachers/route.ts` (NEW)

---

### Phase 7: Teacher Portal (Teacher View) ❌ INCOMPLETE

**What Should Happen:**
1. Teacher logs in to `/teacher`
2. Dashboard shows:
   - Assigned classes (e.g., "Class 10-A", "Class 9-B")
   - Subjects teaching (e.g., "Mathematics", "Physics")
   - Today's schedule
3. Quick actions:
   - Take attendance for specific class
   - Create homework for specific subject
   - View student list

**What Exists:**
- Teacher dashboard at `/teacher/dashboard`
- Basic profile

**What Needs to Be Built:**
1. `/src/app/teacher/my-classes/page.tsx` - List of assigned classes
2. `/src/app/teacher/my-subjects/page.tsx` - List of subjects teaching
3. Query `teacher_assignments` table filtered by `teacherId`
4. Display on dashboard

---

### Phase 8: Timetable & Scheduling ❌ MISSING

**What Should Happen:**
1. School admin goes to `/school-admin/timetable`
2. Sees master timetable:
   - Rows: Classes (6-A, 6-B, ..., 12-A)
   - Columns: Periods (1-8) and Days (Mon-Fri)
   - Cells: Subject + Teacher + Room
3. Can:
   - Click cell to assign
   - Detect conflicts (teacher double-booked, room double-booked)
   - Print/export for teachers, students, parents

**What Needs to Be Built:**
1. `/src/app/school-admin/timetable/page.tsx` - Master timetable view
2. `/src/lib/timetable-utils.ts` - Conflict detection logic
3. `/src/app/api/school-admin/timetable/route.ts` - Timetable CRUD
4. Print/export functionality

**Database Tables:**
- `timetables` - Period assignments (NEW TABLE NEEDED)
  - `classId`
  - `subjectId`
  - `teacherId`
  - `roomId`
  - `dayOfWeek`
  - `periodNumber`
  - `academicYear`

---

## Database Schema Summary

### Tables Involved

| Table | Purpose | Status |
|-------|---------|--------|
| `global_subjects` | Platform-level subject templates | ✅ Exists |
| `subjects` | School-specific subjects | ✅ Exists |
| `schools` | School records | ✅ Exists |
| `classes` | Class sections | ✅ Exists |
| `teacher_applications` | Teacher signup/approval | ✅ Exists |
| `teacher_assignments` | Teacher→Class→Subject mapping | ✅ Exists (underutilized) |
| `timetables` | Period scheduling | ❌ Missing |
| `rooms` | Room assignments | ❌ Missing |

### teacher_assignments Table Structure

```sql
teacher_assignments (
  id TEXT PRIMARY KEY,
  teacherId TEXT REFERENCES users(id),
  classId TEXT REFERENCES classes(id),
  subjectId TEXT REFERENCES subjects(id),  -- ← Critical link
  role TEXT,  -- 'homeroom' | 'subject_teacher' | 'subject_expert'
  isPrimary BOOLEAN DEFAULT false,
  academicYear TEXT NOT NULL,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
)
```

---

## Critical Gaps

### Gap 1: No Subject-Teacher Expertise Mapping
- **Problem:** No way to record "Mr. X teaches Mathematics and Physics"
- **Impact:** Can't filter appropriate teachers when assigning to classes
- **Solution:** Create subject detail page with teacher assignment capability

### Gap 2: Class Creation Subject Assignment is Incomplete
- **Problem:** Class form adds subject teachers but doesn't specify which subject
- **Impact:** Teachers assigned to class but subject linkage is lost
- **Solution:** Add subject selection for each teacher in class form

### Gap 3: No Teacher Portal View of Assignments
- **Problem:** Teachers can't see their assigned classes and subjects
- **Impact:** Teachers don't know what/where to teach
- **Solution:** Create teacher assignments view in `/teacher` portal

### Gap 4: No Timetable System
- **Problem:** No way to schedule periods, detect conflicts
- **Impact:** Manual timetable creation, potential conflicts
- **Solution:** Build timetable management system

---

## Implementation Priority

### Priority 1: Complete Class-Subject-Teacher Assignment
1. Add subject detail page at `/school-admin/subjects/[id]`
2. Add "Assign Teachers" button to subject cards
3. Create assignment UI showing grade sections
4. Store in `teacher_assignments` with `subjectId`

### Priority 2: Teacher Portal Assignments View
1. Create `/teacher/my-classes` page
2. Create `/teacher/my-subjects` page
3. Show today's schedule on dashboard

### Priority 3: Timetable System
1. Create `/school-admin/timetable` page
2. Add period assignment per class-subject
3. Conflict detection logic
4. Print/export functionality

---

## File Checklist

### Existing Files
- ✅ `/src/app/school-admin/subjects/page.tsx`
- ✅ `/src/app/school-admin/classes/create/page.tsx`
- ✅ `/src/app/school-admin/classes/[id]/page.tsx`
- ✅ `/src/app/school-admin/teachers/pending/page.tsx`
- ✅ `/src/app/api/school-admin/subjects/route.ts`
- ✅ `/src/app/api/school-admin/classes/[id]/assign-teacher/route.ts`

### Files to Create
- ❌ `/src/app/school-admin/subjects/[id]/page.tsx`
- ❌ `/src/app/school-admin/subjects/[id]/assign-teachers/page.tsx`
- ❌ `/src/components/school-admin/assign-subject-teachers-modal.tsx`
- ❌ `/src/app/teacher/my-classes/page.tsx`
- ❌ `/src/app/teacher/my-subjects/page.tsx`
- ❌ `/src/app/school-admin/timetable/page.tsx`
- ❌ `/src/lib/timetable-utils.ts`

---

## API Endpoints Needed

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/school-admin/subjects/[id]` | Get subject detail with assigned teachers |
| POST | `/api/school-admin/subjects/[id]/teachers` | Assign teacher to subject |
| DELETE | `/api/school-admin/subjects/[id]/teachers/[teacherId]` | Remove teacher from subject |
| GET | `/api/teacher/my-assignments` | Get teacher's class/subject assignments |
| GET | `/api/school-admin/timetable` | Get master timetable |
| POST | `/api/school-admin/timetable/assign` | Assign period to class-subject-teacher |

---

## For Future Agents

When working on teacher-class-subject assignment:

1. **ALWAYS use `teacher_assignments` table** - It already exists with the right structure
2. **The `subjectId` field is critical** - Don't create assignments without it
3. **Filter by `schoolId`** - All data must be tenant-isolated
4. **Use `requireAuth(['school-admin'])`** - For all school admin APIs
5. **Query by `academicYear`** - Assignments are year-specific

**Common Mistakes to Avoid:**
- ❌ Don't assign teachers to classes without specifying subject
- ❌ Don't use comma-separated text for subjects - use junction tables
- ❌ Don't forget to set `role` in teacher_assignments
- ❌ Don't create duplicate assignments - check before inserting
