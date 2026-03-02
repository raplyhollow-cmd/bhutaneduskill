# Database Schema Reference

> **Bhutan EduSkill Platform - Quick Reference for Developers**
> **Last Updated:** 2026-02-25
> **Total Tables:** 145+
> **Database:** PostgreSQL (Neon)
> **ORM:** Drizzle ORM

---

## Table of Contents

1. [Core User Tables](#core-user-tables)
2. [Academic Tables](#academic-tables)
3. [Assessment & Homework Tables](#assessment--homework-tables)
4. [Attendance & Fees Tables](#attendance--fees-tables)
5. [Timetable & Schedule Tables](#timetable--schedule-tables)
6. [Library Tables](#library-tables)
7. [Important Notes](#important-notes)

---

## Core User Tables

### 1. users

**Purpose:** Central user table storing all user types (students, teachers, parents, counselors, school admins, platform admins).

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `clerkUserId` | text (unique) | Clerk authentication user ID - **CRITICAL: Use this for auth lookups** |
| `type` | text | User type: `"student"` \| `"teacher"` \| `"parent"` \| `"school_admin"` \| `"admin"` \| `"counselor"` |
| `role` | text | User role (additional granularity) |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `parentId` | text (FK) | Reference to `users.id` (for student-parent links) |
| `email` | text | User email |
| `phone` | text | User phone |
| `grade` | integer | Grade level (for students) |
| `onboardingComplete` | boolean | Setup completion status |
| `isActive` | boolean | Account active status |
| `createdAt` | timestamp | Creation timestamp |
| `updatedAt` | timestamp | Last update timestamp |

**Indexes:**
- `idx_users_clerk_user_id` on `clerkUserId`
- `idx_users_school_id` on `schoolId`
- `idx_users_type` on `type`
- `idx_users_school_type` on (`schoolId`, `type`)

**Common Queries:**

```typescript
// Get user by Clerk ID
const user = await db
  .select()
  .from(users)
  .where(eq(users.clerkUserId, clerkUserId))
  .limit(1);

// Get all students for a school
const students = await db
  .select()
  .from(users)
  .where(and(
    eq(users.schoolId, schoolId),
    eq(users.type, 'student')
  ));

// Get teachers for a school
const teachers = await db
  .select()
  .from(users)
  .where(and(
    eq(users.schoolId, schoolId),
    eq(users.type, 'teacher')
  ));
```

**Relations:**
- `schoolId` -> `schools.id`
- `parentId` -> `users.id` (self-reference for parent-child)

---

### 2. schools

**Purpose:** Stores school information including subscription status, contact details, and configuration.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `name` | text | School name |
| `code` | text (unique) | Unique school code |
| `type` | text | School type: `"public"` \| `"private"` \| `"international"` |
| `schoolType` | text | Alias for type |
| `level` | text | Level: `"primary"` \| `"middle"` \| `"secondary"` \| `"higher_secondary"` |
| `subscriptionStatus` | text | `"pending_payment"` \| `"active"` \| `"suspended"` \| `"cancelled"` |
| `subscriptionTier` | text | `"basic"` \| `"standard"` \| `"premium"` \| `"enterprise"` |
| `tenantId` | text | Multi-tenant isolation ID |
| `isActive` | boolean | School active status |
| `setupComplete` | boolean | Initial setup completion |

**Indexes:**
- `idx_schools_code` on `code`
- `idx_schools_is_active` on `isActive`
- `idx_schools_subscription_status` on `subscriptionStatus`

**Common Queries:**

```typescript
// Get active schools
const activeSchools = await db
  .select()
  .from(schools)
  .where(eq(schools.isActive, true));

// Get school by code
const school = await db
  .select()
  .from(schools)
  .where(eq(schools.code, 'SCH001'))
  .limit(1);
```

---

## Academic Tables

### 3. classes

**Purpose:** Represents individual classes (grade + section combinations) within a school.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `name` | text | Display name (e.g., "Class 10-A") |
| `grade` | integer | Grade level (6-12) |
| `section` | text | Section identifier (e.g., "A", "B") |
| `roomNumber` | text | Classroom location |
| `capacity` | integer | Max students |
| `homeroomTeacherId` | text (FK) | Reference to `users.id` |
| `classTeacherId` | text (FK) | Reference to `users.id` |
| `academicYear` | text | Academic year identifier |
| `isActive` | boolean | Class active status |

**Indexes:**
- `idx_classes_school_id` on `schoolId`
- `idx_classes_teacher_id` on `teacherId`
- `idx_classes_grade` on `grade`
- `idx_classes_school_grade` on (`schoolId`, `grade`)

**Common Queries:**

```typescript
// Get all classes for a school
const classes = await db
  .select()
  .from(classes)
  .where(and(
    eq(classes.schoolId, schoolId),
    eq(classes.isActive, true)
  ));

// Get classes by grade
const grade10Classes = await db
  .select()
  .from(classes)
  .where(and(
    eq(classes.schoolId, schoolId),
    eq(classes.grade, 10)
  ));
```

---

### 4. subjects

**Purpose:** Academic subjects offered by a school.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` (null for global subjects) |
| `departmentId` | text (FK) | Reference to `departments.id` |
| `name` | text | Subject name |
| `code` | text (unique) | Subject code (e.g., "MATH", "ENG") |
| `type` | text | `"core"` \| `"elective"` \| `"language"` \| `"additional"` |
| `subjectType` | text | Alias for type |
| `grade` | integer | Applicable grade (nullable) |
| `applicableGrades` | text | JSON array of applicable grades |
| `isActive` | boolean | Subject active status |

**Indexes:**
- `idx_subjects_school_id` on `schoolId`
- `idx_subjects_department_id` on `departmentId`
- `idx_subjects_grade` on `grade`

**Common Queries:**

```typescript
// Get active subjects for a school
const subjects = await db
  .select()
  .from(subjects)
  .where(and(
    eq(subjects.schoolId, schoolId),
    eq(subjects.isActive, true)
  ));

// Get core subjects for a grade
const coreSubjects = await db
  .select()
  .from(subjects)
  .where(and(
    eq(subjects.schoolId, schoolId),
    eq(subjects.type, 'core'),
    eq(subjects.grade, 10)
  ));
```

---

### 5. enrollments

**Purpose:** Student-class enrollments for an academic year.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `studentId` | text (FK) | Reference to `users.id` |
| `classId` | text (FK) | Reference to `classes.id` |
| `academicYear` | text | Academic year (e.g., "2025-2026") |
| `enrollmentDate` | text | Date enrolled |
| `status` | text | `"active"` \| `"withdrawn"` \| `"completed"` \| `"transferred"` |
| `rollNumber` | text | Roll number within class |
| `section` | text | Section assignment |

**Indexes:**
- `idx_enrollments_student_id` on `studentId`
- `idx_enrollments_class_id` on `classId`
- `idx_enrollments_academic_year` on `academicYear`
- `idx_enrollments_class_status` on (`classId`, `status`)
- `idx_enrollments_student_year` on (`studentId`, `academicYear`)

**Common Queries:**

```typescript
// Get active students in a class
const students = await db
  .select({
    studentId: enrollments.studentId,
    rollNumber: enrollments.rollNumber,
    name: users.name,
  })
  .from(enrollments)
  .innerJoin(users, eq(enrollments.studentId, users.id))
  .where(and(
    eq(enrollments.classId, classId),
    eq(enrollments.status, 'active')
  ));

// Get current class for a student
const enrollment = await db
  .select()
  .from(enrollments)
  .where(and(
    eq(enrollments.studentId, studentId),
    eq(enrollments.status, 'active')
  ))
  .orderBy(desc(enrollments.enrollmentDate))
  .limit(1);
```

---

### 6. teacher_assignments

**Purpose:** Links teachers to classes and subjects.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `teacherId` | text (FK) | Reference to `users.id` |
| `classId` | text (FK) | Reference to `classes.id` |
| `subjectId` | text (FK) | Reference to `subjects.id` |
| `academicYear` | text | Academic year |
| `role` | text | `"homeroom"` \| `"subject_teacher"` \| `"both"` |
| `isPrimary` | boolean | Primary teacher flag |
| `isActive` | boolean | Assignment active status |

**Common Queries:**

```typescript
// Get all assignments for a teacher
const assignments = await db
  .select()
  .from(teacherAssignments)
  .where(and(
    eq(teacherAssignments.teacherId, teacherId),
    eq(teacherAssignments.isActive, true)
  ));

// Get teachers for a class
const classTeachers = await db
  .select({
    teacherId: teacherAssignments.teacherId,
    teacherName: users.name,
    subjectName: subjects.name,
    role: teacherAssignments.role,
  })
  .from(teacherAssignments)
  .innerJoin(users, eq(teacherAssignments.teacherId, users.id))
  .innerJoin(subjects, eq(teacherAssignments.subjectId, subjects.id))
  .where(eq(teacherAssignments.classId, classId));
```

---

## Assessment & Homework Tables

### 7. assessments

**Purpose:** Assessments, tests, and career evaluations assigned to students.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `classId` | text (FK) | Reference to `classes.id` |
| `assessmentTypeId` | text (FK) | Reference to `assessment_types.id` |
| `title` | text | Assessment title |
| `dueDate` | text | Due date (ISO string) |
| `totalPoints` | integer | Maximum possible score |
| `passingScore` | integer | Minimum passing score |
| `userId` | text (FK) | Student taking the assessment |
| `status` | text | `"draft"` \| `"published"` \| `"archived"` |
| `type` | text | `"riasec"` \| `"mbti"` \| `"disc"` \| `"work_values"` |
| `results` | json | Assessment answers/results |
| `completedAt` | timestamp | Completion timestamp |

**Indexes:**
- `idx_assessments_user_id` on `userId`
- `idx_assessments_class_id` on `classId`
- `idx_assessments_type` on `type`
- `idx_assessments_user_type` on (`userId`, `type`)

**Common Queries:**

```typescript
// Get published assessments for a class
const assessments = await db
  .select()
  .from(assessments)
  .where(and(
    eq(assessments.classId, classId),
    eq(assessments.status, 'published')
  ));

// Get completed career assessments for a student
const careerAssessments = await db
  .select()
  .from(assessments)
  .where(and(
    eq(assessments.userId, userId),
    isInArray(assessments.type, ['riasec', 'mbti', 'disc']),
    isNotNull(assessments.completedAt)
  ));
```

---

### 8. homework

**Purpose:** Homework assignments for classes.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `classId` | text (FK) | Reference to `classes.id` |
| `subjectId` | text (FK) | Reference to `subjects.id` |
| `title` | text | Homework title |
| `description` | text | Instructions |
| `dueDate` | text | Due date (ISO string) |
| `assignedDate` | text | Assignment date |
| `totalPoints` | integer | Maximum score |
| `passingScore` | integer | Minimum passing score |
| `questions` | json | Array of questions |
| `attachments` | json | File attachments |
| `isPublished` | boolean | Published status |
| `isActive` | boolean | Active status |

**Indexes:**
- `idx_homework_class_id` on `classId`
- `idx_homework_subject_id` on `subjectId`
- `idx_homework_is_published` on `isPublished`
- `idx_homework_due_date` on `dueDate`

**Common Queries:**

```typescript
// Get published homework for a class
const homeworkList = await db
  .select({
    id: homework.id,
    title: homework.title,
    subjectName: subjects.name,
    dueDate: homework.dueDate,
  })
  .from(homework)
  .leftJoin(subjects, eq(homework.subjectId, subjects.id))
  .where(and(
    eq(homework.classId, classId),
    eq(homework.isPublished, true)
  ))
  .orderBy(homework.dueDate);
```

---

### 9. homework_submissions

**Purpose:** Student homework submissions.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `homeworkId` | text (FK) | Reference to `homework.id` |
| `studentId` | text (FK) | Reference to `users.id` |
| `submittedAt` | timestamp | Submission timestamp |
| `content` | json | Submission content |
| `gradedAt` | timestamp | Grading timestamp |
| `score` | integer | Score obtained |
| `feedback` | text | Teacher feedback |
| `status` | text | `"submitted"` \| `"graded"` \| `"returned"` |
| `isLate` | boolean | Late submission flag |

**Indexes:**
- `idx_homework_submissions_homework_id` on `homeworkId`
- `idx_homework_submissions_student_id` on `studentId`
- `idx_homework_submissions_homework_student` on (`homeworkId`, `studentId`)

---

## Attendance & Fees Tables

### 10. attendance

**Purpose:** Daily student attendance records.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `studentId` | text (FK) | Reference to `users.id` |
| `classId` | text (FK) | Reference to `classes.id` |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `date` | text | Attendance date (ISO string) |
| `checkInTime` | text | Check-in time |
| `status` | text | `"present"` \| `"absent"` \| `"late"` \| `"excused"` |
| `recordedBy` | text (FK) | Reference to `users.id` |
| `notes` | text | Additional notes |
| `reason` | text | Reason for absence/late |
| `entryMethod` | text | Recording method |

**Indexes:**
- `idx_attendance_student_id` on `studentId`
- `idx_attendance_class_id` on `classId`
- `idx_attendance_date` on `date`
- `idx_attendance_student_date` on (`studentId`, `date`)
- `idx_attendance_class_date` on (`classId`, `date`)

**Common Queries:**

```typescript
// Get attendance for a student in a date range
const attendanceRecords = await db
  .select()
  .from(attendance)
  .where(and(
    eq(attendance.studentId, studentId),
    gte(attendance.date, startDate),
    lte(attendance.date, endDate)
  ));

// Get daily attendance for a class
const classAttendance = await db
  .select({
    date: attendance.date,
    status: attendance.status,
    studentName: users.name,
  })
  .from(attendance)
  .innerJoin(users, eq(attendance.studentId, users.id))
  .where(and(
    eq(attendance.classId, classId),
    eq(attendance.date, today)
  ));

// Calculate attendance percentage
const summary = await db
  .select({
    present: sql<number>`COUNT(*) FILTER (WHERE status = 'present')`,
    absent: sql<number>`COUNT(*) FILTER (WHERE status = 'absent')`,
    total: sql<number>`COUNT(*)`,
  })
  .from(attendance)
  .where(eq(attendance.studentId, studentId));
```

---

### 11. student_fees

**Purpose:** Fee records for students.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `studentId` | text (FK) | Reference to `users.id` |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `feeType` | text | `"tuition"` \| `"library"` \| `"lab"` \| `"transport"` \| `"hostel"` \| `"activity"` \| `"uniform"` \| `"exam"` \| `"sdf"` \| `"rimdro"` \| `"diary"` \| `"sports"` \| `"stationery"` |
| `amount` | integer | Total fee amount |
| `amountPaid` | integer | Amount paid |
| `amountPending` | integer | Pending amount |
| `amountWaived` | integer | Waived amount |
| `currency` | text | `"BTN"` \| `"USD"` \| `"INR"` |
| `frequency` | text | `"monthly"` \| `"quarterly"` \| `"yearly"` \| `"one-time"` |
| `dueDate` | text | Due date (ISO string) |
| `year` | integer | Academic year |
| `status` | text | `"pending"` \| `"paid"` \| `"waived"` \| `"partial"` |
| `isRecurring` | boolean | Recurring fee flag |
| `lastPaymentDate` | text | Last payment date |

**Common Queries:**

```typescript
// Get pending fees for a student
const pendingFees = await db
  .select()
  .from(studentFees)
  .where(and(
    eq(studentFees.studentId, studentId),
    isInArray(studentFees.status, ['pending', 'partial'])
  ));

// Get fee summary for a student
const feeSummary = await db
  .select({
    feeType: studentFees.feeType,
    totalAmount: studentFees.amount,
    amountPaid: studentFees.amountPaid,
    amountPending: studentFees.amountPending,
    status: studentFees.status,
  })
  .from(studentFees)
  .where(eq(studentFees.studentId, studentId));
```

---

### 12. fee_payments

**Purpose:** Payment transactions for student fees.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `studentFeeId` | text (FK) | Reference to `student_fees.id` |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `amount` | integer | Payment amount |
| `paidDate` | text | Payment date |
| `paidAt` | timestamp | Payment timestamp |
| `method` | text | `"cash"` \| `"online"` \| `"bank"` \| `"waived"` |
| `paymentMethod` | text | Alias for method |
| `transactionId` | text | Transaction/receipt ID |
| `receiptNumber` | text | Receipt number |
| `status` | text | `"pending"` \| `"paid"` \| `"failed"` |
| `notes` | text | Payment notes |

---

## Timetable & Schedule Tables

### 13. timetable_entries

**Purpose:** Class timetable schedule.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `classId` | text (FK) | Reference to `classes.id` |
| `subjectId` | text (FK) | Reference to `subjects.id` |
| `subjectName` | text | Subject name (denormalized) |
| `teacherId` | text (FK) | Reference to `users.id` |
| `teacherName` | json | Teacher name (stored as JSON) |
| `roomId` | text (FK) | Reference to `rooms.id` |
| `roomName` | json | Room name (stored as JSON) |
| `periodId` | text (FK) | Reference to `time_periods.id` |
| `periodName` | text | Period name |
| `dayOfWeek` | text | Day: `"Monday"` \| `"Tuesday"` ... |
| `startTime` | text | Period start time (HH:MM) |
| `endTime` | text | Period end time (HH:MM) |
| `isDoublePeriod` | boolean | Double period flag |

**Common Queries:**

```typescript
// Get weekly timetable for a class
const timetable = await db
  .select()
  .from(timetableEntries)
  .where(eq(timetableEntries.classId, classId))
  .orderBy(timetableEntries.dayOfWeek, timetableEntries.startTime);

// Get teacher's schedule for a day
const teacherSchedule = await db
  .select()
  .from(timetableEntries)
  .where(and(
    eq(timetableEntries.teacherId, teacherId),
    eq(timetableEntries.dayOfWeek, 'Monday')
  ))
  .orderBy(timetableEntries.startTime);
```

---

### 14. time_periods

**Purpose:** Time period definitions (periods, breaks, lunch).

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `name` | text | Period name |
| `type` | text | `"class"` \| `"break"` \| `"lunch"` |
| `startTime` | text | Start time (HH:MM) |
| `endTime` | text | End time (HH:MM) |
| `duration` | integer | Duration in minutes |
| `order` | integer | Period order |
| `isBreak` | boolean | Break period flag |
| `isActive` | boolean | Active status |

---

### 15. rooms

**Purpose:** Physical rooms in the school.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `name` | text | Room name |
| `roomNumber` | text | Room number |
| `type` | text | `"classroom"` \| `"lab"` \| `"library"` \| `"office"` \| `"hall"` \| `"other"` |
| `capacity` | integer | Seating capacity |
| `floor` | integer | Floor number |
| `building` | text | Building name |
| `hasProjector` | boolean | Has projector |
| `hasComputers` | boolean | Has computers |
| `hasSmartBoard` | boolean | Has smart board |
| `hasWhiteboard` | boolean | Has whiteboard |
| `hasAc` | boolean | Has air conditioning |
| `facilities` | json | Additional facilities |

---

### 16. class_subjects

**Purpose:** Links subjects to classes with teacher assignments.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `classId` | text (FK) | Reference to `classes.id` |
| `subjectId` | text (FK) | Reference to `subjects.id` |
| `teacherId` | text (FK) | Reference to `users.id` |
| `periodsPerWeek` | integer | Number of periods per week |
| `isCoreSubject` | boolean | Core subject flag |
| `roomId` | text (FK) | Reference to `rooms.id` |
| `isActive` | boolean | Active status |

---

## Library Tables

### 17. library_books

**Purpose:** Library book catalog.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `title` | text | Book title |
| `author` | text | Author name |
| `isbn` | text (unique) | ISBN number |
| `category` | text | `"fiction"` \| `"non-fiction"` \| `"reference"` \| `"textbook"` |
| `totalCopies` | integer | Total copies |
| `availableCopies` | integer | Available copies |
| `location` | text | Shelf location |

**Indexes:**
- `idx_library_books_school_id` on `schoolId`
- `idx_library_books_isbn` on `isbn`
- `idx_library_books_category` on `category`

---

### 18. library_members

**Purpose:** Library membership records.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `userId` | text (FK) | Reference to `users.id` |
| `memberType` | text | `"student"` \| `"teacher"` \| `"staff"` |
| `membershipNumber` | text (unique) | Membership ID |
| `membershipStatus` | text | `"active"` \| `"inactive"` \| `"suspended"` |
| `borrowingLimit` | integer | Max books allowed |
| `currentlyBorrowed` | integer | Currently borrowed count |
| `fineDue` | decimal | Outstanding fine |

---

### 19. library_circulation

**Purpose:** Book checkout/return records.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `bookId` | text (FK) | Reference to `library_books.id` |
| `memberId` | text (FK) | Reference to `library_members.id` |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `checkoutDate` | timestamp | Checkout date |
| `dueDate` | timestamp | Due date |
| `returnDate` | timestamp | Return date |
| `status` | text | `"borrowed"` \| `"returned"` \| `"overdue"` \| `"lost"` |
| `renewals` | integer | Number of renewals |
| `fine` | decimal | Fine amount |

---

## Additional Important Tables

### 20. announcements

**Purpose:** School announcements and notices.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `schoolId` | text (FK) | Reference to `schools.id` |
| `classId` | text (FK) | Reference to `classes.id` (optional) |
| `title` | text | Announcement title |
| `content` | text | Full content |
| `priority` | text | `"low"` \| `"normal"` \| `"high"` \| `"urgent"` |
| `targetAudience` | text | `"all"` \| `"students"` \| `"teachers"` \| `"parents"` \| `"staff"` |
| `publishDate` | text | Publish date |
| `expiryDate` | text | Expiry date |
| `isPinned` | boolean | Pinned announcement |
| `isPublished` | boolean | Published status |
| `authorId` | text | Author user ID |
| `authorName` | text | Author name |
| `attachments` | json | File attachments |

**Common Queries:**

```typescript
// Get active announcements for a school
const announcements = await db
  .select()
  .from(announcements)
  .where(and(
    eq(announcements.schoolId, schoolId),
    eq(announcements.isPublished, true),
    gte(announcements.expiryDate, new Date().toISOString())
  ))
  .orderBy(desc(announcements.isPinned), desc(announcements.publishDate));
```

---

### 21. exam_results_enhanced

**Purpose:** Student exam results with detailed subject breakdown.

**Key Columns:**

| Column | Type | Description |
|--------|------|-------------|
| `id` | text (PK) | Primary key |
| `studentId` | text (FK) | Reference to `users.id` |
| `examName` | text | Exam name |
| `examType` | text | `"midterm"` \| `"final"` \| `"unit_test"` \| `"board_exam"` |
| `academicYear` | text | Academic year |
| `term` | text | Term identifier |
| `examDate` | text | Exam date |
| `subjects` | json | Array of subject results |
| `totalMarks` | integer | Total marks obtained |
| `maxTotalMarks` | integer | Maximum marks |
| `percentage` | integer | Overall percentage |
| `grade` | text | Overall grade |
| `rank` | integer | Class rank |
| `classRank` | integer | Position in class |
| `isVerified` | boolean | Verification status |

---

## Important Notes

### Field Naming Conventions

1. **Primary Keys:** Always `id` (text type)
2. **Foreign Keys:** camelCase with `Id` suffix (e.g., `schoolId`, `teacherId`)
3. **Timestamps:** `createdAt`, `updatedAt` (no timezone prefix in schema)
4. **Booleans:** Prefixed with `is` (e.g., `isActive`, `isPublished`)

### Critical Query Patterns

**CRITICAL: Do NOT use `db.query` API**

```typescript
// WRONG - neon-http driver doesn't support this
const result = await db.query.users.findMany();

// CORRECT - Use select with explicit joins
const result = await db
  .select()
  .from(users)
  .where(eq(users.schoolId, schoolId));
```

**ALWAYS use camelCase for column names:**

```typescript
// CORRECT
clerkUserId
schoolId

// WRONG
clerk_id
school_id
```

### Relations Are Disabled

All Drizzle relations are disabled due to circular reference issues. Use manual joins:

```typescript
// Manual join pattern
const result = await db
  .select({
    userName: users.name,
    schoolName: schools.name,
  })
  .from(users)
  .innerJoin(schools, eq(users.schoolId, schools.id))
  .where(eq(users.type, 'student'));
```

### Indexes for Performance

The schema includes composite indexes for common query patterns:

- `idx_users_school_type` - For filtering users by school and type
- `idx_classes_school_grade` - For getting classes by school and grade
- `idx_attendance_student_date` - For attendance history queries
- `idx_enrollments_student_year` - For current enrollment lookup

---

## Schema File Organization

The main schema file (`src/lib/db/schema.ts`) includes:

1. **Core tables** - users, schools, classes, subjects
2. **Re-exported schemas** - RBAC, notifications, billing, tenancy, etc.
3. **Academic tables** - assessments, homework, attendance, fees
4. **Specialized tables** - library, transport, hostel, inventory, payroll

For detailed field information, refer to:
- `src/lib/db/schema.ts` - Main schema
- `src/lib/db/rbac-schema.ts` - Role-based access control
- `src/lib/db/billing-schema.ts` - Subscription and payments
- `src/lib/db/tenancy-schema.ts` - Multi-tenancy support

---

**Document Version:** 1.0
**Schema Version:** 2026-02-25
**Maintained By:** Development Team
