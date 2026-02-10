# Career Compass + School Management System

**Project Name:** Career Compass + School Management System
**Version:** 1.0
**Target:** Bhutan Middle Schools (Class 6-12) + General SaaS
**Tech Stack:** Next.js 16 + TypeScript + SQLite/Neon + Clerk + Vercel
**Developer:** Built with Claude (AI-assisted development)
**Last Updated:** February 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [User Roles & Portals](#user-roles--portals)
5. [Core Features](#core-features)
6. [Database Schema](#database-schema)
7. [API Routes](#api-routes)
8. [Services & Integrations](#services--integrations)
9. [File Structure](#file-structure)
10. [Development Workflow](#development-workflow)
11. [Deployment Plan](#deployment-plan)
12. [UX/UI Task List](#uxui-task-list)
13. [Known Issues](#known-issues)

---

## Project Overview

### Vision
A comprehensive platform combining **AI-powered career guidance** with **complete school management** for Bhutan's education system, expandable globally.

### Target Users
- **Students (Class 6-12):** Career assessments, guidance, learning resources
- **Teachers:** Class management, homework, attendance, analytics
- **Parents:** Child progress tracking, results, fees
- **Counselors:** Career planning, student guidance
- **School Admins:** Complete school operations management
- **Platform Admins:** Multi-tenant management

### Unique Value Proposition
1. **AI-Powered Career Guidance** - RIASEC, MBTI, DISC, Learning Styles assessments
2. **Bhutan-Specific** - RUB colleges, scholarships, local career paths
3. **All-in-One School Management** - Attendance, homework, fees, learning
4. **Multi-Tenant** - Serve unlimited schools from one platform
5. **Offline-First** - Works in areas with limited internet

---

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js** | 16.1.6 | React framework with App Router & Turbopack |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5.x | Type safety |
| **Tailwind CSS** | 4.x | Styling |
| **shadcn/ui** | Latest | Component library |
| **Framer Motion** | 12.x | Animations |
| **next-themes** | Latest | Dark mode |
| **next-intl** | Latest | Internationalization |

### Backend & Database
| Technology | Version | Purpose |
|------------|---------|---------|
| **Next.js API Routes** | - | Backend endpoints |
| **Drizzle ORM** | 0.45.1 | Database queries |
| **SQLite** | (better-sqlite3) | Local development database |
| **PostgreSQL** | (Neon planned) | Production database |
| **@libsql/client** | 0.17.0 | SQLite wrapper |

### Authentication & Authorization
| Technology | Version | Purpose |
|------------|---------|---------|
| **Clerk** | 6.37.3 | Authentication, user management |
| **Custom Middleware** | - | Role-based access control |

### State Management & Data Fetching
| Technology | Version | Purpose |
|------------|---------|---------|
| **Zustand** | 5.0.11 | Client state |
| **TanStack Query** | 5.90.20 | Server state |
| **React Hook Form** | 7.71.1 | Forms |
| **Zod** | 4.3.6 | Validation |

### Development Tools
| Technology | Purpose |
|------------|---------|
| **ESLint** | Code linting |
| **tsx** | TypeScript execution |
| **Drizzle Kit** | Database migrations |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │  Student    │  │  Teacher    │  │  Parent     │  │  Admin      │   │
│  │  Portal     │  │  Portal     │  │  Portal     │  │  Portal     │   │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘   │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        NEXT.JS APP LAYER                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    App Router (src/app/)                        │    │
│  │  ├── Public Routes (/about, /contact, /faq)                    │    │
│  │  ├── Auth Routes (/sign-in, /sign-up)                         │    │
│  │  ├── Role Portals (/student, /teacher, /parent, /counselor)   │    │
│  │  ├── Dashboards (/dashboard/*)                                │    │
│  │  ├── Admin (/admin, /school-admin)                            │    │
│  │  └── API Routes (/api/*)                                      │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Components (src/components/)                 │    │
│  │  ├── UI Components (shadcn/ui)                                │    │
│  │  ├── Assessment (RIASEC, MBTI, DISC)                           │    │
│  │  ├── Homework (Creator, Submission, Grading)                  │    │
│  │  ├── Attendance (Tracker, Kiosk)                              │    │
│  │  ├── Fees (Manager, Receipt Generator)                        │    │
│  │  ├── Learning (Modules, Certificates)                         │    │
│  │  └── Tuition (Courses, Tutors, Sessions)                       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    Library (src/lib/)                          │    │
│  │  ├── Database (schema, client, migrations)                    │    │
│  │  ├── Assessments (riasec, mbti, disc, work-values)             │    │
│  │  ├── Payment (RMA gateway)                                    │    │
│  │  ├── Auth (utils, tenant)                                     │    │
│  │  └── Utilities (validation, rate-limit, etc.)                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│  Clerk Auth  │          │   Database   │          │  External    │
│              │          │              │          │  Services    │
│ • Sign In/Up │          │ • SQLite     │          │ • Resend     │
│ • Sessions   │          │ • PostgreSQL │          │ • PostHog    │
│ • Roles      │          │ • Drizzle ORM│          │ • Sentry     │
│ • Multi-tenant│         │              │          │ • Upstash    │
└──────────────┘          └──────────────┘          │ • RMA Payment│
                                                   └──────────────┘
```

---

## User Roles & Portals

### 1. Student Portal (`/student`)
**URL:** http://localhost:3002/student

**Features:**
- Dashboard with progress overview
- Career assessments (RIASEC, MBTI, DISC, Learning Styles)
- View assessment results and career recommendations
- View and submit homework
- View attendance records
- Access learning modules
- Browse tuition courses
- View fee records and receipts
- Take online proctored exams

**Key Pages:**
- `/student/dashboard` - Overview
- `/student/homework` - Homework assignments
- `/student/learning` - Learning modules
- `/student/tuition` - Tuition marketplace
- `/student/attendance` - Attendance records
- `/student/fees` - Fee payment history

### 2. Teacher Portal (`/teacher`)
**URL:** http://localhost:3002/teacher

**Features:**
- Dashboard with class overview
- Create and manage homework
- Grade student submissions
- Track attendance
- View class analytics
- Create learning modules
- Offer tuition services

**Key Pages:**
- `/teacher/page` - Main dashboard
- `/teacher/homework` - Homework management
- `/teacher/learning` - Learning modules
- `/teacher/attendance` - Attendance tracking

### 3. Parent Portal (`/parent`)
**URL:** http://localhost:3002/parent

**Features:**
- View child's progress
- View assessment results
- Track homework and submissions
- Monitor attendance
- Pay fees online
- View exam results
- Communication with teachers

**Key Pages:**
- `/parent/page` - Main dashboard

### 4. Counselor Portal (`/counselor`)
**URL:** http://localhost:3002/counselor

**Features:**
- View all assigned students
- Career planning tools
- Assessment results analysis
- Create career plans
- Write counselor notes
- Export reports
- Access student data

**Key Pages:**
- `/counselor/page` - Main dashboard
- `/counselor/data-export` - Export student data

### 5. School Admin Portal (`/school-admin`)
**URL:** http://localhost:3002/school-admin

**Features:**
- Complete school management
- Student management (add, edit, remove)
- Teacher management
- Class management
- Subject management
- Attendance oversight
- Homework oversight
- Fee management
- Exam results management
- Learning modules
- Tuition marketplace
- Analytics and reports

**Key Pages:**
- `/school-admin/dashboard` - Overview
- `/school-admin/students` - Student management
- `/school-admin/teachers` - Teacher management
- `/school-admin/classes` - Class management
- `/school-admin/subjects` - Subject management
- `/school-admin/attendance` - Attendance oversight
- `/school-admin/homework` - Homework oversight
- `/school-admin/results` - Exam results
- `/school-admin/fees` - Fee management
- `/school-admin/tuition` - Tuition marketplace
- `/school-admin/analytics` - School analytics
- `/school-admin/counselors` - Counselor assignments

### 6. Platform Admin Portal (`/admin`)
**URL:** http://localhost:3002/admin

**Features:**
- Multi-tenant management
- School registration and settings
- User oversight
- System analytics
- Content management (careers, colleges, scholarships)
- Platform configuration

### 7. Public Dashboard (`/dashboard`)
**URL:** http://localhost:3002/dashboard

**Features:**
- Career exploration
- Assessment taking (RIASEC, MBTI, DISC, etc.)
- Saved careers
- Career roadmap
- Study abroad options
- RUB programs
- Scholarships
- Skills assessment
- Journaling
- Achievements

---

## Core Features

### 1. Career Guidance System

#### Assessments Available
| Assessment | Purpose | Target Age |
|------------|---------|------------|
| **RIASEC** | Holland Code career matching | 12+ |
| **SPARK Lite** | Interest assessment | 10-13 |
| **SPARK Basic** | Career interests | 14-16 |
| **SPARK Advanced** | Detailed career planning | 16+ |
| **MBTI** | Personality type | 14+ |
| **DISC** | Workplace behavior | 15+ |
| **Work Values** | What matters in work | 14+ |
| **Learning Styles** | How you learn best | 10+ |

#### Features
- Instant results with career matches
- Detailed personality/career reports
- Save and compare results
- Career roadmap generation
- AI career coach integration

### 2. School Management Features

#### Attendance System
- Daily attendance tracking
- Multiple entry methods:
  - Manual entry by teacher
  - Fingerprint kiosk mode
  - Mobile app check-in
- Attendance reports
- Absence notifications
- Geolocation verification

#### Homework System
- Create homework with multiple question types:
  - Multiple choice
  - Short answer
  - Essay
  - Fill in the blank
  - Match the following
  - Math expressions
  - Handwriting recognition
- File attachments
- Cloud links (Google Drive, OneDrive)
- Student submissions
- Auto-grading (for objective questions)
- Manual grading panel
- Feedback and comments

#### Learning Modules
- Create online courses
- Video lessons
- Text content
- Quiz assessments
- Progress tracking
- Certificates on completion
- Student enrollment

#### Fee Management
- Fee structure creation
- Student fee records
- Payment tracking
- Receipt generation (PDF)
- Payment history
- Pending payments
- Payment reminders

#### Exam Results
- Board exam results (Class 8, 10, 12)
- Subject-wise marks
- Division/rank tracking
- Verification system
- Certificate generation

### 3. Tuition Marketplace

#### Features
- Teacher profiles
- Course listings:
  - Online recorded courses
  - Online live sessions
  - Physical tuition
- Student enrollment
- Payment processing
- Progress tracking
- Reviews and ratings
- Tutor earnings
- Location-based tutor matching

### 4. Multi-Tenancy

- Each school is a separate tenant
- Data isolation
- Customizable settings per school
- Subdomain or path-based routing
- School-specific branding

---

## Database Schema

### Core Tables

#### Users & Authentication
```
users                    # All user types
├── id, tenant_id, school_id
├── type (student/teacher/parent/admin/counselor)
├── email, phone
├── first_name, last_name
├── clerk_user_id (Clerk integration)
└── role-specific fields
```

#### School Structure
```
tenants                  # Multi-tenant organizations
schools                  # Individual schools
districts                # Bhutan districts
classes                  # School classes
subjects                 # School subjects
academic_terms           # Semesters/terms
```

#### Assessments
```
assessments              # Assessment instances
assessment_types         # Assessment templates
questions                # Assessment questions
riasec_results           # RIASEC results
mbti_results             # MBTI results
disc_results             # DISC results
work_values_results      # Work values results
learning_styles_results  # Learning styles results
```

#### School Operations
```
homework                  # Homework assignments
homework_submissions     # Student submissions
attendance               # Attendance records
attendance_sessions      # Kiosk sessions
exam_results             # Exam results
exam_results_enhanced    # Detailed results
```

#### Learning
```
learning_modules         # Online courses
module_progress          # Student progress
```

#### Tuition
```
tuition_categories       # Subject categories
tutors                   # Teacher profiles
tuition_courses          # Course listings
tuition_enrollments      # Student enrollments
live_sessions            # Live class sessions
tutor_reviews            # Reviews
tutor_earnings           # Payment tracking
physical_tuition_requests # Location-based requests
```

#### Fees
```
fee_structures           # Fee templates
student_fees             # Student fee records
fee_payments             # Payment transactions
```

#### Career & Content
```
careers                  # Career database
career_matches           # Assessment-career matching
colleges                 # College information
rub_programs             # RUB programs
scholarships             # Scholarship database
career_plans             # Student career plans
counselor_notes          # Counselor notes
```

---

## API Routes

### Authentication (Clerk)
```
/sign-in                 # Clerk sign-in page
/sign-up                 # Clerk sign-up page
/sign-out                # Clerk sign-out page
```

### User Management
```
/api/user/profile        # Get/update user profile
```

### Assessments
```
/api/assessments         # Assessment CRUD
/api/assessments/start   # Start new assessment
/api/saved-careers       # Saved career interests
```

### Data Export
```
/api/data-export         # Export student data (counselor)
```

### Transport
```
/api/transport/tracking/[vehicleId]  # Vehicle tracking
```

### Inventory
```
/api/inventory/items     # Inventory management
```

### Hostel
```
/api/hostel/allocations  # Hostel room allocations
```

### Timetable
```
/api/timetable/generate  # Generate timetables
```

---

## Services & Integrations

### Planned Services (Free Tier)

| Service | Purpose | Free Tier Limit | Status |
|---------|---------|-----------------|--------|
| **Vercel** | Hosting | 100 GB bandwidth | ✅ Ready |
| **Neon** | PostgreSQL | 500 MB storage | ⏳ Pending |
| **Clerk** | Authentication | 5,000 MAU | ✅ Integrated |
| **Resend** | Emails | 3,000/month | ⏳ Pending |
| **PostHog** | Analytics | 1M events/month | ⏳ Pending |
| **Sentry** | Error Tracking | 5,000 errors/month | ⏳ Pending |
| **Upstash Redis** | Caching | 500K commands/month | ⏳ Pending |
| **RMA** | Payments | Bhutan gateway | ✅ Code ready |

---

## File Structure

```
career-guidance/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                  # Auth routes
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── admin/                   # Platform admin
│   │   ├── counselor/               # Counselor portal
│   │   ├── dashboard/               # Public dashboard
│   │   │   ├── assessment/          # Assessment pages
│   │   │   ├── careers/             # Career exploration
│   │   │   ├── plan/                # Career planning
│   │   │   └── [feature pages]
│   │   ├── parent/                  # Parent portal
│   │   ├── portal/                  # Generic portals
│   │   ├── school-admin/            # School admin portal
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── teachers/
│   │   │   ├── classes/
│   │   │   ├── subjects/
│   │   │   ├── attendance/
│   │   │   ├── homework/
│   │   │   ├── results/
│   │   │   ├── fees/
│   │   │   ├── tuition/
│   │   │   ├── analytics/
│   │   │   └── counselors/
│   │   ├── student/                 # Student portal
│   │   │   ├── dashboard/
│   │   │   ├── homework/
│   │   │   ├── learning/
│   │   │   ├── tuition/
│   │   │   ├── attendance/
│   │   │   └── fees/
│   │   ├── teacher/                 # Teacher portal
│   │   │   ├── homework/
│   │   │   ├── learning/
│   │   │   └── attendance/
│   │   ├── api/                     # API routes
│   │   ├── about/
│   │   ├── contact/
│   │   ├── faq/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── components/
│   │   ├── ui/                      # shadcn/ui components
│   │   ├── assessment/              # Assessment components
│   │   ├── attendance/              # Attendance components
│   │   ├── fees/                    # Fee components
│   │   ├── homework/                # Homework components
│   │   ├── learning/                # Learning components
│   │   ├── tuition/                 # Tuition components
│   │   ├── ai/                      # AI features
│   │   ├── data/                    # Data management
│   │   ├── shared/                  # Shared components
│   │   └── theme-toggle.tsx
│   │
│   ├── lib/
│   │   ├── db/                      # Database
│   │   │   ├── schema.ts            # Main schema (40+ tables)
│   │   │   ├── schema-content.ts    # Content schemas
│   │   │   └── [schema files]
│   │   ├── assessments/             # Assessment algorithms
│   │   │   ├── riasec.ts
│   │   │   ├── mbti.ts
│   │   │   ├── disc.ts
│   │   │   └── [others]
│   │   ├── payment/                 # Payment integration
│   │   │   └── rma-gateway.ts       # RMA Bhutan
│   │   ├── auth-utils.ts            # Auth helpers
│   │   ├── riasec.ts                # RIASEC calculations
│   │   ├── tenant.ts                # Multi-tenancy
│   │   ├── rate-limit.ts            # API rate limiting
│   │   ├── validation.ts            # Input validation
│   │   ├── bcse/                    # BCSE integration
│   │   ├── data-export/             # Data export utilities
│   │   ├── ai-features/             # AI features
│   │   └── [utilities]
│   │
│   └── types/                       # TypeScript types
│
├── scripts/                          # Utility scripts
│   ├── setup-db.ts
│   └── migrate-db.ts
│
├── public/                           # Static assets
├── .env.local                        # Environment variables
├── .env.example                      # Environment template
├── next.config.ts                    # Next.js config
├── tailwind.config.ts                # Tailwind config
├── tsconfig.json                     # TypeScript config
├── package.json                      # Dependencies
└── drizzle.config.ts                 # Drizzle config
```

---

## Development Workflow

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Runs at: http://localhost:3002 (port may vary)
```

### Database Management
```bash
# Setup database
npm run db:setup

# Run migrations
npm run db:migrate
```

### Building for Production
```bash
# Create production build
npm run build

# Start production server
npm start
```

---

## Claude Code Optimization (2026)

To maximize Claude in VS Code within agent limits (as of early 2026), you need to move away from "chatting" and toward a **Context-First / Session-Based** paradigm.

The "Agent Limit" usually refers to the rapid depletion of your message quota or the 200k–1M token context window. Here is the definitive paradigm for high-output engineering.

### 1. The Multi-Tool Strategy: Choose the Right "Agent"

Don't use the same extension for everything. Partition your tasks to save Claude's "high-IQ" tokens for where they matter.

| Tool | Purpose | Scaling Strategy |
| --- | --- | --- |
| **Claude Code (Official)** | Complex, multi-file refactoring & terminal tasks. | Use for **deep architecture** changes. Use `/compact` often to reset context without losing summary. |
| **Cline (Open Source)** | Custom workflows & Model switching. | Use this to **BYOK (Bring Your Own Key)**. If you hit your Claude Pro limit, switch Cline to **DeepSeek V3** or **Gemini 2.0 Flash** for "busy work." |
| **Cursor / Ghostwriter** | Real-time "flow" and tab completion. | Use for **inline edits** and boilerplates. Their custom models handle simple logic without burning your Claude quota. |

### 2. The "Context Injection" Paradigm

Agents waste the most tokens "searching" for context. Feed it manually to save cycles.

- **The `.clauderules` or `.cursorrules` File:** Create this in your root. Define your stack, variable naming conventions, and common pitfalls. This prevents Claude from "guessing" and wasting messages on corrections.
- **The `@` Mention Rule:** Never say "fix the error in the auth file." Say `@auth.ts fix the error on line 42`. Specificity reduces the "reflection" tokens the agent uses to locate code.
- **CLAUDE.md for State:** Maintain a `CLAUDE.md` file in your repo. When finishing a session, tell the agent: *"Update CLAUDE.md with current progress and next steps."* Start the next session by pointing it to that file. This allows you to use `/clear` frequently to stay under the token limit.

### 3. High-Efficiency Commands (2026 Updated)

Use these specific workflows to bypass typical agent bottlenecks:

- **The `/compact` and `/clear` Routine:** In the official Claude extension, a long chat history makes every new message exponentially "expensive" (input tokens). Every 10–15 messages, summarize and `/clear`.
- **Batching via MCP:** Use the **Model Context Protocol (MCP)** to give Claude direct access to your documentation or DB. Instead of pasting docs (token heavy), use an MCP server to let Claude "query" only the relevant bits.
- **Adaptive Thinking Levels:**
  - Set `effort: low` for routine unit tests or CSS.
  - Set `effort: max` only for debugging race conditions or architectural shifts.

### 4. The "Sub-Agent" Handover

If you have a massive task (e.g., "Migrate this entire repo to Next.js 15"), do not run it in one chat.

1. **Architect Mode:** Use Claude 3.7 Opus to create a `migration_plan.json`.
2. **Execution Mode:** Open a new session, feed it the JSON, and use Claude 3.5 Sonnet (faster/cheaper) to execute one file at a time.
3. **Review Mode:** Use the built-in `/diff` tool to verify before committing.

### Summary Checklist for "Max Capacity"

- [ ] **Primary Model:** Claude 3.7 Sonnet (best balance of speed/limit).
- [ ] **Caching:** Use **Anthropic Prompt Caching** (automatic in most 2026 extensions) by keeping your system prompt and core files consistent.
- [ ] **Fallback:** Have a **DeepSeek** or **OpenRouter** API key ready in **Cline** for when the "High-Tier" messages run out.
- [ ] **Noise Reduction:** Delete `node_modules` or build folders from the agent's visibility (via `.gitignore` or extension settings) so it doesn't waste tokens indexing junk.

---

## Deployment Plan

### Current Status
- **Local Development:** ✅ Running
- **Database:** SQLite (local), needs migration to Neon (production)
- **Authentication:** ✅ Clerk integrated
- **Payment:** ✅ RMA code ready (needs testing)

### Before Production Deployment

1. **Database Migration**
   - Migrate from SQLite to Neon PostgreSQL
   - Update all database queries
   - Test in staging

2. **Environment Variables Setup**
   ```bash
   # Clerk (Authentication)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
   CLERK_SECRET_KEY=

   # Neon (Database)
   DATABASE_URL=

   # Resend (Email)
   RESEND_API_KEY=

   # PostHog (Analytics)
   NEXT_PUBLIC_POSTHOG_KEY=
   NEXT_PUBLIC_POSTHOG_HOST=

   # Sentry (Error Tracking)
   NEXT_PUBLIC_SENTRY_DSN=
   SENTRY_AUTH_TOKEN=

   # Upstash Redis (Caching)
   UPSTASH_REDIS_REST_URL=
   UPSTASH_REDIS_REST_TOKEN=

   # RMA (Payment)
   RMA_MERCHANT_ID=
   RMA_API_KEY=
   RMA_API_SECRET=
   RMA_API_URL=
   ```

3. **Service Integrations**
   - Set up Resend for emails
   - Set up PostHog for analytics
   - Set up Sentry for error tracking
   - Connect Upstash Redis for rate limiting

4. **Testing**
   - End-to-end testing
   - Security testing
   - Performance testing
   - Mobile testing

5. **Vercel Deployment**
   - Connect GitHub repo to Vercel
   - Configure environment variables
   - Deploy to production
   - Set up custom domain

---

---

## PREMIUM UX/UX DESIGN SYSTEM
### Inspired by Clerk.com - Analysis & Implementation Guide

This section captures the premium UX/UI patterns from Clerk.com that make it feel exceptionally polished and professional.

---

### 🎨 CLERK'S SIGNATURE DESIGN ELEMENTS

#### 1. Circuit Board Background Pattern
**What Clerk Does:** Animated circuit board/tech patterns as hero backgrounds
**Why It Works:** Creates immediate tech credibility, feels modern and premium
**Implementation:**
```tsx
// src/components/ui/circuit-background.tsx
<div className="absolute inset-0 overflow-hidden">
  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" />
  {/* SVG circuit pattern with subtle animation */}
  <svg className="absolute inset-0 w-full h-full opacity-10 dark:opacity-5" aria-hidden>
    <pattern id="circuit" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
      <circle cx="50" cy="50" r="1" fill="currentColor"/>
      <path d="M50 0v100M0 50h100" stroke="currentColor" strokeWidth="0.5"/>
    </pattern>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#circuit)"/>
  </svg>
</div>
```

#### 2. Hero Glow Effects
**What Clerk Does:** Multi-colored glow gradients behind hero text
**Why It Works:** Creates depth, focus, and premium feel
**Colors:** Purple-to-blue gradients, subtle animated pulses
```tsx
// src/components/ui/hero-glow.tsx
<div className="absolute -top-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
<div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
```

#### 3. Premium Card Hover States
**What Clerk Does:** Cards with subtle border glow, lift effect, and inner shadow
```tsx
<div className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:border-purple-300 hover:-translate-y-1">
  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-purple-500/0 to-blue-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
  {/* Content */}
</div>
```

#### 4. User Button / Avatar Popover
**What Clerk Does:** Click avatar → expands with account switcher, settings, sign out
**Key Features:**
- Smooth expand/collapse animation (spring-like)
- Multiple accounts with visual separation
- "Secured by" branding at bottom
- Avatar with initials fallback
```tsx
// Pattern: UserButton → UserPopover → AccountSwitcher + ManageAccount + SignOut
<div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 hover:bg-gray-50">
  <Avatar className="h-8 w-8" />
  <div className="flex flex-col">
    <span className="text-sm font-medium">John Doe</span>
    <span className="text-xs text-gray-500">john@example.com</span>
  </div>
  <ChevronDown className="h-4 w-4 text-gray-400" />
</div>
```

#### 5. Pricing Table Design
**What Clerk Does:** Clean pricing cards with checkmarks, emphasized CTAs, feature highlights
```tsx
<div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
  <div className="mb-4">
    <h3 className="text-2xl font-bold">Pro</h3>
    <p className="text-gray-500">For growing teams</p>
  </div>
  <div className="mb-6">
    <span className="text-4xl font-bold">$20</span>
    <span className="text-gray-500">/month</span>
  </div>
  <ul className="space-y-3 mb-8">
    <li className="flex items-center gap-2">
      <Check className="h-5 w-5 text-green-500" />
      <span>Feature 1</span>
    </li>
  </ul>
  <button className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800">
    Get started
  </button>
</div>
```

#### 6. Sign In/Sign Up Flow
**What Clerk Does:**
- Centered modal/card design
- Social auth buttons with brand colors
- "Last used" indicator for preferred auth method
- Divider line with "or" text
- Clean input fields with focus states
```tsx
// src/components/auth/sign-in-form.tsx
<div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-lg">
  <h2 className="mb-6 text-center text-2xl font-bold">Sign in to your account</h2>

  {/* Social buttons - "Last used" badge */}
  <div className="space-y-3">
    <button className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 px-4 py-3 hover:bg-gray-50">
      <img src="/google.svg" alt="" className="h-5 w-5" />
      <span>Continue with Google</span>
    </button>
  </div>

  {/* Divider */}
  <div className="relative my-6">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-200"></div>
    </div>
    <div className="relative flex justify-center text-sm">
      <span className="bg-white px-2 text-gray-500">or</span>
    </div>
  </div>

  {/* Email input with "Last used" badge */}
  <div className="space-y-4">
    <div className="relative">
      <label className="mb-1 block text-sm font-medium">Email address</label>
      <span className="ml-2 text-xs text-gray-400">Last used</span>
      <input type="email" className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20" />
    </div>
  </div>
</div>
```

#### 7. Organization Switcher
**What Clerk Does:** Multi-account/organization management with visual hierarchy
```tsx
<div className="rounded-xl border border-gray-200 bg-white shadow-lg">
  {/* Current org with avatar */}
  <div className="flex items-center gap-3 p-4 border-b border-gray-100">
    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600 font-semibold">
      AC
    </div>
    <div className="flex-1">
      <div className="font-medium">Acme Corp</div>
      <div className="text-sm text-gray-500">Admin</div>
    </div>
    <ChevronDown className="h-4 w-4 text-gray-400" />
  </div>

  {/* Other accounts */}
  <div className="p-2">
    <button className="flex w-full items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600 text-xs">
        JD
      </div>
      <div className="text-left">
        <div className="text-sm font-medium">John Doe</div>
        <div className="text-xs text-gray-500">Personal account</div>
      </div>
    </button>
  </div>

  {/* Actions */}
  <div className="border-t border-gray-100 p-2">
    <button className="flex w-full items-center gap-2 rounded-lg p-3 text-sm hover:bg-gray-50">
      <Plus className="h-4 w-4" />
      Create organization
    </button>
  </div>

  {/* "Secured by Clerk" footer */}
  <div className="border-t border-gray-100 p-3 text-center text-xs text-gray-400">
    Secured by Career Compass
  </div>
</div>
```

#### 8. Testimonials Section
**What Clerk Does:** Grid of testimonials with company logos, photos, and quotes
```tsx
<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
  {testimonials.map((t) => (
    <div key={t.name} className="rounded-2xl border border-gray-200 bg-white p-8">
      <div className="mb-4 flex items-center gap-4">
        <img src={t.logo} alt="" className="h-10 w-10 opacity-50" />
      </div>
      <p className="mb-6 text-gray-600">"{t.quote}"</p>
      <div className="flex items-center gap-3">
        <img src={t.avatar} alt="" className="h-10 w-10 rounded-full" />
        <div>
          <div className="font-medium">{t.name}</div>
          <div className="text-sm text-gray-500">{t.role}, {t.company}</div>
        </div>
      </div>
    </div>
  ))}
</div>
```

#### 9. Trusted By Logo Grid
**What Clerk Does:** Animated grayscale logos that colorize on hover
```tsx
<div className="flex flex-wrap justify-center gap-8 opacity-60">
  {logos.map((logo) => (
    <img
      key={logo.name}
      src={logo.src}
      alt={logo.name}
      className="h-8 w-auto transition-all hover:opacity-100 hover:saturate-100 grayscale hover:grayscale-0"
    />
  ))}
</div>
```

#### 10. CTA Sections with Glow
**What Clerk Does:** Bottom CTA with glowing background elements
```tsx
<div className="relative overflow-hidden rounded-2xl bg-black p-12 text-white">
  {/* Glow effects */}
  <div className="absolute top-0 left-1/2 h-96 w-96 -translate-x-1/2 bg-purple-500/30 blur-3xl" />
  <div className="absolute bottom-0 right-1/2 h-96 w-96 -translate-x-1/2 bg-blue-500/30 blur-3xl" />

  <div className="relative z-10 text-center">
    <h2 className="mb-4 text-4xl font-bold">Start now, no strings attached</h2>
    <p className="mb-8 text-gray-300">Integrate complete user management in minutes</p>
    <button className="rounded-lg bg-white px-8 py-3 font-medium text-black hover:bg-gray-100">
      Start Building
    </button>
  </div>
</div>
```

#### 11. Navigation/Header
**What Clerk Does:**
- Sticky header with backdrop blur
- Clean logo on left, nav center, CTA right
- Mobile: hamburger menu with smooth slide-in animation
- Active state with underline indicator
```tsx
<header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg">
  <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
    {/* Logo */}
    <a href="/" className="flex items-center gap-2">
      <Logo />
      <span className="font-bold">Career Compass</span>
    </a>

    {/* Desktop nav */}
    <div className="hidden items-center gap-8 md:flex">
      <a href="/product" className="text-gray-600 hover:text-black">Product</a>
      <a href="/pricing" className="text-gray-600 hover:text-black">Pricing</a>
      <a href="/docs" className="text-gray-600 hover:text-black">Documentation</a>
    </div>

    {/* CTA */}
    <div className="flex items-center gap-4">
      <button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
        Sign In
      </button>
    </div>
  </nav>
</header>
```

#### 12. Form Input Styles
**What Clerk Does:**
- 1px border with focus color change
- Subtle focus ring (not too prominent)
- Rounded-lg for modern feel
- Clear label positioning
```tsx
<div className="space-y-4">
  <div>
    <label className="mb-1.5 block text-sm font-medium">Email address</label>
    <input
      type="email"
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
      placeholder="Enter your email"
    />
  </div>
</div>
```

#### 13. Loading & Skeleton States
**What Clerk Does:**
- Subtle pulse animation for skeletons
- Maintains layout during loading
- Gray-200 base color with shimmer effect
```tsx
<div className="animate-pulse space-y-3">
  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
  <div className="h-4 bg-gray-200 rounded"></div>
  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
</div>
```

#### 14. Button Styles
**What Clerk Uses:**
```tsx
// Primary button
<button className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition-colors">
  Button
</button>

// Secondary button
<button className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
  Cancel
</button>

// Ghost button
<button className="text-sm font-medium text-purple-600 hover:text-purple-700">
  Learn more →
</button>
```

#### 15. Theme System (8 Themes)
**What Clerk Offers:** Light, Dark, Simple, Wave, Abstract, Retro, Neobrutalism, Yolo
```tsx
// src/lib/theme-provider.tsx
export const themes = {
  light: {
    background: 'white',
    foreground: '#171717',
    card: '#f5f5f5',
    border: '#e5e5e5',
  },
  dark: {
    background: '#0a0a0a',
    foreground: '#ededed',
    card: '#171717',
    border: '#404040',
  },
  // ... other themes
}
```

---

### 📱 MOBILE OPTIMIZATION PATTERNS

#### 1. Mobile Navigation
- Hamburger menu with full-screen overlay
- Smooth slide-in from right
- Blur backdrop behind menu
- Close button in top-right

#### 2. Responsive Typography
```tsx
<h1 className="text-3xl font-bold sm:text-4xl md:text-5xl lg:text-6xl">
  Hero text
</h1>
```

#### 3. Touch-Friendly Interactions
- Minimum 44x44px touch targets
- Increased padding for mobile buttons
- Finger-friendly spacing between interactive elements

---

### 🎭 ANIMATION PATTERNS

#### Spring Animations (Framer Motion)
```tsx
import { motion } from 'framer-motion'

<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3, ease: 'easeOut' }}
>
  Content
</motion.div>
```

#### Stagger Children
```tsx
{items.map((item, i) => (
  <motion.div
    key={item.id}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: i * 0.1 }}
  >
    {item.content}
  </motion.div>
))}
```

---

### ♿ ACCESSIBILITY PATTERNS (Clerk Focus)

#### 1. Skip Navigation
```tsx
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50">
  Skip to main content
</a>
```

#### 2. Focus Indicators
```tsx
className="focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
```

#### 3. ARIA Labels
```tsx
<button aria-label="Toggle mobile menu" aria-expanded={isOpen}>
  <Menu />
</button>
```

#### 4. Screen Reader Support
- `sr-only` class for hidden accessible text
- `aria-live` regions for dynamic content
- Proper heading hierarchy

---

### 🎨 COLOR PALETTE (Clerk-Inspired)

```typescript
// Primary colors
const primary = {
  50: '#f5f3ff',
  100: '#ede9fe',
  500: '#8b5cf6',  // Violet-500
  600: '#7c3aed',
}

// Semantic colors
const semantic = {
  success: '#10b981',  // Emerald-500
  warning: '#f59e0b',  // Amber-500
  error: '#ef4444',    // Red-500
  info: '#3b82f6',     // Blue-500
}

// Neutral palette
const neutral = {
  50: '#fafafa',
  100: '#f5f5f5',
  200: '#e5e5e5',
  300: '#d4d4d4',
  400: '#a3a3a3',
  500: '#737373',
  600: '#525252',
  700: '#404040',
  800: '#262626',
  900: '#171717',
}
```

---

### 📐 SPACING & LAYOUT SYSTEM

#### Base Spacing Unit: 4px (Tailwind default)
```tsx
const spacing = {
  xs: '0.25rem',  // 4px
  sm: '0.5rem',   // 8px
  md: '1rem',     // 16px
  lg: '1.5rem',   // 24px
  xl: '2rem',     // 32px
  '2xl': '3rem',  // 48px
}
```

#### Container Widths
```tsx
<div className="mx-auto max-w-7xl px-6 sm:px-8">
  {/* Content */}
</div>
```

---

### 🔤 TYPOGRAPHY

#### Font Families (Inter-based)
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

#### Type Scale
```tsx
// Display
<h1 className="text-4xl font-bold sm:text-5xl md:text-6xl lg:text-7xl">

// Headings
<h2 className="text-3xl font-bold sm:text-4xl">

// Body
<p className="text-base text-gray-600 dark:text-gray-400">

// Small
<span className="text-sm text-gray-500">
```

---

### 🖼️ ICON SYSTEM

Use Lucide React (what Clerk uses):
```tsx
import { Check, X, ChevronDown, User, Settings } from 'lucide-react'

<Check className="h-5 w-5 text-green-500" />
<ChevronDown className="h-4 w-4" />
```

---

### 📊 DATA VISUALIZATION

#### Progress Bars
```tsx
<div className="h-2 w-full rounded-full bg-gray-200">
  <div className="h-2 rounded-full bg-purple-500" style={{ width: '75%' }}></div>
</div>
```

#### Stat Cards
```tsx
<div className="rounded-xl border border-gray-200 bg-white p-6">
  <div className="text-sm text-gray-500">Total Users</div>
  <div className="mt-2 text-3xl font-bold">12,345</div>
  <div className="mt-2 text-sm text-green-600">↑ 12% from last month</div>
</div>
```

---

### 🔄 STATE MANAGEMENT FOR UI

#### Loading States
- Skeletons for content
- Spinners for actions
- Optimistic UI updates

#### Error States
- Inline error messages below inputs
- Error boundary fallbacks
- Toast notifications for global errors

#### Empty States
- Illustration or icon
- Clear message
- Call-to-action button

---

## UX/UI Task List

### 🔴 CRITICAL - Fixes That Break Visibility

#### 1. Fix Undefined Tailwind Classes
**Issue:** 7 files use undefined gradient classes like `from-hunter-green-600`, `bg-ash-grey-50`

**Files affected:**
- [ ] `src/app/school-admin/dashboard/page.tsx`
- [ ] `src/lib/routing-manager.ts` - deprecate/fix gradient class definitions
- [ ] `src/app/counselor/page.tsx`
- [ ] `src/components/ai/career-coach.tsx`
- [ ] `src/app/counselor/data-export/page.tsx`
- [ ] `src/app/student/dashboard/page.tsx`

**Fix:** Replace with inline styles using RGB values from portal color scheme above

#### 2. Fix Portal Layouts
**Issue:** `parent` and `counselor` layouts still use broken `getPortalConfig()` with undefined classes

- [ ] `src/app/parent/layout.tsx`
  - Replace `bg-ash-grey-50` → `bg-gray-50`
  - Remove `getPortalConfig` import
  - Use inline style: `linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)`

- [ ] `src/app/counselor/layout.tsx`
  - Replace `bg-ash-grey-50` → `bg-gray-50`
  - Remove `getPortalConfig` import
  - Use inline style: `linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)`

- [ ] `src/app/admin/layout.tsx`
  - Complete rewrite to use PortalSidebar/PortalHeader pattern
  - Use inline style: `linear-gradient(135deg, rgb(236 72 153) 0%, rgb(219 39 119) 100%)`

---

### 🟠 HIGH PRIORITY - Accessibility

#### 3. Navigation ARIA Labels
**File:** `src/components/layout/evolved-nav.tsx`

- [ ] Add `aria-label="Toggle mobile menu"` to mobile menu button
- [ ] Add `aria-expanded={mobileMenuOpen}` to menu button
- [ ] Add `aria-current="page"` to active navigation links
- [ ] Add skip navigation link at top of component

#### 4. Loading States with ARIA
**Pattern to apply:**
```tsx
<div role="status" aria-live="polite" aria-label="Loading">
  <span className="sr-only">Loading content...</span>
  {/* Spinner */}
</div>
```

#### 5. Image Alt Text
- [ ] `src/components/tuition/tutor-profile-card.tsx` - lines 85, 156, 285

---

### 🟡 MEDIUM - Responsive Design

#### 6. Table Responsiveness
**Pattern:**
```tsx
<div className="overflow-x-auto">
  <table className="min-w-full">
    {/* Table content */}
  </table>
</div>
```

**Files:**
- [ ] `src/app/portal/teacher/page.tsx`
- [ ] Any other dashboard with tables

#### 7. Mobile Typography
**File:** `src/app/page.tsx`

- [ ] Fix hero text: `text-5xl sm:text-6xl` → `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`

#### 8. Touch Target Sizes
- [ ] Verify all buttons are minimum 44x44px
- [ ] Check `src/components/ui/button.tsx`

---

### 🟢 LOW - Polish

#### 9. Consistent Animations
Use these transition timings:
- Fast: `duration-200 ease-out`
- Medium: `duration-300 ease-in-out`
- Slow: `duration-500 ease-out`

#### 10. Empty States
- [ ] Create `src/components/ui/empty-state.tsx` component
- [ ] Add empty states to data-heavy pages

---

## Portal Color System

```typescript
// From portal-sidebar.tsx - use these for all portal styling
student:     "rgb(249 115 22) → rgb(194 65 12)"    // Orange
teacher:     "rgb(59 130 246) → rgb(37 99 235)"    // Blue
parent:      "rgb(107 114 128) → rgb(75 85 99)"    // Gray
counselor:   "rgb(168 85 247) → rgb(147 51 234)"   // Purple
admin:       "rgb(236 72 153) → rgb(219 39 119)"   // Pink
school-admin: "rgb(139 92 246) → rgb(124 58 237)" // Violet
```

---

### 📐 LAYOUT PATTERNS

#### Bento Grid Layout
**Clerk's signature card grid layout**
```tsx
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
  {/* Cards with different sizes */}
  <div className="md:col-span-2">Feature highlight</div>
  <div>Stat card</div>
  <div>Small feature</div>
</div>
```

#### Two-Column Feature Sections
**Alternating left-right content**
```tsx
<section className="py-24">
  <div className="mx-auto max-w-7xl px-6">
    <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
      <div>
        <h2>Feature title</h2>
        <p>Description...</p>
      </div>
      <div className="rounded-xl border border-gray-200 p-8">
        {/* Visual/demo */}
      </div>
    </div>
  </div>
</section>
```

---

### 🎨 PREMIUM COMPONENT PATTERNS

#### 1. Card with Integrated Action
```tsx
<div className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:shadow-lg">
  <div className="p-6">
    <h3 className="text-xl font-bold">Feature</h3>
    <p className="mt-2 text-gray-600">Description</p>
  </div>
  <div className="border-t border-gray-100 p-4">
    <button className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white transition-colors hover:bg-purple-700">
      Learn more
    </button>
  </div>
</div>
```

#### 2. Code Block with Copy
```tsx
<div className="rounded-xl border border-gray-200 bg-gray-900 p-4">
  <div className="mb-4 flex items-center justify-between">
    <span className="text-sm text-gray-400">Code</span>
    <button className="text-xs text-gray-400 hover:text-white">Copy</button>
  </div>
  <pre className="overflow-x-auto"><code className="text-sm">...</code></pre>
</div>
```

#### 3. Feature List with Icons
```tsx
<ul className="space-y-4">
  {features.map((feature) => (
    <li key={feature.title} className="flex items-start gap-3">
      <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-100">
        <Check className="h-4 w-4 text-purple-600" />
      </div>
      <div>
        <h4 className="font-semibold">{feature.title}</h4>
        <p className="text-sm text-gray-600">{feature.description}</p>
      </div>
    </li>
  ))}
</ul>
```

#### 4. Comparison Table
```tsx
<table className="w-full">
  <thead>
    <tr className="border-b border-gray-200">
      <th className="py-3 text-left text-sm font-medium">Feature</th>
      <th className="py-3 text-center text-sm font-medium">Free</th>
      <th className="py-3 text-center text-sm font-medium bg-purple-50">Pro</th>
    </tr>
  </thead>
  <tbody>
    {rows.map((row) => (
      <tr key={row.feature} className="border-b border-gray-100">
        <td className="py-3 text-sm">{row.feature}</td>
        <td className="py-3 text-center">
          {row.free ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-gray-300" />}
        </td>
        <td className="py-3 text-center bg-purple-50/50">
          {row.pro ? <Check className="mx-auto h-5 w-5 text-green-500" /> : <X className="mx-auto h-5 w-5 text-gray-300" />}
        </td>
      </tr>
    ))}
  </tbody>
</table>
```

#### 5. Badge/Tag Styles
```tsx
// Primary badge
<span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700">
  New
</span>

// Success badge
<span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
  Active
</span>

// Outline badge
<span className="inline-flex items-center rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700">
  Beta
</span>
```

#### 6. Alert/Notification Banners
```tsx
<div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
  <div className="flex items-start gap-3">
    <Info className="h-5 w-5 text-purple-600 mt-0.5" />
    <div>
      <h4 className="font-medium text-purple-900">New feature</h4>
      <p className="mt-1 text-sm text-purple-700">Description of the new feature...</p>
    </div>
    <button className="ml-auto text-purple-400 hover:text-purple-600">
      <X className="h-4 w-4" />
    </button>
  </div>
</div>
```

#### 7. Tabs Navigation
```tsx
<div className="border-b border-gray-200">
  <nav className="-mb-px flex gap-8" aria-label="Tabs">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        className={cn(
          "border-b-2 py-4 text-sm font-medium transition-colors",
          activeTab === tab.id
            ? "border-purple-600 text-purple-600"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
        )}
      >
        {tab.label}
      </button>
    ))}
  </nav>
</div>
```

#### 8. Accordion/Collapsible
```tsx
<div className="rounded-xl border border-gray-200">
  {items.map((item, i) => (
    <div key={i} className="border-b border-gray-200 last:border-0">
      <button className="flex w-full items-center justify-between p-4 text-left font-medium hover:bg-gray-50">
        {item.title}
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="p-4 pt-0 text-sm text-gray-600">
          {item.content}
        </div>
      )}
    </div>
  ))}
</div>
```

---

### 🎭 INTERACTION STATES

#### Button States
```tsx
<button className="rounded-lg bg-purple-600 px-4 py-2 text-white transition-all hover:bg-purple-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed">
  Button
</button>
```

#### Link States
```tsx
<a className="text-purple-600 underline-offset-4 hover:text-purple-700 hover:underline">
  Link text
</a>
```

#### Input Focus States
```tsx
<input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 disabled:cursor-not-allowed disabled:bg-gray-100" />
```

---

### 📱 MOBILE-SPECIFIC PATTERNS

#### Bottom Sheet (Mobile)
```tsx
<div className="fixed inset-x-0 bottom-0 rounded-t-2xl border border-gray-200 bg-white p-6 shadow-2xl md:hidden">
  <div className="mb-4 flex items-center justify-center">
    <div className="h-1 w-12 rounded-full bg-gray-300" />
  </div>
  {/* Content */}
</div>
```

#### Mobile Navigation Drawer
```tsx
{/* Overlay */}
<div className={cn("fixed inset-0 bg-black/50 transition-opacity", isOpen ? "opacity-100" : "pointer-events-none opacity-0")} onClick={close} />

{/* Drawer */}
<div className={cn("fixed right-0 top-0 h-full w-80 bg-white shadow-xl transition-transform", isOpen ? "translate-x-0" : "translate-x-full")}>
  {/* Nav content */}
</div>
```

---

### 🌓 DARK MODE PATTERNS

```tsx
// Use CSS variables for theming
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --primary: 262.1 83.3% 57.3%;
  --border: 214.3 31.8% 91.4%;
}

.dark {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
}
```

---

### ⚡ PERFORMANCE OPTIMIZATIONS

#### Image Optimization
```tsx
import Image from 'next/image'

<Image
  src="/hero.png"
  alt="Hero"
  width={1200}
  height={630}
  priority
  className="rounded-2xl"
/>
```

#### Lazy Loading Components
```tsx
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div className="animate-pulse h-32 bg-gray-200 rounded" />,
})
```

---

### 🎯 COPYWRITING PATTERNS (Clerk Style)

#### Hero Headlines
- "More than authentication, Complete User Management"
- "Plans for every stage"
- "Start now, no strings attached"

#### Value Propositions
- Clear: "The easiest way to add authentication"
- Specific: "50,000 monthly retained users included"
- Trust: "Trusted by fast-growing companies"

#### Button Copy
- Action-oriented: "Start building", "Get started"
- Clear value: "View pricing", "Read documentation"
- Low friction: "Sign in", "Create account"

---

### 🧩 COMPONENTS TO CREATE (Based on Clerk)

1. ✅ `circuit-background.tsx` - Animated circuit board pattern
2. ✅ `hero-glow.tsx` - Multi-colored glow effects
3. ✅ `user-button.tsx` - Avatar dropdown with account switcher
4. ✅ `organization-switcher.tsx` - Multi-org management
5. ✅ `pricing-card.tsx` - Premium pricing tables
6. ✅ `testimonial-grid.tsx` - Testimonials with photos
7. ✅ `trusted-logos.tsx` - Animated logo grid
8. ✅ `cta-section.tsx` - Glowing CTA blocks
9. ✅ `form-input.tsx` - Clerk-style inputs
10. ✅ `loading-skeleton.tsx` - Premium skeleton states
11. ✅ `navigation.tsx` - Sticky header with backdrop
12. ✅ `mobile-menu.tsx` - Full-screen overlay menu

---

## Known Issues

### Color System Conflict
- `design-system/tokens/index.ts` defines navy/teal/terra-cotta palette
- `globals.css` uses orange/silver theme
- **Decision:** Stick with orange/silver (already implemented)

### Never Use These Classes (They Don't Exist)
- `from-hunter-green-*`, `to-hunter-green-*`
- `from-powder-blue-*`, `to-powder-blue-*`
- `from-ash-grey-*`, `to-ash-grey-*`
- `from-oxidized-iron-*`, `to-oxidized-iron-*`
- `from-lobster-pink-*`, `to-lobster-pink-*`
- `bg-ash-grey-*`

### Always Use Inline Styles for Gradients
```tsx
// ✅ Correct - works
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>

// ❌ Wrong - class doesn't exist
<div className="bg-gradient-to-r from-hunter-green-600 to-hunter-green-700">
```

---

## Fedena Feature Reference (Research)

**Source:** [Fedena.com](https://fedena.com/) - 40,000+ schools worldwide, 100+ modules

This section documents all features from Fedena (a comprehensive school management system) for reference when building Career Compass.

### Fedena User Roles
| Role | Access Level |
|------|-------------|
| **Admin** | Full system access, configuration, user management |
| **Student** | Academics, assignments, exams, timetable, library, discussions |
| **Teacher** | Attendance, exams, gradebook, assignments, timetable, classes |
| **Parent** | Child's academics, attendance, fee payment, communication |
| **Employee** | Payslips, leave management, attendance, tasks, messages |
| **Librarian** | Library management, book issues, returns, catalog |
| **Accountant** | Finance categories, fee collection, expenses, reports |
| **Gate Manager** | Mobile app-based entry/exit logging |

### Fedena Core Modules (30)

| Module | Features | Career Compass Status |
|--------|----------|----------------------|
| **Settings & Configuration** | General settings, subject management | ✅ Implemented |
| **Courses & Batches** | Class management, batch scheduling | ✅ Implemented |
| **Student Management** | Admissions, profiles, search | ✅ Implemented |
| **Student Roll Numbers** | Auto roll number generation | ⏳ TODO |
| **Human Resources** | Employee categories, departments, profiles | ⏳ Partial |
| **User Management** | User profiles, permissions, access control | ✅ Via Clerk |
| **Timetable Management** | Class timing, timetable workflow | ⏳ TODO |
| **Finance** | Finance categories, expenses, reports | ⏳ Partial |
| **Fee Collection** | Fee categories, transactions, due management | ✅ Implemented |
| **News Management** | News publishing, announcements | ⏳ TODO |
| **Payslip Processing** | Employee payslips, payroll | ⏳ TODO |
| **Employee Attendance/Leave** | Leave types, attendance tracking | ⏳ TODO |
| **Internal Messages** | User-to-user messaging | ⏳ TODO |
| **Event Calendar** | Event creation, calendar integration | ⏳ TODO |
| **Reports** | Custom reports, student/employee reports | ⏳ Partial |
| **SMS Settings** | SMS configuration, auto-triggers | ⏳ TODO |
| **SMS Messaging** | Bulk SMS to students/parents | ⏳ TODO |
| **Student Attendance** | Daily/subject-wise attendance | ✅ Implemented |
| **Examination (5 systems)** | CCE, Normal, GPA, CWA, ICSE grading | ⏳ Partial |
| **Auto Notifications** | SMS, email, internal message automation | ⏳ TODO |
| **Gradebook** | Performance tracking, report cards | ⏳ TODO |
| **Certificates & ID Cards** | Certificate generation, ID cards | ⏳ TODO |
| **Gate Management** | Mobile app entry/exit logging | ⏳ TODO |
| **Paybook Integration** | Accounting software sync | ⏳ TODO |

### Fedena Add-On Modules (33)

| Module | Features | Career Compass Status |
|--------|----------|----------------------|
| **Enquiry & Registration** | Online registration, lead management | ⏳ TODO |
| **Library Management** | Catalog, book issues, reservations | ⏳ TODO |
| **Hostel Management** | Room allocation, hostel fees | ⏳ TODO |
| **Transport Management** | Routes, vehicle tracking, GPS | ⏳ API exists |
| **Assignment Module** | Create, submit, grade assignments | ✅ Implemented |
| **Custom Import** | Bulk CSV data import | ⏳ TODO |
| **Custom Report** | Custom student/employee reports | ⏳ TODO |
| **Discussion Module** | Discussion groups, posts, comments | ⏳ TODO |
| **Online Payment** | Payment gateway integration | ✅ RMA code ready |
| **Inventory Management** | Store items, stock, purchase orders | ⏳ API exists |
| **Tasks Module** | Task assignment, tracking, comments | ⏳ TODO |
| **Poll Module** | Create polls, collect opinions | ⏳ TODO |
| **Gallery Module** | Photo albums, bulk upload | ⏳ TODO |
| **Blog Module** | Student/employee blogs | ⏳ TODO |
| **Data Management** | Custom categories, fields | ⏳ TODO |
| **Placement Module** | Company management, placement tracking | ⏳ TODO |
| **Mobile Version** | Mobile-optimized interface | ⏳ TODO |
| **Google SSO** | Google account integration | ⏳ Via Clerk |
| **Tally Integration** | Accounting software sync | ⏳ TODO |
| **Themes** | Color/theme customization | ⏳ Partial |
| **Online Exam** | Question bank, auto-grading | ⏳ TODO |
| **OAuth 2 Provider** | API tokens, third-party integration | ⏳ TODO |
| **Data Palette** | Dashboard customization | ⏳ TODO |
| **API Module** | API access for custom apps | ⏳ Partial |
| **Applications** | External app access | ⏳ TODO |
| **Audit Module** | Activity logging, change history | ⏳ TODO |
| **Alumni Module** | Alumni database, networking | ⏳ TODO |
| **Azure AD SSO** | Azure Active Directory integration | ⏳ Via Clerk |
| **Reminder Module** | Event/fee reminders | ⏳ TODO |
| **Fee Import** | Bulk fee assignment | ⏳ TODO |
| **Collaboration Module** | Zoom/Meet integration, online classes | ⏳ TODO |
| **Fedena Learn** | LMS integration, course delivery | ⏳ Learning modules exist |

### Fedena Integrations

| Integration | Purpose | Career Compass Status |
|-------------|---------|----------------------|
| **Payment Gateway** | Online fee collection | ✅ RMA Bhutan |
| **GPS Tracking** | Real-time bus tracking | ⏳ TODO |
| **Biometric** | Automated attendance | ⏳ TODO |
| **Video Conferencing** | Zoom/Meet for online classes | ⏳ TODO |
| **Email** | Automatic email notifications | ⏳ Resend planned |

### Key Insights for Career Compass

1. **Holistic Approach** - Fedena covers entire student lifecycle from enquiry to alumni
2. **Multi-Stakeholder** - Designed for 8+ user roles with different access levels
3. **Extensible** - API-first architecture allows custom integrations
4. **Modern Features** - Online exams, video conferencing, mobile apps, biometric
5. **Financial Focus** - Extensive fee management and finance modules
6. **Communication Heavy** - SMS, email, messaging, collaboration tools

### Career Compass vs Fedena Feature Gap

| Feature Area | Fedena | Career Compass | Gap |
|--------------|--------|----------------|-----|
| **Career Guidance** | ❌ No | ✅ Yes | - |
| **School Management** | ✅ Full | ⏳ ~60% | Attendance, Homework, Fees done |
| **Timetable** | ✅ Yes | ❌ No | TODO |
| **Library** | ✅ Yes | ❌ No | TODO |
| **Hostel** | ✅ Yes | ❌ No | TODO |
| **Transport** | ✅ Yes + GPS | ⏳ Partial | TODO |
| **Inventory** | ✅ Yes | ⏳ Partial | TODO |
| **Online Exam** | ✅ Yes | ❌ No | TODO |
| **Discussion/Blog** | ✅ Yes | ❌ No | TODO |
| **Alumni** | ✅ Yes | ❌ No | TODO |
| **Placement** | ✅ Yes | ❌ No | TODO |
| **SMS/Email** | ✅ Yes | ⏳ Planned | TODO |
| **Mobile App** | ✅ Yes | ❌ No | TODO |
| **Biometric** | ✅ Yes | ❌ No | TODO |
| **Tuition Marketplace** | ❌ No | ✅ Yes | - |
| **AI Career Coach** | ❌ No | ✅ Yes | - |

---

## Development Server

```bash
cd "c:/Users/pc/AI Career/career-guidance"
npm run dev
```

URL: http://localhost:3002 (may vary)

---

## Portal URLs

| Portal | URL |
|--------|-----|
| Student | `/student` |
| Teacher | `/teacher` |
| Parent | `/parent` |
| Counselor | `/counselor` |
| Admin | `/admin` |
| School Admin | `/school-admin` |

---

## Git Notes

- Branch: `main` (verify with `git branch`)
- Remote: (check with `git remote -v`)
- Always pull before starting work: `git pull origin main`

---

## ERROR FIX - Build Errors (Feb 2025)

### ✅ Already Fixed
- [x] CSS: `border-border` → Tailwind v4 `@theme` syntax
- [x] Interface naming: `RPMA PaymentRequest` → `RMAPaymentRequest`
- [x] Icon import: `Record` → `Circle` (lucide-react)
- [x] Next.js 16 params: `{ params: { id: string } }` → `{ params: Promise<{ id: string }> }`
- [x] orderBy syntax: `[col, "desc"]` → `desc(col)`
- [x] Zod errors: `error.errors` → `error.issues`
- [x] Missing `createdAt` fields in assessment inserts
- [x] Boolean values: `isTopMatch: 1` → `isTopMatch: true`

### 🔴 CRITICAL - Remaining Build Errors

#### 1. Boolean Type Errors (SQLite expects `true/false`, not `1/0`)
- [ ] Fix `counselor-notes/route.ts:93` - `isPrivate: isPrivate ? 1 : 0` → `isPrivate: !!isPrivate`
- [ ] Fix `school-admin/subjects/[id]/route.ts:64` - `isActive: isActive ? 1 : 0` → `isActive: !!isActive`

#### 2. External Schema Imports (Tables not integrated into main DB schema)
These API routes reference tables in separate schema files that aren't in the main DB schema:
- [ ] `transport/routes/route.ts` - Needs simplification
- [ ] `library/circulation/route.ts` - Needs simplification
- [ ] `library/books/route.ts` - Needs simplification
- [ ] `communication/messages/route.ts` - Needs simplification

---

## Key Features Summary

### For Students
- ✅ Career assessments (RIASEC, MBTI, DISC, Learning Styles)
- ✅ Career exploration and recommendations
- ✅ Homework submission and tracking
- ✅ Learning modules
- ✅ Tuition marketplace
- ✅ Fee payment tracking

### For Teachers
- ✅ Class management
- ✅ Homework creation and grading
- ✅ Attendance tracking
- ✅ Learning module creation
- ✅ Class analytics

### For Parents
- ✅ Child progress tracking
- ✅ Assessment results
- ✅ Homework monitoring
- ✅ Fee payments

### For Counselors
- ✅ Student data access
- ✅ Career planning tools
- ✅ Assessment results
- ✅ Data export

### For School Admins
- ✅ Complete school management
- ✅ Student/teacher management
- ✅ Attendance oversight
- ✅ Fee management
- ✅ Analytics and reports
- ✅ Tuition marketplace

### For Platform Admins
- ✅ Multi-tenant management
- ✅ School registration
- ✅ System analytics
- ✅ Content management

---

**Last Updated:** February 2026
**Project Status:** In Active Development
**Local URL:** http://localhost:3002
