# Bhutan EduSkill - Production Readiness Plan

**Date:** February 14, 2026
**Status:** Ready for Implementation

---

## Table of Contents
1. [Critical Issues Summary](#critical-issues-summary)
2. [How This Project Works (Technical Flow)](#how-this-project-works-technical-flow)
3. [Implementation Plan](#implementation-plan)
4. [Success Criteria](#success-criteria)

---

## Critical Issues Summary

### User's Feedback (What Needs to be Fixed)
- Sign-in page shows "Sign in to CLERK" → Should be "Sign in to BHUTAN EDUSKILL"
- Project name/title needs changing everywhere → "BHUTAN EDUSKILL"
- Sign-in should NOT show portal selector cards → Just clean sign-in page
- Modals are broken - transparent dropdowns, old design
- Dashboard not mobile-friendly
- No mobile template for all portals
- Portal dashboards don't show user name
- "Google AI is simply for show" - AI doesn't actually work
- Clicking portal goes to setup directly - Should ask for sign-in first

---

## How This Project Works (Technical Flow)

### Overview: The Complete User Journey

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    BHUTAN EDUSKILL - TECHNICAL FLOW                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  PUBLIC PAGES                    AUTH FLOW         ONBOARDING               │
│  ────────────                    ─────────         ──────────               │
│  ┌─────────────┐                 ┌──────┐         ┌─────────────┐          │
│  │ Homepage    │ ──────sign-in──→│ Clerk│ ──────→│ Setup       │          │
│  │ (Portal     │                 │ Auth │         │ Wizard      │          │
│  │  Cards)     │                 └──────┘         │ (5 steps)   │          │
│  └─────────────┘                                   └─────────────┘          │
│       │                                                 │                   │
│       │                                                 │                   │
│       ▼                                                 ▼                   │
│  ┌─────────────┐                                  ┌─────────────┐          │
│  │ Sign-in     │                                  │ Portal      │          │
│  │ Page        │                                  │ Dashboard  │          │
│  │ (Clean)     │                                  └─────────────┘          │
│  └─────────────┘                                         │                   │
│                                                          │                   │
│                                                          ▼                   │
│                                                     ┌─────────────┐          │
│                                                     │ Features    │          │
│                                                     │ (Assessments│          │
│                                                     │  Homework,  │          │
│                                                     │  Attendance)│          │
│                                                     └─────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Authentication Flow (Step-by-Step)

#### Files Involved:
- **Frontend:** `src/app/sign-in/[[...sign-in]]/page.tsx`, `src/app/sign-up/[[...sign-up]]/page.tsx`
- **API:** `src/app/api/auth/set-role/route.ts`
- **Database:** `users` table in PostgreSQL via Neon

#### Step-by-Step Flow:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Visits Sign-In Page                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ URL: /sign-in                                                             │
│ Component: Clerk SignIn (customizable)                                    │
│ Expected: Clean page with "Sign in to Bhutan EduSkill" header            │
│                                                                            │
│ CURRENT STATE (BROKEN):                                                   │
│ - Shows "Sign in to CLERK"                                               │
│ - Has portal selector cards (should be removed)                           │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Clerk Authentication                                              │
├──────────────────────────────────────────────────────────────────────────┤
│ - User enters email/password OR uses Google OAuth                         │
│ - Clerk verifies credentials                                              │
│ - Clerk returns a userId (clerkUserId)                                    │
│ - User is authenticated in Clerk system                                  │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Check Local Database (set-role API)                              │
├──────────────────────────────────────────────────────────────────────────┤
│ API: GET /api/auth/set-role                                               │
│                                                                            │
│ Query: SELECT * FROM users WHERE clerk_user_id = {clerkUserId}           │
│                                                                            │
│ Possible Results:                                                         │
│ 1. User NOT found → { userType: null, needsSetup: true }                 │
│ 2. User found → { userType: "student", schoolId: "xyz", ... }            │
│                                                                            │
│ ALSO SETS: Cookie "userType" for middleware                              │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┴─────────────────┐
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────────┐           ┌───────────────────────┐
        │ User NOT in Database  │           │ User EXISTS in DB     │
        └───────────────────────┘           └───────────────────────┘
                    │                                       │
                    ▼                                       ▼
        ┌───────────────────────┐           ┌───────────────────────┐
        │ Redirect to           │           │ Redirect to Portal    │
        │ /setup/{userType}     │           │ Dashboard             │
        │ (Onboarding Wizard)   │           │                       │
        └───────────────────────┘           └───────────────────────┘
```

---

### 2. Onboarding/Setup Wizard Flow

#### Files Involved:
- **Frontend:** `src/app/setup/[portal]/page.tsx` (e.g., `/setup/student`)
- **API:** `src/app/api/setup/[portal]/route.ts`, `src/app/api/setup/complete/route.ts`
- **Database:** `users` table, `wizardProgress` table

#### Student Wizard - 5 Steps:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SETUP WIZARD: Student Example                                            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐        │
│  │ STEP 1  │→│ STEP 2  │→│ STEP 3  │→│ STEP 4  │→│ STEP 5  │        │
│  │ Find    │  │ Personal│  │ Academic│  │ Guardian│  │ Complete│        │
│  │ School  │  │ Details │  │ Details │  │ Info    │  │         │        │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘  └─────────┘        │
│       │            │            │            │            │               │
│       ▼            ▼            ▼            ▼            ▼               │
│   School      Full Name    Class/Grade   Parent       Welcome            │
│   Code        DOB          Section       Phone        Go to              │
│   Lookup      Gender       Roll          Email        Dashboard          │
│               Blood Group  Year          Address                         │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Data Saving Process:

```
User submits wizard form
        │
        ▼
POST /api/setup/student
        │
        ├─── Save to wizardProgress table (tracks current step)
        │    {
        │      userId: "user-123",
        │      currentStep: "2",
        │      data: { personalDetails: {...}, ... }
        │    }
        │
        ├─── Update users table
        │    UPDATE users SET
        │      firstName = 'John',
        │      lastName = 'Doe',
        │      classGrade = 10,
        │      section = 'A'
        │    WHERE id = 'user-123'
        │
        └─── Return { success: true }
```

#### Setup Completion:

```
POST /api/setup/complete
        │
        ├─── Mark onboardingComplete = true in users table
        │
        └─── Redirect to /student?welcome=true
```

---

### 3. Portal Layout Authentication Pattern

#### Files Involved:
- **Layout:** `src/app/[portal]/layout.tsx` (student, teacher, parent, counselor, school-admin, admin)
- **Component:** `src/components/shared/portal-sidebar.tsx`

#### Layout Flow (All 6 Portals):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Portal Layout Renders on Every Page Visit                                │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  1. Check: Is user authenticated? (Clerk)                                 │
│     NO → Redirect to /sign-in                                             │
│     YES → Continue                                                         │
│                                                                            │
│  2. Check: Does user exist in database?                                   │
│     API: GET /api/auth/set-role                                           │
│     GET /api/user/profile                                                 │
│                                                                            │
│     User NOT found → needsSetup = true → Redirect to /setup/[portal]     │
│     User found → Load userType, userName, schoolId                        │
│                                                                            │
│  3. Render:                                                               │
│     ┌─────────────┐  ┌─────────────────────────────────────────┐         │
│     │   Sidebar   │  │  Header with User Name                   │         │
│     │   (256px)   │  │  ──────────────────────────               │         │
│     │             │  │                                         │         │
│     │  • Home     │  │  [Page Content]                          │         │
│     │  • Classes  │  │                                         │         │
│     │  • Homework │  │                                         │         │
│     │  • ...      │  │                                         │         │
│     └─────────────┘  └─────────────────────────────────────────┘         │
│                                                                            │
│  4. Mobile: Show bottom nav instead of sidebar                            │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Code Pattern (from src/app/student/layout.tsx):

```typescript
"use client";

export default function StudentLayout({ children }) {
  const [needsSetup, setNeedsSetup] = useState(false);
  const [userType, setUserType] = useState(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    // Parallel API calls
    Promise.all([
      fetch("/api/auth/set-role"),
      fetch("/api/user/profile")
    ])
    .then(async ([roleRes, profileRes]) => {
      const roleData = await roleRes.json();
      const profileData = await profileRes.json();

      // Check if user needs setup
      if (roleData.needsSetup || !roleData.userType) {
        setNeedsSetup(true);
        setTimeout(() => router.push("/setup/student"), 100);
        return;
      }

      // Set user data
      setUserType(roleData.userType);
    })
    .catch(() => {
      // On API error, redirect to setup
      setNeedsSetup(true);
    });
  }, [router]);

  if (needsSetup) return <RedirectingToSetup />;
  if (!userType) return <LoadingSpinner />;

  return (
    <>
      <PortalSidebar userType="student" />
      <main>{children}</main>
      <StudentBottomNav />
    </>
  );
}
```

---

### 4. Assessment Flow (RIASEC Example)

#### Files Involved:
- **Frontend:** Assessment components (various)
- **API:** `src/app/api/assessments/route.ts`
- **Database:** `assessments`, `riasecResults`, `careerMatches` tables

#### Complete Assessment Flow:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 1: User Starts Assessment                                           │
├──────────────────────────────────────────────────────────────────────────┤
│ URL: /dashboard/assessment/riasec                                         │
│ User clicks: "Start RIASEC Assessment"                                    │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 2: User Answers Questions                                            │
├──────────────────────────────────────────────────────────────────────────┤
│ - 60 questions (6 types × 10 questions each)                              │
│ - Each question: "How much would you like to..."                          │
│ - Answers stored in state: { q1: "realistic", q2: "social", ... }        │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Calculate Results                                                 │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Frontend calculates scores:                                               │
│   realistic: 8, investigative: 5, artistic: 3, ...                       │
│                                                                            │
│ Holland Code = Top 3 traits = "RIS" (Realistic-Investigative-Social)    │
│                                                                            │
│ Match against careers:                                                     │
│   Software Engineer (R-I): 85% match                                      │
│   Doctor (I-S): 78% match                                                 │
│   Teacher (S-A): 72% match                                                │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 4: Save Results to Database                                          │
├──────────────────────────────────────────────────────────────────────────┤
│ POST /api/assessments                                                     │
│ Body: {                                                                   │
│   type: "riasec",                                                         │
│   answers: { q1: "realistic", ... },                                      │
│   results: {                                                              │
│     scores: { realistic: 8, ... },                                        │
│     traits: ["Realistic", "Investigative", ...],                          │
│     careerSuggestions: ["Software Engineer", ...]                        │
│   }                                                                       │
│ }                                                                         │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 5: Database Operations (3 tables)                                   │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ 1. assessments table:                                                     │
│    INSERT INTO assessments VALUES (                                       │
│      id: 'assessment-123',                                                │
│      userId: 'user-456',                                                  │
│      type: 'riasec',                                                      │
│      status: 'completed',                                                 │
│      answers: {...},                                                      │
│      results: {...},                                                      │
│      completedAt: NOW()                                                   │
│    )                                                                      │
│                                                                            │
│ 2. riasec_results table:                                                  │
│    INSERT INTO riasec_results VALUES (                                    │
│      userId: 'user-456',                                                  │
│      realistic: 8, investigative: 5, artistic: 3, ...                    │
│      hollandCode: 'RIS',                                                  │
│      traits: [...],                                                       │
│      careerSuggestions: [...]                                            │
│    )                                                                      │
│                                                                            │
│ 3. career_matches table (10 records):                                     │
│    INSERT INTO career_matches VALUES (                                    │
│      studentId: 'user-456',                                               │
│      careerId: 'career-1',                                                │
│      matchScore: 85,                                                      │
│      matchReason: 'Based on your RIASEC code: RIS'                       │
│    )                                                                      │
│    ... (repeat for top 10 careers)                                        │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ STEP 6: Display Results                                                   │
├──────────────────────────────────────────────────────────────────────────┤
│ Redirect to: /dashboard?assessment=complete                               │
│                                                                            │
│ Show user:                                                                │
│ - Your RIASEC Code: RIS                                                  │
│ - Top 3 Traits: Realistic, Investigative, Social                         │
│ - Top 10 Career Matches with percentages                                  │
│                                                                            │
│ User can now:                                                             │
│ - Browse careers filtered by their RIASEC code                           │
│ - View career details                                                     │
│ - Save careers to favorites                                               │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Dashboard Data Loading Pattern

#### Files Involved:
- **Frontend:** `src/app/[portal]/dashboard/page.tsx`
- **API:** Various dashboard APIs
- **Database:** Multiple tables

#### Expected Dashboard Data Flow:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ STUDENT DASHBOARD - Data Loading                                         │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Component mounts                                                          │
│       │                                                                   │
│       ▼                                                                   │
│ Load user profile: GET /api/user/profile                                 │
│       │                                                                   │
│       ├──→ Returns: { firstName, lastName, classGrade, schoolId }        │
│       │                                                                   │
│       ▼                                                                   │
│ Load assessments: GET /api/assessments                                   │
│       │                                                                   │
│       ├──→ Returns: [{ type: "riasec", status: "completed", ... }, ...] │
│       │                                                                   │
│       ▼                                                                   │
│ Load classes: GET /api/student/classes                                   │
│       │                                                                   │
│       ├──→ Returns: [{ name: "Class 10-A", teacher: "Mr. X", ... }, ...]│
│       │                                                                   │
│       ▼                                                                   │
│ Load homework: GET /api/student/homework                                 │
│       │                                                                   │
│       ├──→ Returns: [{ title: "Math Ch.3", dueDate: "2025-02-20", ... }]│
│       │                                                                   │
│       ▼                                                                   │
│ Display all data in dashboard                                            │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 6. Key Database Tables

#### From `src/lib/db/schema.ts`:

```
users (Core user table)
├── id (PK)
├── clerkUserId (unique, links to Clerk)
├── type (student|teacher|parent|counselor|school_admin|admin)
├── firstName, lastName
├── email
├── schoolId (FK → schools)
├── classGrade
├── onboardingComplete (boolean)
└── settings (JSON)

schools
├── id (PK)
├── name
├── code (for school lookup)
├── district
└── ...

assessments (All assessment types)
├── id (PK)
├── userId (FK → users)
├── type (riasec|mbti|disc)
├── status (in_progress|completed)
├── answers (JSON)
├── results (JSON)
└── completedAt

riasec_results (RIASEC specific)
├── userId
├── realistic, investigative, artistic, social, enterprising, conventional
├── hollandCode
└── careerSuggestions (JSON)

career_matches
├── studentId (FK → users)
├── careerId
├── matchScore (0-100)
├── isTopMatch (boolean)
└── matchReason

classes
├── id (PK)
├── name (e.g., "Class 10-A")
├── teacherId (FK → users)
├── academicYear
└── schoolId

homework
├── id (PK)
├── classId (FK → classes)
├── title
├── description
├── dueDate
└── isPublished

wizardProgress (Setup wizard tracking)
├── userId (FK → users)
├── currentStep
├── data (JSON - accumulated form data)
└── isCompleted
```

---

### 7. Multi-Tenancy Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│ MULTI-TENANCY: School Isolation                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│ Each school has its own data:                                             │
│                                                                            │
│ School A (Yangchenphug HSS)                                               │
│  ├── Students: [100 students]                                            │
│  ├── Teachers: [20 teachers]                                             │
│  ├── Classes: [Class 10-A, 10-B, ...]                                    │
│  └── Homework: [assigned by School A teachers]                           │
│                                                                            │
│ School B (Motithang HSS)                                                  │
│  ├── Students: [150 students]                                            │
│  ├── Teachers: [25 teachers]                                             │
│  ├── Classes: [Class 10-A, 10-B, ...]                                    │
│  └── Homework: [assigned by School B teachers]                           │
│                                                                            │
│ Isolation via:                                                            │
│  - tenantId column in most tables                                         │
│  - schoolId foreign keys                                                  │
│  - API queries filter by schoolId                                         │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

---

### 8. Sign-Out Flow (Standard Practice)

#### Files Involved:
- **Trigger:** `src/components/shared/portal-sidebar.tsx` (Sign Out button in sidebar)
- **Page:** `src/app/sign-out/page.tsx`

#### Current Implementation:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ SIGN-OUT FLOW                                                             │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  User clicks "Sign Out" in sidebar                                        │
│       │                                                                   │
│       ▼                                                                   │
│  handleSignOut() function triggered                                       │
│       │                                                                   │
│       ▼                                                                   │
│  router.push('/sign-out')                                                 │
│       │                                                                   │
│       ▼                                                                   │
│  Sign-out page renders with loading state                                 │
│       │                                                                   │
│       ▼                                                                   │
│  Clerk's signOut() function called                                        │
│  signOut({ redirectUrl: '/' })                                            │
│       │                                                                   │
│       ├──→ Clears Clerk session (cookies, tokens)                        │
│       ├──→ Clears local state                                            │
│       └──→ Redirects to homepage (/)                                      │
│                                                                            │
└──────────────────────────────────────────────────────────────────────────┘
```

#### Standard Practice for Sign-Out:

**What SHOULD happen on sign-out:**

1. **Clear Authentication:**
   - Clear Clerk session (auth tokens)
   - Clear any local storage/session storage
   - Clear userType cookie

2. **Redirect to:**
   - **Homepage (/)** - Standard for public-facing apps
   - OR **Sign-in page** - If you want immediate re-login option

3. **User Experience:**
   - Show brief "Signing out..." message (currently implemented)
   - Clean redirect without errors
   - No ability to "back button" into authenticated pages

**Current Implementation (src/app/sign-out/page.tsx):**
```tsx
"use client";

import { useEffect } from "react";
import { signOut } from "@clerk/nextjs";

export default function SignOutPage() {
  useEffect(() => {
    // Actually sign out the user and redirect to homepage
    signOut({ redirectUrl: '/' });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <p className="text-gray-600">Signing out...</p>
    </div>
  );
}
```

**Recommendation:**
The current implementation is CORRECT and follows standard practice:
- ✅ Redirects to homepage (`/`)
- ✅ Clears Clerk session
- ✅ Shows loading state
- ✅ Prevents back-button access (Clerk handles this)

**Alternative (if you prefer sign-in page):**
```tsx
signOut({ redirectUrl: '/sign-in' });
```

**Best Practice:**
- Homepage is better for public-facing SaaS (users can explore, see pricing, learn more)
- Sign-in page is better for internal tools (require immediate re-login)
- For Bhutan EduSkill: **Homepage (/) is recommended** because:
  - Public users can explore careers, assessments
  - See features and benefits
  - Decide to sign up again

---

### 9. Expected User Results (What Users Should See)

#### Student Signs Up → Dashboard:
```
┌────────────────────────────────────────────────────────────┐
│  STUDENT PORTAL - Dashboard                                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome, Karma Dorji!                                     │
│  Class 10-A | Yangchenphug Higher Secondary School         │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   3         │ │   5         │ │   85%       │          │
│  │ Homework    │ │ Classes     │ │ Attendance  │          │
│  │ Pending     │ │ This Week   │ │ This Month  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  Your RIASEC Code: RIS                                     │
│  Top Career Match: Software Engineer (85%)                 │
│                                                             │
│  Recent Homework:                                          │
│  • Math Chapter 3 - Due Tomorrow                           │
│  • English Essay - Due in 3 days                           │
│                                                             │
│  Upcoming Classes:                                         │
│  • Mathematics - 9:00 AM Today                             │
│  • Science - 10:30 AM Today                                │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

#### Teacher Logs In → Dashboard:
```
┌────────────────────────────────────────────────────────────┐
│  TEACHER PORTAL - Dashboard                                │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Welcome, Mr. Tashi Wangchuk!                              │
│  Mathematics Teacher | Yangchenphug HSS                    │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │   45        │ │   3         │ │   92%       │          │
│  │ Students    │ │ Classes     │ │ Homework    │          │
│  │            │ │ Teaching    │ │ Completion  │          │
│  └─────────────┘ └─────────────┘ └─────────────┘          │
│                                                             │
│  At-Risk Students (Need Attention):                        │
│  • Karma Dorji - Below 60% in last assessment              │
│  • Pema Lhamo - Missing 3 homework assignments             │
│                                                             │
│  Today's Schedule:                                         │
│  • Class 10-A - Mathematics - 9:00 AM                      │
│  • Class 10-B - Mathematics - 11:00 AM                     │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: BRANDING & SIGN-IN (DO FIRST)

#### 1.1 Update Project Name Everywhere
**Result:** All pages show "Bhutan EduSkill" instead of "Career Compass"

| File | Action | Expected Result |
|------|--------|-----------------|
| `src/app/layout.tsx` | Update metadata title | Browser tab shows "Bhutan EduSkill" |
| `public/manifest.json` | Update name | PWA install shows "Bhutan EduSkill" |
| Footer components | Update branding | Footer shows "Bhutan EduSkill" |
| All hardcoded references | Replace | Consistent branding everywhere |

**New Name:** "Bhutan EduSkill"

#### 1.2 Clean Sign-In Page (Remove Portal Cards)
**File:** `src/app/sign-in/[[...sign-in]]/page.tsx`

**Before (Broken):**
```tsx
<PortalSelectorCards />  {/* Shows 4 cards - SHOULD BE REMOVED */}
<ClerkSignIn />
```

**After (Fixed):**
```tsx
<div className="text-center mb-6">
  <h1 className="text-2xl font-bold text-gray-900">
    Sign in to Bhutan EduSkill
  </h1>
  <p className="text-gray-600">
    Your career and education journey starts here
  </p>
</div>
<ClerkSignIn />
```

**Expected Result:** Clean sign-in page with just email/password form

#### 1.3 Update Sign-Up Page Similarly
**File:** `src/app/sign-up/[[...sign-up]]/page.tsx`
Same changes as sign-in page

---

### Phase 2: FIX MODAL FORMS

#### 2.1 Fix Select Component Transparency
**File:** `src/components/ui/select.tsx`

**Issue:** `bg-popover` class causing transparent backgrounds
**Fix:** Add explicit background color to `SelectContent`

#### 2.2 Update Dialog/Modal Components
**File:** `src/components/ui/dialog.tsx`
- Remove old gradients
- Add clean `border-gray-200` borders
- Add white backgrounds (never transparent)

#### 2.3 Fix Setup Wizard Modal
**File:** `src/app/setup/admin/page.tsx`
- Add better error handling
- Validate form before submit
- Show clear error messages

**Expected Result:** All modals work with proper styling

---

### Phase 3: REMOVE ALL HARDCODED DATA

#### 3.1 Dashboard Skills Array
**File:** `src/app/dashboard/page.tsx` lines 70-74

**Before (Broken):**
```tsx
setSkillsInProgress([
  { name: "Communication", level: 75 },
  { name: "Leadership", level: 60 },
  // ... hardcoded
]);
```

**After (Fixed):**
```tsx
// Fetch from /api/skills or show empty state
const { skills } = await fetch('/api/skills').then(r => r.json());
setSkillsInProgress(skills.length > 0 ? skills : []);
```

#### 3.2 Counselor Dashboard Students
**File:** `src/app/counselor/dashboard/content.tsx` lines 37-93
- Remove 5 hardcoded student profiles
- Fetch from `/api/counselor/students`

#### 3.3 Teacher Dashboard Mock Stats
**File:** `src/app/api/teacher/dashboard/route.ts` line 90

**Before (Broken):**
```tsx
completionRate: Math.random() * 30 + 70  // RANDOM! Not real!
```

**After (Fixed):**
```tsx
// Calculate from actual assessments
const totalAssessments = await db.select().from(assessments).where(...);
const completed = totalAssessments.filter(a => a.status === 'completed').length;
completionRate: totalAssessments.length > 0
  ? Math.round((completed / totalAssessments.length) * 100)
  : 0
```

#### 3.4 Student Homework Mock Data
**File:** `src/app/student/homework/page.tsx`
- Remove complete mock homework array
- Fetch real homework from database

**Expected Result:** All dashboards show real data or "No data yet"

---

### Phase 4: FIX AUTHENTICATION FLOW

#### 4.1 Fix Portal Card Links
**File:** `src/components/landing/portal-cards-3d.tsx`

**Before (Broken):**
```tsx
<Link href="/student">Student Portal</Link>
```

**After (Fixed):**
```tsx
<Link href="/sign-in?redirect=/student">Student Portal</Link>
```

#### 4.2 Update Middleware
**File:** `src/middleware.ts`
- Ensure unauthenticated portal visits redirect to `/sign-in`

#### 4.3 Fix Setup Trigger Logic
**File:** `src/app/api/auth/set-role/route.ts`
- Only redirect to setup if truly new user
- Check `onboardingComplete` field

**Expected Result:** Users sign in first, then go through setup if needed

---

### Phase 5: MOBILE RESPONSIVENESS

#### 5.1 Public Dashboard Mobile
**File:** `src/app/dashboard/page.tsx`

**Before (Broken):**
```tsx
<div className="grid grid-cols-4 gap-4">
```

**After (Fixed):**
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
```

#### 5.2 Ensure All Portal Dashboards Use Mobile Template
- Check: Student, Teacher, Parent, Counselor, School-Admin dashboards
- Add responsive breakpoints to all

#### 5.3 Integrate Bottom Navigation
- Ensure `portal-bottom-nav.tsx` is included in all portal layouts

**Expected Result:** Excellent mobile experience

---

### Phase 6: PORTAL DASHBOARD USER NAMES

**Files to Update:**
- `src/app/student/dashboard/page.tsx`
- `src/app/teacher/dashboard/page.tsx`
- `src/app/parent/dashboard/page.tsx`
- `src/app/counselor/dashboard/content.tsx`
- `src/app/school-admin/dashboard/page.tsx`
- `src/app/admin/dashboard/page.tsx`

**Pattern:**
```tsx
// In header
<h1>Welcome, {firstName} {lastName}!</h1>
<p>{userType} portal | {schoolName}</p>
```

**Expected Result:** Each dashboard shows user's name under portal name

---

### Phase 7: FIX AI FEATURES (Google/Gemini)

#### 7.1 Check AI Implementation
**File:** `src/lib/ai/gemini.ts` or similar

**Options:**
1. Add proper `GEMINI_API_KEY` to environment variables
2. Remove AI components entirely
3. Add clear "Coming Soon" labels

**Expected Result:** AI features either work or are clearly marked "Coming Soon"

---

## Success Criteria

When done, the project should:

✅ **Branding:**
- Show "Bhutan EduSkill" branding everywhere
- No "Clerk" or "Career Compass" references visible to users

✅ **Sign-In:**
- Clean sign-in/sign-up pages (no portal cards)
- "Sign in to Bhutan EduSkill" header

✅ **Modals:**
- All modals work with proper styling
- No transparency issues
- Clean borders and shadows

✅ **Data:**
- All dashboards show real data (or "No data yet")
- No fake/hardcoded data anywhere
- No Math.random() for statistics

✅ **Mobile:**
- Excellent mobile experience
- Touch-responsive
- Bottom navigation working
- Responsive grids (1 col mobile, 2 col tablet, 4 col desktop)

✅ **User Experience:**
- Dashboards show user's name
- AI features either work or marked "Coming Soon"
- Build succeeds without TypeScript errors
- User can: sign in → see dashboard → use features successfully

✅ **Technical:**
- All API routes return real database data
- Proper error handling
- Authentication flow works correctly
- Setup wizard creates user records correctly