# Student Portal - Atomic Level Flow Documentation

**Portal**: Student
**Base Path**: `/student`
**Role**: `student`

---

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /student                                     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Server Layout (layout.tsx)                                    │
│    - requireAuth([]) - no role check needed                      │
│    - Checks Clerk authentication                                  │
│    - If no DB record → /setup/unified                            │
│    - If wrong role → redirect to correct portal                  │
│    - If onboarding incomplete → onboarding flow                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Client Layout (student-layout-client.tsx)                     │
│    - Setup real-time event listeners:                            │
│      * private-school-{schoolId}                                 │
│      * private-user-{userId}                                     │
│    - Events listened to:                                         │
│      * homework.graded → refresh dashboard                        │
│      * attendance.checked_in → refresh dashboard                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Dashboard Renders                                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Dashboard Data Flow

### API Calls on Mount (Parallel)

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. fetchStudentDashboard()                                       │
│    Location: src/app/student/_actions.ts                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. getStudentDashboardData()                                     │
│    Location: src/lib/api/student.ts                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Database Queries (Parallel):                                  │
│                                                                  │
│    -- Student profile                                            │
│    SELECT id, firstName, lastName, schoolName,                   │
│           classGrade, section, classTeacherName                  │
│    FROM users WHERE id = ?                                       │
│                                                                  │
│    -- Class enrollment                                           │
│    SELECT c.* FROM classes c                                     │
│    JOIN class_enrollments ce ON c.id = ce.classId                │
│    WHERE ce.studentId = ? AND ce.status = 'active'               │
│                                                                  │
│    -- Homework (pending/graded)                                  │
│    SELECT h.*, hs.status, hs.submittedAt, hs.gradedAt            │
│    FROM homework h                                                │
│    JOIN class_enrollments ce ON h.classId = ce.classId           │
│    LEFT JOIN homeworkSubmissions hs ON                           │
│           h.id = hs.homeworkId AND hs.studentId = ?             │
│    WHERE ce.studentId = ?                                        │
│      AND (hs.status = 'pending' OR hs.status IS NULL)            │
│                                                                  │
│    -- Assessments completed                                       │
│    SELECT COUNT(*) FROM assessmentResults WHERE userId = ?        │
│                                                                  │
│    -- Attendance rate                                            │
│    SELECT                                                         │
│      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) present,│
│      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) absent,  │
│      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) late,     │
│      COUNT(*) as total                                           │
│    FROM attendance WHERE studentId = ?                           │
│                                                                  │
│    -- Achievements (XP-based)                                    │
│    SELECT * FROM achievements WHERE userId = ? ORDER BY earnedAt  │
│                                                                  │
│    -- Upcoming deadlines                                         │
│    SELECT h.* FROM homework h                                    │
│    JOIN class_enrollments ce ON h.classId = ce.classId           │
│    WHERE ce.studentId = ? AND h.dueDate > NOW()                  │
│    ORDER BY h.dueDate ASC LIMIT 5                                │
│                                                                  │
│    -- Career matches                                              │
│    SELECT * FROM career_matches WHERE userId = ?                  │
│    ORDER BY matchScore DESC LIMIT 5                              │
│                                                                  │
│    -- Fee status                                                  │
│    SELECT * FROM student_fees WHERE studentId = ?                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Assessment Status Check                                        │
│    GET /api/student/assessment-status                             │
│    → If incomplete → redirect to assessment                      │
└─────────────────────────────────────────────────────────────────┘
```

### XP Calculation

```
Assessment completion: 50 points each
Homework graded: 25 points each
Module completion: 100 points each
Attendance: Math.floor(rate * 2) points
```

---

## Homework Flow

### View Homework Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /student/homework                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. fetchStudentHomework()                                        │
│    - getStudentHomework()                                        │
│    - Queries homework + submissions with status filter          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Filter Options:                                               │
│    - all: All homework                                           │
│    - pending: Not submitted                                     │
│    - submitted: Submitted, not graded                            │
│    - graded: Graded submissions                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Homework Card Displays:                                       │
│    - Title, subject, class                                       │
│    - Due date (with overdue indicator)                           │
│    - Status badge                                                │
│    - Grade (if graded)                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Homework Detail Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks homework item → /student/homework/[id]            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Fetch homework details                                         │
│    - Check if student has submission                             │
│    - Display: due date, status, grade, feedback                   │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. If not submitted: Show submit button                          │
│    If submitted: Show submission status + grade                  │
└─────────────────────────────────────────────────────────────────┘
```

### Submit Homework Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Submit Homework"                                  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Submit Modal Opens                                            │
│    - Text input for answer                                       │
│    - File upload for attachments                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. User submits: submitHomework() server action                   │
│    Location: src/app/student/_actions.ts                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Check existing submission                                     │
│    SELECT * FROM homeworkSubmissions                             │
│    WHERE homeworkId = ? AND studentId = ?                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Create or update submission                                   │
│    INSERT INTO homeworkSubmissions (                             │
│      homeworkId, studentId, content, attachments,                │
│      submittedAt, isLate, status                                 │
│    ) VALUES (?, ?, ?, ?, NOW(), ?, 'submitted')                 │
│                                                                  │
│    OR (if resubmitting):                                         │
│    UPDATE homeworkSubmissions SET                                │
│      content = ?, attachments = ?,                               │
│      resubmittedAt = NOW(), status = 'submitted'                 │
│    WHERE homeworkId = ? AND studentId = ?                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Broadcast to teacher:                                         │
│    broadcastHomeworkSubmitted(classId, {                         │
│      id, homeworkId, homeworkTitle,                              │
│      studentId, studentName,                                     │
│      submittedAt, isLate                                         │
│    })                                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. UI Update:                                                    │
│    - Status updated to "submitted"                               │
│    - Success toast                                               │
└─────────────────────────────────────────────────────────────────┘
```

### View Feedback Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /student/homework/[id]/feedback             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GET /api/student/homework/[id]/feedback                       │
│    - Query homeworkSubmissions for student's submission          │
│    - Query homework for assignment details                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Display:                                                      │
│    - Score/grade                                                 │
│    - Teacher feedback                                            │
│    - Correct answers (toggle visibility)                          │
│    - Download PDF option                                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Assessment Flow

### Assessment Catalog Flow

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /student/assessment                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Fetch 5 assessment types (Parallel API calls):                │
│    - GET /api/assessments/mbti (50 questions)                    │
│    - GET /api/assessments/riasec (18 questions)                  │
│    - GET /api/assessments/disc (24 questions)                    │
│    - GET /api/assessments/work-values (30 questions)             │
│    - GET /api/assessments/learning-styles (20 questions)         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Each assessment tracks:                                       │
│    - Completion status (completed/not_started)                   │
│    - Result if completed                                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Progress calculation:                                        │
│    progress = (completed / 5) * 100                             │
└─────────────────────────────────────────────────────────────────┘
```

### Taking Assessment - RIASEC Example

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Take RIASEC Assessment"                           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Load 18 questions                                            │
│    - Each question has 5 options (Strongly Disagree → Agree)     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Answer Flow:                                                  │
│    - handleAnswer(value) → update answers state                  │
│    - Auto-advance after 300ms delay                             │
│    - Update progress bar: (answered / total) * 100              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. On completion: calculateAndSaveResults()                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Calculate Category Scores:                                    │
│    R (Realistic): sum of R questions                             │
│    I (Investigative): sum of I questions                         │
│    A (Artistic): sum of A questions                              │
│    S (Social): sum of S questions                                │
│    E (Enterprising): sum of E questions                          │
│    C (Conventional): sum of C questions                          │
│                                                                  │
│    Normalize each to 0-100 scale                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Generate Holland Code:                                        │
│    - Sort categories by score (descending)                       │
│    - Take top 3 categories                                      │
│    - Example: "ISA" (Investigative, Social, Artistic)           │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Save to Database:                                             │
│    POST /api/assessments/riasec                                  │
│    Body: {                                                       │
│      userId,                                                     │
│      hollandCode,                                               │
│      scores: { R, I, A, S, E, C },                              │
│      completedAt                                                 │
│    }                                                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Update assessment status in database                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 9. Display Results:                                              │
│    - Holland Code prominently displayed                           │
│    - Score breakdown with progress bars                          │
│    - Trait descriptions for top 3 categories                     │
│    - Action buttons: View Careers, Retake                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Career Matches Flow

### Load Career Matches

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User navigates to /student/careers                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. GET /api/student/career-matches                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Database Query:                                               │
│    -- User grade and interests                                   │
│    SELECT grade, interests FROM users WHERE id = ?               │
│                                                                  │
│    -- Student skills                                             │
│    SELECT category, level FROM studentSkills WHERE userId = ?     │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. Generate matches based on skill categories:                   │
│    - Technical: Software Developer, Data Analyst, IT Specialist  │
│    - Creative: Graphic Designer, Content Writer, Artist         │
│    - Service: Healthcare Professional, Teacher, Social Worker   │
│    - Business: Accountant, Marketing Manager, Entrepreneur      │
│    - Science: Research Scientist, Lab Technician, Analyst       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Sort by match score (highest first)                           │
│    Return top 5 matches                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Career Actions

```
┌─────────────────────────────────────────────────────────────────┐
│ SAVE/UNSAVE Career:                                              │
│  POST /api/saved-careers                                         │
│  Body: { careerId, action: "save" | "unsave" }                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ VIEW CAREER DETAILS:                                             │
│  /student/careers/[slug]                                         │
│  - Description                                                   │
│  - Required skills                                              │
│  - Education requirements                                        │
│  - Salary range                                                 │
│  - Related careers                                              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Learning Modules Flow

### Browse Modules

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. GET /api/student/modules                                      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Query learning_modules table                                  │
│    - Filter by enrolled status                                  │
│    - Show progress for enrolled modules                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Module Card Displays:                                         │
│    - Subject, difficulty, tutor                                 │
│    - Enrollment count, rating                                    │
│    - Progress bar (if enrolled)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Enroll in Module

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User clicks "Enroll" on module                                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. POST /api/student/modules/enroll                              │
│    Body: { moduleId }                                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Update:                                                       │
│    UPDATE module_enrollments SET                                │
│      isEnrolled = true, progress = 0, enrolledAt = NOW()        │
│    WHERE moduleId = ? AND studentId = ?                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. UI Update:                                                    │
│    - "Enroll" button changes to "Continue"                       │
│    - Progress bar appears at 0%                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Module Completion

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. User completes module lessons                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Update progress via API calls                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. At 100% progress:                                             │
│    - Generate certificate                                       │
│    - Award 100 XP points                                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Real-time Events

### Subscribed Channels

```
private-school-{schoolId}
  - homework.graded
  - dashboard.stats_updated
  - attendance.updated

private-user-{userId}
  - homework.graded
  - attendance.checked_in
```

### Broadcast Events

```
broadcastHomeworkSubmitted(classId, {
  id, homeworkId, homeworkTitle,
  studentId, studentName,
  submittedAt, isLate
})

broadcastAttendanceUpdated(schoolId, {
  studentId, studentName,
  classId, date, status, checkInTime
})
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/student/dashboard` | GET | Dashboard data |
| `/api/student/homework` | GET | Homework list |
| `/api/student/homework/[id]/feedback` | GET | Homework feedback |
| `/api/assessments/riasec` | GET/POST | RIASEC assessment |
| `/api/assessments/mbti` | GET/POST | MBTI assessment |
| `/api/assessments/disc` | GET/POST | DISC assessment |
| `/api/assessments/work-values` | GET/POST | Work values assessment |
| `/api/assessments/learning-styles` | GET/POST | Learning styles assessment |
| `/api/student/career-matches` | GET | Career matches |
| `/api/student/modules` | GET | Learning modules |
| `/api/student/modules/enroll` | POST | Enroll in module |
| `/api/student/results` | GET | Exam results |
| `/api/student/classes` | GET | Student classes |
| `/api/student/fees` | GET | Fee status |

---

**End of Student Portal Flow Documentation**
