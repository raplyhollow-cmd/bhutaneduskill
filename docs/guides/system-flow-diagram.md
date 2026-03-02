# Bhutan EduSkill - Complete System Flow Diagram

```
╔════════════════════════════════════════════════════════════════════════════════╗
║                    BHUTAN EDUSKILL - SYSTEM FLOW DIAGRAM                       ║
║                              February 19, 2026                                  ║
╚════════════════════════════════════════════════════════════════════════════════╝


┌─────────────────────────────────────────────────────────────────────────────────┐
│  🌐 EXTERNAL WORLD                                                              │
│  - New visitors arrive                                                          │
│  - Existing users return                                                        │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔐 AUTHENTICATION GATE                                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Clerk Middleware (middleware.ts)                                       │   │
│  │  - Checks authentication status                                         │   │
│  │  - Handles protected routes                                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
            NOT AUTHENTICATED                 AUTHENTICATED
                    │                               │
                    ▼                               ▼
    ┌───────────────────────┐       ┌───────────────────────────────────────┐
    │   PUBLIC PAGES        │       │   /api/auth/set-role API               │
    │   - / (homepage)      │       │   ┌─────────────────────────────────┐ │
    │   - /about            │       │   │ Check users table for:           │ │
    │   - /faq              │       │   │ - clerkUserId exists?             │ │
    │   - /sign-up          │       │   │ - type field populated?           │ │
    │   - /sign-in          │       │   │ - schoolId assigned?              │ │
    │   - /calendar         │       │   │ Returns: { needsSetup, userType } │ │
    └───────────────────────┘       │   └─────────────────────────────────┘ │
                                    └───────────────────────────────────────┘
                                                            │
                                        ┌───────────────┴───────────────┐
                                        │                               │
                                    needsSetup                   needsSetup=false
                                        │                          (userType exists)
                                        ▼                               │
    ┌───────────────────────────────────────────────┐                   │
    │           🔧 SETUP WIZARD FLOW                 │                   │
    │  ┌─────────────────────────────────────────┐  │                   │
    │  │  /setup/unified (Multi-step wizard)     │  │                   │
    │  │                                         │  │                   │
    │  │  Step 1: Select Role                   │  │                   │
    │  │  ┌─────────────────────────────────┐   │  │                   │
    │  │  │ Options:                        │   │  │                   │
    │  │  │ • Student                       │   │  │                   │
    │  │  │ • Teacher                       │   │  │                   │
    │  │  │ • Parent                        │   │  │                   │
    │  │  │ • Counselor                     │   │  │                   │
    │  │  │ • School Admin                  │   │  │                   │
    │  │  └─────────────────────────────────┘   │  │                   │
    │  │           │                             │  │                   │
    │  │  Step 2: Find School (all except Ministry)│                    │
    │  │  ┌─────────────────────────────────┐   │  │                   │
    │  │  │ • Search by name/code           │   │  │                   │
    │  │  │ • Verify school.code            │   │  │                   │
    │  │  │ • Set users.schoolId            │   │  │                   │
    │  │  └─────────────────────────────────┘   │  │                   │
    │  │           │                             │  │                   │
    │  │  Step 3-4: Personal Details            │  │                   │
    │  │  ┌─────────────────────────────────┐   │  │                   │
    │  │  │ • Name, email, phone            │   │  │                   │
    │  │  │ • Grade/section (students)       │   │  │                   │
    │  │  │ • Subjects (teachers)           │   │  │                   │
    │  │  │ • Link children (parents)       │   │  │                   │
    │  │  │                                 │   │  │                   │
    │  │  │ API Call: POST /api/setup/{role} │   │  │                   │
    │  │  │ → Creates/updates users row      │   │  │                   │
    │  │  │ → Sets type, role, schoolId      │   │  │                   │
    │  │  │ → Sets onboardingComplete=true  │   │  │                   │
    │  │  └─────────────────────────────────┘   │  │                   │
    │  │           │                             │  │                   │
    │  │  Step 5: Complete → Redirect to portal  │  │                   │
    │  └─────────────────────────────────────────┘  │                   │
    └───────────────────────────────────────────────┘                   │
                    │                                                       │
                    └───────────────────────────────────┐                   │
                                                        │                   │
                                        ┌───────────────┴───────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│  🎯 PORTAL ROUTING (Based on user.type)                                          │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  userType from database determines portal:                              │   │
│  │                                                                          │   │
│  │  "student"    → /student/*                                               │   │
│  │  "teacher"    → /teacher/*                                               │   │
│  │  "parent"     → /parent/*                                                │   │
│  │  "counselor"  → /counselor/*                                             │   │
│  │  "school_admin" → /school-admin/*                                        │   │
│  │  "admin"      → /admin/*                                                 │   │
│  │  "ministry"   → /ministry/*                                              │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
                                        │
        ┌───────────────┬───────────────┼───────────────┬───────────────┐
        │               │               │               │               │
        ▼               ▼               ▼               ▼               ▼

╔═══════════════════════════════════════╦═══════════════════════════════════════╗
║          STUDENT PORTAL (42 routes)    ║      TEACHER PORTAL (17 routes)         ║
║  ┌─────────────────────────────────┐  ║  ┌─────────────────────────────────┐  ║
║  │ /student (dashboard)             │  ║  │ /teacher (dashboard)             │  ║
║  │ /student/classes                 │  ║  │ /teacher/classes                 │  ║
║  │ /student/homework                │  ║  │ /teacher/students                │  ║
║  │ /student/results                 │  ║  │ /teacher/homework/create         │  ║
║  │ /student/assessment              │  ║  │ /teacher/assessments             │  ║
║  │   /riasec                        │  ║  │ /teacher/schedule                │  ║
║  │   /mbti                          │  ║  │ /teacher/reports                 │  ║
║  │   /disc                          │  ║  │ /teacher/attendance              │  ║
║  │ /student/careers                 │  ║  │ /teacher/earnings                │  ║
║  │ /student/roadmap                 │  ║  └─────────────────────────────────┘  ║
║  │ /student/journal                 │  ║                                       ║
║  │ /student/progress                │  ║  ⚠ ISSUE: Dashboard shows placeholder║
║  │ /student/fees                    │  ║           data, not real queries      ║
║  │ /student/attendance              │  ║                                       ║
║  │ /student/rub/predictor           │  ║                                       ║
║  │ /student/scholarships            │  ║                                       ║
║  └─────────────────────────────────┘  ║                                       ║
║                                       ║                                       ║
║  ⚠ ISSUE: Assessment results not    ║                                       ║
║     connected to career suggestions  ║                                       ║
╠═══════════════════════════════════════╩═══════════════════════════════════════╣
║        PARENT PORTAL (15 routes)            COUNSELOR PORTAL (12 routes)         ║
║  ┌─────────────────────────────────┐  ║  ┌─────────────────────────────────┐  ║
║  │ /parent (dashboard)              │  ║  │ /counselor (dashboard)            │  ║
║  │ /parent/children                 │  ║  │ /counselor/students               │  ║
║  │ /parent/attendance               │  ║  │ /counselor/sessions               │  ║
║  │ /parent/homework                 │  ║  │ /counselor/interventions          │  ║
║  │ /parent/assessments              │  ║  │ /counselor/resources              │  ║
║  │ /parent/progress                 │  ║  │ /counselor/notes                  │  ║
║  │ /parent/fees/pay                 │  ║  │ /counselor/reports                │  ║
║  │ /parent/report-cards             │  ║  └─────────────────────────────────┘  ║
║  └─────────────────────────────────┘  ║                                       ║
║                                       ║                                       ║
║  ⚠ ISSUE: Can't see child's detailed  ║  ⚠ ISSUE: Can't access student       ║
║     assessment breakdown              ║     homework/performance data         ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║     SCHOOL ADMIN PORTAL (36 routes)              ADMIN PORTAL (24 routes)        ║
║  ┌─────────────────────────────────┐  ║  ┌─────────────────────────────────┐  ║
║  │ /school-admin (dashboard)       │  ║  │ /admin (dashboard)               │  ║
║  │ /school-admin/students/create   │  ║  │ /admin/schools                   │  ║
║  │ /school-admin/teachers/create   │  ║  │ /admin/users                     │  ║
║  │ /school-admin/classes/create    │  ║  │ /admin/roles                     │  ║
║  │ /school-admin/timetable         │  ║  │ /admin/analytics                 │  ║
║  │ /school-admin/fees              │  ║  │ /admin/billing                   │  ║
║  │ /school-admin/attendance        │  ║  │ /admin/content/colleges          │  ║
║  │ /school-admin/report-cards      │  ║  │ /admin/careers                   │  ║
║  │ /school-admin/payroll           │  ║  │ /admin/notifications              │  ║
║  └─────────────────────────────────┘  ║  └─────────────────────────────────┘  ║
╠═════════════════════════════════════════════════════════════════════════════════╣
║              MINISTRY PORTAL (6 routes)                                          ║
║  ┌─────────────────────────────────┐                                            ║
║  │ /ministry (dashboard)           │   ⚠ No schoolId (national level)         ║
║  │ /ministry/schools               │                                            ║
║  │ /ministry/analytics             │                                            ║
║  │ /ministry/policies              │                                            ║
║  └─────────────────────────────────┘                                            ║
╚═════════════════════════════════════════════════════════════════════════════════╝



┌─────────────────────────────────────────────────────────────────────────────────┐
│  🗄️ DATABASE LAYER (PostgreSQL via Neon)                                        │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                                                                          │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐    │   │
│  │  │ users (CORE TABLE)                                              │    │   │
│  │  │ • id, clerkUserId, type, role                                   │    │   │
│  │  │ • name, email, phone                                            │    │   │
│  │  │ • schoolId (FK → schools.id)                                    │    │   │
│  │  │ • grade, section (students)                                      │    │   │
│  │  │ • parentId (FK → users.id for parent-child)                      │    │   │
│  │  │ • subjects (JSON string)                                         │    │   │
│  │  └─────────────────────────────────────────────────────────────────┘    │   │
│  │                              │                                            │   │
│  │                              ├─ has many ─────────────────────────────┐    │   │
│  │                              │                                      │    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │    │   │
│  │  │ schools                                                        │   │    │   │
│  │  │ • id, name, code (unique)                                     │   │    │   │
│  │  │ • type: public|private|international                          │   │    │   │
│  │  │ • address, city, districtId                                   │   │    │   │
│  │  │ • tenantId (multi-tenancy)                                    │   │    │   │
│  │  └─────────────────────────────────────────────────────────────┘   │    │   │
│  │                              │                                        │    │   │
│  │                              ├─ has many ─────────────────────┐       │    │   │
│  │                              │                              │       │    │   │
│  │  ┌─────────────────────────────────────────────────────┐      │    │    │   │
│  │  │ classes                                               │      │    │    │   │
│  │  │ • id, schoolId (FK), name                             │      │    │    │   │
│  │  │ • grade, section                                      │      │    │    │   │
│  │  │ • teacherId, homeroomTeacherId (FK → users.id)        │      │    │    │   │
│  │  │ • students (JSON array)                                │      │    │    │   │
│  │  └─────────────────────────────────────────────────────┘      │    │    │   │
│  │                              │                              │       │    │   │
│  │                              ├─ has many ──────────────────┘       │    │   │
│  │                              │                                     │    │   │
│  │  ┌─────────────────────────────────────────────────────┐         │    │   │
│  │  │ assessments (student assessments)                     │         │    │   │
│  │  │ • id, classId (FK), type (riasec|mbti|disc)          │         │    │   │
│  │  │ • userId (FK → users.id)                             │         │    │   │
│  │  │ • results (JSON)                                      │         │    │   │
│  │  └─────────────────────────────────────────────────────┘         │    │   │
│  │                                                                      │    │   │
│  │  ┌─────────────────────────────────────────────────────┐         │    │   │
│  │  │ homework                                               │         │    │   │
│  │  │ • id, classId (FK), title                             │         │    │   │
│  │  │ • teacherId (FK → users.id)                           │         │    │   │
│  │  │ • dueDate, totalPoints                                │         │    │   │
│  │  └─────────────────────────────────────────────────────┘         │    │   │
│  │                                                                      │    │   │
│  │  ┌─────────────────────────────────────────────────────┐         │    │   │
│  │  │ attendance_records                                    │         │    │   │
│  │  │ • id, studentId (FK), classId (FK)                    │         │    │   │
│  │  │ • date, status (present|absent|late)                  │         │    │   │
│  │  └─────────────────────────────────────────────────────┘         │    │   │
│  │                                                                      │    │   │
│  │  RBAC Tables:                                                        │    │   │
│  │  ┌─────────────────────────────────────────────────────┐         │    │   │
│  │  │ roles • permissions • role_permissions              │         │    │   │
│  │  │ user_roles • component_access                        │         │    │   │
│  │  └─────────────────────────────────────────────────────┘         │    │   │
│  │                                                                      │    │   │
│  └───────────────────────────────────────────────────────────────────┘   │   │
└─────────────────────────────────────────────────────────────────────────────┘



┌─────────────────────────────────────────────────────────────────────────────────┐
│  🔗 API LAYER (148 endpoints)                                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  Authentication & Setup                                                 │   │
│  │  • POST /api/auth/set-role                                             │   │
│  │  • POST /api/setup/{student|teacher|parent|counselor|admin|ministry}   │   │
│  │                                                                          │   │
│  │  Student APIs (22)   • /api/student/*                                   │   │
│  │  Teacher APIs (10)   • /api/teacher/*                                   │   │
│  │  Parent APIs (8)     • /api/parent/*                                    │   │
│  │  Counselor APIs (10) • /api/counselor/*                                 │   │
│  │  School Admin (35)  • /api/school-admin/*                              │   │
│  │  Admin APIs (32)     • /api/admin/*                                     │   │
│  │  Ministry APIs (7)   • /api/ministry/*                                  │   │
│  │  AI Services (8)     • /api/ai/*                                        │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘



┌─────────────────────────────────────────────────────────────────────────────────┐
│  ⚠ IDENTIFIED CONNECTION PROBLEMS                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │  1. DATA SILOS                                                          │   │
│  │     • Assessment results → NOT linked to career suggestions              │   │
│  │     • Homework grades → NOT reflected in progress reports                │   │
│  │     • Attendance → NOT connected to report cards                        │   │
│  │                                                                          │   │
│  │  2. MISSING CROSS-PORTAL LINKS                                          │   │
│  │     • Teacher can't view student's career profile                       │   │
│  │     • Parent can't see detailed assessment breakdown                    │   │
│  │     • Counselor can't access homework performance                       │   │
│  │                                                                          │   │
│  │  3. DASHBOARD PLACEHOLDER DATA                                          │   │
│  │     • Student dashboard AI insights → Mock data                         │   │
│  │     • Teacher class statistics → Not real                               │   │
│  │     • Parent child data → Placeholders                                  │   │
│  │                                                                          │   │
│  │  4. NO GLOBAL USER CONTEXT                                              │   │
│  │     • Each page fetches user independently                              │   │
│  │     • Role checks duplicated everywhere                                 │   │
│  │     • No centralized state management                                   │   │
│  │                                                                          │   │
│  │  5. INCOMPLETE TODO ITEMS (20+)                                         │   │
│  │     • /api/files/upload - File upload not working                       │   │
│  │     • /api/student/insights - AI insights not implemented               │   │
│  │     • report-cards.ts - Report generation not complete                  │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```