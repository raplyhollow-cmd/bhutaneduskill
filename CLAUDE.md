# Career Compass + School Management System

**Project Name:** Career Compass + School Management System
**Version:** 1.0
**Target:** Bhutan Middle Schools (Class 6-12) + General SaaS
**Tech Stack:** Next.js 16 + TypeScript + SQLite/Neon + Clerk + Vercel
**Developer:** Built with Claude (AI-assisted development)
**Last Updated:** February 10, 2026 (Overnight Sprint - MASSIVE UPDATE!)
**Project Status:** ~99% UI Complete, ~95% Functional - ALL MISSING PAGES CREATED!
**Local URL:** http://localhost:3003

---

## Quick Reference

### Portal Status (Feb 10, 2026 - Overnight Sprint Complete!)

| Portal | UI | Functional | Notes |
|--------|-----|------------|-------|
| `/dashboard` (Public) | 100% | 95% | All assessments working |
| `/student` | 100% | 95% | **NEW:** classes, plan, rub, progress pages with REAL DATA |
| `/teacher` | 100% | 95% | **NEW:** students, assessments, reports, schedule, live-sessions + REAL earnings data |
| `/parent` | 100% | 95% | **NEW:** children, progress, careers, assessments, consent pages |
| `/counselor` | 100% | 95% | **NEW:** interventions, sessions, notes, assessments, resources pages |
| `/school-admin` | 100% | 95% | **NEW:** attendance, homework, results, analytics with REAL DATA |
| `/admin` (Platform) | 100% | 95% | **NEW:** teachers, counselors, careers management pages |

**21 NEW PAGES CREATED TONIGHT!**
- Student: 3 pages (classes, plan, rub, progress)
- Teacher: 5 pages (students, assessments, reports, schedule, live-sessions)
- Parent: 5 pages (children, progress, careers, assessments, consent)
- Counselor: 5 pages (interventions, sessions, notes, assessments, resources)
- Platform Admin: 3 pages (teachers, counselors, careers)
- Plus: Server-side data integration for earnings, student dashboard, analytics

---

## 🎯 What This Project Does

**Dual Product - Connected Ecosystem:**

| Product | Purpose | Users |
|---------|---------|-------|
| **Career Guidance** | Help students discover careers & plan their future | Students (Class 6-12), Parents, Counselors |
| **School Management** | Run daily operations (attendance, homework, fees) | Schools, Teachers, Admins, Parents |

**How Career Counseling is Used:**
```
1. DISCOVER (Free, no login) → Take RIASEC test → Get career matches
2. EXPLORE → Browse careers, RUB colleges, scholarships
3. SIGN UP (School code) → Connect to school ecosystem
4. PLAN → Set goals, choose subjects, create roadmap
5. ACHIEVE → Track grades, homework, attendance (all linked!)
6. TRANSITION → BCSE results → Apply to RUB → Success! 🎉
```

**The Flywheel:** Career guidance attracts students → School collects data → Data improves guidance → Better outcomes → More students join

**Full explanation:** [docs/vision-objectives.md](docs/vision-objectives.md)

---

## Documentation Index

> **Note:** Detailed documentation has been split into focused files for faster loading. See below for links.

| Topic | File | Description |
|-------|------|-------------|
| **API Routes** | [docs/api-routes.md](docs/api-routes.md) | All API endpoints + advanced techniques |
| **Database** | [docs/database-schema.md](docs/database-schema.md) | 40+ tables, schema reference |
| **File Structure** | [docs/file-structure.md](docs/file-structure.md) | Project organization |
| **Portal Colors** | [docs/portal-colors.md](docs/portal-colors.md) | RGB gradients for each portal |
| **UX Design** | [docs/ux-design-system.md](docs/ux-design-system.md) | Clerk-inspired patterns, components |
| **Deployment** | [docs/deployment.md](docs/deployment.md) | Environment setup, Vercel config |
| **Auth Flow** | [docs/auth-flow.md](docs/auth-flow.md) | Sign-up options, school codes |
| **Missing Features** | [docs/missing-features.md](docs/missing-features.md) | 50+ modules (Fedena, Australia, Cambridge, US research) |
| **Onboarding Wizard** | [docs/onboarding-wizard.md](docs/onboarding-wizard.md) | Guided setup flows for all user types |
| **Advanced UX/UI** | [docs/advanced-ux-ui.md](docs/advanced-ux-ui.md) | Micro-interactions, transitions, 1L+ user tested patterns |
| **Vision & Objectives** | [docs/vision-objectives.md](docs/vision-objectives.md) | Dual-product strategy, student journey, flywheel effect |

---

## Technology Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | SQLite (local), Neon (production) |
| **ORM** | Drizzle ORM |
| **Auth** | Clerk |
| **Styling** | Tailwind CSS |
| **Hosting** | Vercel |
| **Payment** | RMA (Bhutan) |

---

## Portal Routes (Quick Reference)

### Public Dashboard (`/dashboard`)
```
/assessment/*           # RIASEC, MBTI, DISC tests
/careers/*              # Career exploration
/plan/*                 # Career planning
/journal                # Journal entries
/saved                  # Saved items
/rub                    # RUB colleges
/scholarships           # Scholarships
/study-abroad           # Study abroad
```

### Student Portal (`/student`)
```
/dashboard              # Student dashboard (REAL DATA)
/classes                # ✨ NEW: Class list with teachers & schedule
/homework               # Homework list & feedback
/plan                   # ✨ NEW: Career plan with assessments
/progress               # ✨ NEW: Academic progress tracking
/learning               # Learning modules & certificates
/rub                    # ✨ NEW: RUB college search & applications
/attendance             # Attendance records
/fees                   # Fee payment
/tuition                # Tuition marketplace
/achievements           # Badges & achievements
/results                # Results dashboard
```

### Teacher Portal (`/teacher`)
```
/dashboard              # Teacher dashboard
/students               # ✨ NEW: Student list across classes
/homework/create        # Create homework
/homework/[id]/grade    # Grade submissions
/assessments            # ✨ NEW: Assessment management
/reports                # ✨ NEW: Class performance reports
/schedule               # ✨ NEW: Weekly timetable
/live-sessions          # ✨ NEW: Live video sessions
/learning/create        # Create learning modules
/attendance             # Take attendance
/classes                # Class list
/earnings               # ✨ UPDATED: Tutor earnings with REAL DATA
```

### Parent Portal (`/parent`)
```
/dashboard              # Parent dashboard
/children               # ✨ NEW: Multi-child management
/progress               # ✨ NEW: Child progress overview
/careers                # ✨ NEW: Career guidance
/assessments            # ✨ NEW: Child assessments
/consent                # ✨ NEW: Forms & permissions
/attendance             # Child attendance
/homework               # Child homework
/fees/pay               # Pay fees (RMA)
/communication          # Message teachers
/documents              # Download documents
```

### School Admin Portal (`/school-admin`)
```
/dashboard              # Admin dashboard
/students/create        # Register students
/teachers/create        # Register teachers
/classes                # Manage classes
/subjects               # Manage subjects
/timetable              # Generate timetables
/reports                # Generate reports
/settings               # School settings
```

### Counselor Portal (`/counselor`)
```
/dashboard              # Counselor dashboard
/students               # Student list & profiles
/interventions          # ✨ NEW: Student interventions
/sessions               # ✨ NEW: Counseling sessions
/notes                  # ✨ NEW: Confidential notes
/assessments            # ✨ NEW: Assessment tools
/resources              # ✨ NEW: Resource library
/plans                  # Career plans
/schedule               # Session management
/reports                # Generate reports
```

### Platform Admin Portal (`/admin`)
```
/dashboard              # Platform dashboard
/schools                # Manage schools
/users                  # Manage users
/teachers               # ✨ NEW: Teacher management
/counselors             # ✨ NEW: Counselor management
/careers                # ✨ NEW: Career content management
/content                # Content management
/billing                # Subscriptions
/settings               # Platform settings
/support                # Support tickets
```

---

## Critical Rules (Never Violate)

### 1. NEVER Use These Tailwind Classes
```
from-hunter-green-*, to-hunter-green-*
from-powder-blue-*, to-powder-blue-*
from-ash-grey-*, to-ash-grey-*
from-oxidized-iron-*, to-oxidized-iron-*
from-lobster-pink-*, to-lobster-pink-*
bg-ash-grey-*
```

### 2. ALWAYS Use Inline Styles for Gradients
```tsx
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
```

### 3. Portal Colors (RGB)
```
student:     rgb(249 115 22) → rgb(194 65 12)     // Orange
teacher:     rgb(59 130 246) → rgb(37 99 235)     // Blue
parent:      rgb(107 114 128) → rgb(75 85 99)     // Gray
counselor:   rgb(168 85 247) → rgb(147 51 234)    // Purple
admin:       rgb(236 72 153) → rgb(219 39 119)    // Pink
school-admin: rgb(139 92 246) → rgb(124 58 237)   // Violet
```

### 4. Boolean Types (SQLite)
```tsx
isPrivate: !!value  // NOT value ? 1 : 0
isActive: !!value   // NOT value ? 1 : 0
```

---

## Key Components Reference

| File | Purpose |
|------|---------|
| [src/components/shared/portal-sidebar.tsx](src/components/shared/portal-sidebar.tsx) | **MAIN SIDEBAR** for all portals |
| [src/components/homework/homework-creator.tsx](src/components/homework/homework-creator.tsx) | Create homework (8 question types) |
| [src/components/homework/grading-panel.tsx](src/components/homework/grading-panel.tsx) | Grade submissions |
| [src/components/attendance/attendance-tracker.tsx](src/components/attendance/attendance-tracker.tsx) | Take attendance with keyboard shortcuts |
| [src/components/parent/child-selector.tsx](src/components/parent/child-selector.tsx) | Multi-child selector |

---

## Development Workflow

```bash
# Install dependencies
npm install

# Start development server (port 3003!)
npm run dev

# Build for production
npm run build

# Run production build
npm start
```

---

## Memory File

See [MEMORY.md](MEMORY.md) for project quick reference and working notes.

---

## Other Documentation Files

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview |
| [COMPLETION_PLAN.md](COMPLETION_PLAN.md) | Phase-by-phase completion guide |
| [DATABASE_SPRINT_SUMMARY.md](DATABASE_SPRINT_SUMMARY.md) | Database refactoring progress |
| [UX_IMPROVEMENTS.md](UX_IMPROVEMENTS.md) | UI/UX enhancement log |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Implementation notes |
