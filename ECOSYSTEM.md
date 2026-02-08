# Career Guidance Platform - Complete Ecosystem Documentation

## Platform Overview

This is a multi-tenant career guidance platform for Bhutan that serves students, teachers, parents, counselors, and platform administrators.

## User Types & Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                    PLATFORM (Company/Admin)                      │
│                         /             \                           │
│           ┌─────────────┴─────────────┐                           │
│           │      Tenant (School)      │                           │
│           └─────────────┬─────────────┘                           │
│      ┌──────────────────┼──────────────────┐                      │
│      │                 │                  │                       │
│  ┌───▼────┐      ┌────▼─────┐     ┌─────▼────┐                 │
│  │ Student │◄────┤  Teacher  │     │ Counselor │                 │
│  └────┬───┘      └────┬─────┘     └─────┬────┘                 │
│       │               │                  │                       │
│       └───────────┬───┘                  │                       │
│                   │                      │                       │
│              ┌────▼─────┐                │                       │
│              │  Parent  │◄───────────────┘                       │
│              └──────────┘                                       │
└─────────────────────────────────────────────────────────────────┘
```

## User Roles & Access

| Role | Portal | Routes | Data Access | Key Features |
|------|--------|--------|-------------|--------------|
| **Student** | `/student/*` | Own data only | Their assessments, plans, journal | Take assessments, view careers, create plans |
| **Teacher** | `/teacher/*` | Class students | Their class data | View student progress, assign assessments |
| **Parent** | `/parent/*` | Children only | Linked students | View child progress, consent management |
| **Counselor** | `/counselor/*` | School students | School/all assigned | Student interventions, sessions, notes |
| **Admin** | `/admin/*` | All platform data | Everything | School/user management, analytics, settings |

## Route Structure

```
/ (root)
├── /sign-in (Clerk auth)
├── /sign-up
│
├── /student/* (Student Portal)
│   ├── /dashboard (overview)
│   ├── /assessments (take assessments)
│   ├── /careers (explore careers)
│   ├── /plan (career planning)
│   ├── /journal (learning journal)
│   ├── /skills (skill development)
│   └── /profile (settings)
│
├── /teacher/* (Teacher Portal)
│   ├── /dashboard (class overview)
│   ├── /classes (manage classes)
│   ├── /students (view student progress)
│   ├── /assessments (assign/grade)
│   └── /reports (class analytics)
│
├── /parent/* (Parent Portal)
│   ├── /dashboard (children overview)
│   ├── /children/[id] (child progress)
│   ├── /careers (child's career matches)
│   ├── /consent (manage consents)
│   └── /communications (messages)
│
├── /counselor/* (Counselor Portal)
│   ├── /dashboard (student overview)
│   ├── /students (assigned students)
│   ├── /sessions (counseling sessions)
│   ├── /notes (counselor notes)
│   ├── /interventions (at-risk students)
│   └── /reports (analytics)
│
└── /admin/* (Admin Portal)
    ├── /dashboard (platform overview)
    ├── /schools (manage schools)
    ├── /users (manage all users)
    ├── /tenants (tenant management)
    ├── /assessments (assessment types)
    ├── /careers (career database)
    └── /settings (platform settings)
```

## API Endpoints Structure

```
/api/
├── /auth/* (authentication via Clerk)
├── /student/* (student-only endpoints)
├── /teacher/* (teacher-only endpoints)
├── /parent/* (parent-only endpoints)
├── /counselor/* (counselor-only endpoints)
├── /admin/* (admin-only endpoints)
└── /shared/* (common endpoints with role-based filtering)
```

## Data Access Rules

```typescript
// Student: Can only access own data
if (user.type === 'student') {
  whereClause = eq(table.userId, user.id);
}

// Teacher: Can access class students
if (user.type === 'teacher') {
  const classStudents = await getClassStudents(user.classId);
  whereClause = inArray(table.userId, classStudents);
}

// Parent: Can access linked children
if (user.type === 'parent') {
  const children = await getChildren(user.id);
  whereClause = inArray(table.userId, children);
}

// Counselor: Can access school students
if (user.type === 'counselor') {
  whereClause = eq(table.schoolId, user.schoolId);
}

// Admin: Can access all data
if (user.type === 'admin') {
  whereClause = undefined; // no filter
}
```

## Key Features by User Type

### Student Features
- ✅ Take personality/interest assessments
- ✅ View personalized career matches
- ✅ Create career plans with goals
- ✅ Track learning progress in journal
- ✅ Save favorite careers
- ✅ Explore RUB colleges and scholarships
- ✅ View skill development roadmap

### Teacher Features
- ✅ View class roster and student info
- ✅ Assign assessments to students
- ✅ View student assessment results
- ✅ Track student progress
- ✅ Generate class reports
- ✅ Manage class schedules

### Parent Features
- ✅ View child's assessment results
- ✅ See child's career matches
- ✅ Track child's progress
- ✅ Provide consent for activities
- ✅ Receive counselor communications
- ✅ Access resources for parents

### Counselor Features
- ✅ View assigned students
- ✅ Track student indecision metrics
- ✅ Schedule counseling sessions
- ✅ Add counselor notes
- ✅ Generate intervention reports
- ✅ Access analytics dashboard
- ✅ Manage student career plans

### Admin Features
- ✅ Manage schools and tenants
- ✅ Create/manage user accounts
- ✅ Configure assessment types
- ✅ Manage career database
- ✅ View platform analytics
- ✅ Configure system settings
- ✅ Generate platform reports

## Authentication Flow

```
1. User visits / or /sign-in
2. Redirected to Clerk authentication
3. After auth, middleware checks user type
4. Redirected to appropriate portal:
   - student → /student/dashboard
   - teacher → /teacher/dashboard
   - parent → /parent/dashboard
   - counselor → /counselor/dashboard
   - admin → /admin/dashboard
```

## Multi-Tenancy Architecture

```
Platform (Company)
├── Tenant 1 (School A)
│   ├── Users (students, teachers, counselors)
│   ├── Classes
│   ├── Assessments
│   └── Career Plans
├── Tenant 2 (School B)
│   ├── Users
│   ├── Classes
│   └── ...
└── Tenant 3 (School C)
    └── ...
```

Each tenant has:
- Isolated data (tenantId filtering)
- Separate user pools
- Independent assessments and plans
- School-specific settings

## Color Scheme (Bhutan Theme)

Primary: Hunter Green (#557e4e)
Secondary: Powder Blue (#3c89c3)
Accent: Oxidized Iron (#d5472a)
Muted: Ash Grey (#e3e9e2)
Destructive: Lobster Pink (#cb3c34)

## CRUD Operations Needed

| Entity | Create | Read | Update | Delete |
|--------|--------|------|--------|--------|
| Users | Admin | All | Admin/Own | Admin |
| Classes | Teacher | Teacher's | Teacher | Admin |
| Assessments | Student | Own/Assigned | Results only | - |
| Career Plans | Student/Counselor | Own/Assigned | Own/Assigned | Own |
| Journal Entries | Student | Own | Own | Own |
| Counselor Notes | Counselor | Own | Own | Own |
| Exam Results | Teacher/Student | Based on role | Teacher/Student | Admin |
| Careers | Admin | All | Admin | Admin |
| Schools | Admin | All | Admin | Admin |

## Implementation Status

- ✅ Database schema with all tables
- ✅ Assessment types (RIASEC, MBTI, DISC, Work Values, Learning Styles)
- ✅ Basic API endpoints for all entities
- ✅ Bhutan color palette
- ⏳ Role-based routing middleware
- ⏳ Separate portal layouts
- ⏳ CRUD operations on UI components
- ⏳ Admin portal
