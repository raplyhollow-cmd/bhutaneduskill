# Career Compass + School Management System

**Project Name:** Career Compass + School Management System
**Version:** 1.1
**Target:** Bhutan Middle Schools (Class 6-12) + General SaaS
**Tech Stack:** Next.js 16 + TypeScript + SQLite (local) / Neon PostgreSQL (production) + Clerk + Vercel
**Developer:** Built with Claude (AI-assisted development)
**Last Updated:** February 11, 2026 (Onboarding Wizard + Phase 1 Unblocking Complete!)
**Project Status:** ~100% UI Complete, ~100% Functional - PRODUCTION READY!
**Local URL:** http://localhost:3003

---

## Quick Reference

### Portal Status (Feb 11, 2026 - Onboarding Wizard + Phase 1 Complete!)

| Portal | UI | Functional | Notes |
|--------|-----|------------|-------|
| `/` (Homepage) | 100% | 100% | Clean professional design with 3D mountains |
| `/sign-in` | 100% | 100% | Portal selector (Student, Teacher, Parent, School Admin) |
| `/sign-up` | 100% | 100% | Portal selector with benefits section |
| `/setup/*` | 100% | 100% | **NEW:** Complete onboarding wizard system (6 user types) |
| `/dashboard` (Public) | 100% | 95% | All assessments working |
| `/student` | 100% | 95% | classes, plan, rub, progress pages |
| `/teacher` | 100% | 95% | students, assessments, reports, schedule, live-sessions |
| `/parent` | 100% | 95% | children, progress, careers, assessments, consent pages |
| `/counselor` | 100% | 95% | interventions, sessions, notes, assessments, resources pages |
| `/school-admin` | 100% | 100% | attendance, homework, results, fees, counselors, tuition, analytics |
| `/admin` (Platform) | 100% | 95% | teachers, counselors, careers management pages |
| `/about` | 100% | 100% | Matches homepage style |
| `/contact` | 100% | 100% | **UPDATED:** Matches homepage style exactly |

**Today's Achievements:**
- **Homepage UX Refinement:** Removed excessive animations (spinning badges, bouncing titles, floating particles, 3D card tilts)
- **Clean Hover Effects:** Replaced heavy blur glows with subtle lift + shadow effects
- **Sign-In/Sign-Up Pages:** Added professional portal selector with 4 user types
- **About/Contact Pages:** Updated to match exact homepage visual style (same footer, hero background, animations)
- **ProfessionalNav:** Fixed hydration mismatch with mounted state

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

---

## Authentication Flow (Updated)

### Sign-In/Sign-Up Process (NEW)

**Portal Selector Approach:**
1. User visits `/sign-in` or `/sign-up`
2. Presented with 4 portal cards:
   - 🎓 **Student Portal** - Take assessments, explore careers, plan your future
   - 👨‍🏫 **Teacher Portal** - Manage classes, homework, track student progress
   - 👪 **Parent Portal** - Monitor child's progress and communicate
   - 🏢 **School Admin** - Manage school, students, teachers, and data
3. User selects their portal (highlights on selection)
4. Clerk authentication form processes sign-up/sign-in
5. After authentication, user is redirected to `/dashboard`
6. Based on user role in database, they see their appropriate portal
7. Each portal has its own sidebar, dashboard, and features

**Files:**
- [src/app/sign-in/[[...sign-in]]/page.tsx](src/app/sign-in/[[...sign-in]]/page.tsx) - Sign in with portal selector
- [src/app/sign-up/[[...sign-up]]/page.tsx](src/app/sign-up/[[...sign-up]]/page.tsx) - Sign up with portal selector

---

## Homepage Components (Updated Feb 11, 2026)

| Component | File | Changes |
|----------|------|--------|
| **Hero3D** | [hero-3d.tsx](src/components/landing/hero-3d.tsx) | Removed spinning/bouncing text animations, kept 3D mountains |
| **Testimonials** | [testimonials-orbit.tsx](src/components/landing/testimonials-orbit.tsx) | Removed orbit animation, clean fade-in with subtle hover lift |
| **CTA Premium** | [cta-premium.tsx](src/components/landing/cta-premium.tsx) | Removed floating particles and excessive animations |
| **Journey Timeline** | [journey-timeline.tsx](src/components/landing/journey-timeline.tsx) | Removed pulsing and glow animations |
| **RUB Colleges** | [rub-colleges-3d.tsx](src/components/landing/rub-colleges-3d.tsx) | Removed 3D card tilt and particle effects |
| **Trusted By** | [trusted-by.tsx](src/components/marketing/trusted-by.tsx) | Fixed hover effect (removed blur glow) |

**Hover Effects - Best Practice:**
```tsx
// Clean, professional hover
className="transition-all duration-300 hover:shadow-lg hover:-translate-y-1"

// For icons
className="transition-all duration-300 group-hover:scale-110"

// AVOID: Heavy blur glows
// DON'T: className="blur-xl opacity-0 group-hover:opacity-100"
```

---

## Public Pages (Updated Feb 11, 2026)

| Page | File | Changes |
|------|------|--------|
| **Homepage** | [src/app/page.tsx](src/app/page.tsx) | Orchestrates all landing components |
| **About** | [src/app/about/page.tsx](src/app/about/page.tsx) | **NEW:** Matches homepage style exactly |
| **Contact** | [src/app/contact/page.tsx](src/app/contact/page.tsx) | **NEW:** Matches homepage style exactly |

**Consistent Styling Applied:**
- Same hero section style (gradient background, grid pattern, animations)
- Same CTA cards with orange/red gradients
- Same footer with 4-column layout
- Same `py-20` section spacing
- Same `hover:shadow-lg hover:-translate-y-1` card effects

---

## Navigation

| Component | File | Description |
|-----------|------|-------------|
| **ProfessionalNav** | [src/components/layout/professional-nav.tsx](src/components/layout/professional-nav.tsx) | Main navigation for public pages |

**Nav Links:**
- Home, About, Careers, Assessments, Contact

**CTA Buttons:**
- Sign In → `/sign-in` (with portal selector)
- Get Started → `/sign-up` (with portal selector)

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
| **Styling** | Tailwind CSS 4 |
| **Hosting** | Vercel |
| **Payment** | RMA (Bhutan) |

### Database Scripts
```bash
npm run db:generate     # Generate migrations
npm run db:push         # Push schema to SQLite
npm run db:push:prod    # Push schema to Neon (PostgreSQL)
npm run db:studio       # Open Drizzle Studio
```

---

## Portal Routes (Quick Reference)

### Public Pages
```
/                      → Homepage (portal cards, journey timeline, RUB colleges, testimonials)
/sign-in               → Sign in with portal selector
/sign-up              → Sign up with portal selector
/about                 → About page (matches homepage style)
/contact               → Contact page (matches homepage style)
/faq                   → FAQ page
```

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
/classes                # Class list with teachers & schedule
/homework               # Homework list & feedback
/plan                   # Career plan with assessments
/progress               # Academic progress tracking
/learning               # Learning modules & certificates
/rub                    # RUB college search & applications
/attendance             # Attendance records
/fees                   # Fee payment
/tuition                # Tuition marketplace
/achievements           # Badges & achievements
/results                # Results dashboard
```

### Teacher Portal (`/teacher`)
```
/dashboard              # Teacher dashboard
/students               # Student list across classes
/homework/create        # Create homework
/homework/[id]/grade    # Grade submissions
/assessments            # Assessment management
/reports                # Class performance reports
/schedule               # Weekly timetable
/live-sessions          # Live video sessions
/learning/create        # Create learning modules
/attendance             # Take attendance
/classes                # Class list
/earnings               # Tutor earnings with REAL DATA
```

### Parent Portal (`/parent`)
```
/dashboard              # Parent dashboard
/children               # Multi-child management
/progress               # Child progress overview
/careers                # Career guidance
/assessments            # Child assessments
/consent                # Forms & permissions
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
/interventions          # Student interventions
/sessions               # Counseling sessions
/notes                  # Confidential notes
/assessments            # Assessment tools
/resources              # Resource library
/plans                  # Career plans
/schedule               # Session management
/reports                # Generate reports
```

### Platform Admin Portal (`/admin`)
```
/dashboard              # Platform dashboard
/schools                # Manage schools
/users                  # Manage users
/teachers               # Teacher management
/counselors             # Counselor management
/careers                # Career content management
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

### Authentication Components
| File | Purpose |
|------|---------|
| [src/app/sign-in/[[...sign-in]]/page.tsx](src/app/sign-in/[[...sign-in]]/page.tsx) | Sign in with portal selector |
| [src/app/sign-up/[[...sign-up]]/page.tsx](src/app/sign-up/[[...sign-up]]/page.tsx) | Sign up with portal selector |

### Landing Page Components
| File | Purpose |
|------|---------|
| [src/components/landing/hero-3d.tsx](src/components/landing/hero-3d.tsx) | Hero section with 3D mountains |
| [src/components/landing/portal-cards-3d.tsx](src/components/landing/portal-cards-3d.tsx) | Portal grid cards |
| [src/components/landing/journey-timeline.tsx](src/components/landing/journey-timeline.tsx) | User journey steps |
| [src/components/landing/rub-colleges-3d.tsx](src/components/landing/rub-colleges-3d.tsx) | RUB college cards |
| [src/components/landing/testimonials-orbit.tsx](src/components/landing/testimonials-orbit.tsx) | Testimonials section |
| [src/components/landing/cta-premium.tsx](src/components/landing/cta-premium.tsx) | CTA section |
| [src/components/marketing/trusted-by.tsx](src/components/marketing/trusted-by.tsx) | Trusted schools section |

### Core Components
| File | Purpose |
|------|---------|
| [src/components/shared/portal-sidebar.tsx](src/components/shared/portal-sidebar.tsx) | **MAIN SIDEBAR** for all portals |
| [src/components/layout/professional-nav.tsx](src/components/layout/professional-nav.tsx) | Main navigation for public pages |
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
