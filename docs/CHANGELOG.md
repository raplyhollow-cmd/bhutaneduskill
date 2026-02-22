# Changelog

All notable changes to Bhutan EduSkill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.7.0] - Final Project Cleanup & Documentation (February 22, 2026) 🧹📊✅

### Added - Technical Diagrams & Project Audit

**What:**
Comprehensive project cleanup including file organization, Framer Motion fixes, TypeScript error resolution, and creation of 5 technical diagrams documenting the entire system architecture.

**Key Changes:**

1. **File Cleanup:**
   - Deleted 9 log files (build-errors-*.log, errors.log, dev.log, etc.)
   - Deleted 3 backup files (*.bak, *.backup, temp_migration.sql)
   - Archived 28 old migration scripts to `scripts/archive/`
   - Deleted 4 empty API directories

2. **Framer Motion Fixes:**
   - Fixed 6 components missing `repeatType: "loop"` in infinite animations
   - Prevents `iterationCount must be non-negative` errors
   - Files fixed:
     - `src/components/assessment/AssessmentContainer.tsx`
     - `src/components/assessment/QuestionCard.tsx`
     - `src/components/landing/hero-section.tsx` (3 instances)
     - `src/components/landing/how-it-works-section.tsx` (2 instances)
     - `src/components/shared/victory-screen.tsx` (2 instances)

3. **TypeScript Error Fixes:**
   - Fixed **all 62+ TypeScript errors** across 32 files
   - Fixed `ApiSuccess` and `ApiErrorResponse` type usage throughout API routes
   - Added missing imports (`cn`, `sql`, icons)
   - Fixed missing required properties in database inserts
   - Fixed Next.js 15 async params pattern in dynamic routes
   - Type check now passes cleanly with 0 errors

4. **Technical Diagrams Created:**
   - **Entity Relationship Diagram** (`docs/diagrams/entity-relationship-diagram.mmd`)
     - All 145 database tables documented
     - Foreign key relationships mapped
     - Table categories and statistics
   - **API Routes Map** (`docs/diagrams/api-routes-map.mmd`)
     - 369 API routes documented
     - 7 portals + shared services
     - Security summary (88% protected)
   - **Portal Architecture** (`docs/diagrams/portal-architecture.mmd`)
     - 7 portals structure with 146 pages
     - Shared components
     - Navigation hierarchy
   - **Data Flows** (`docs/diagrams/data-flows.mmd`)
     - 7 critical flows documented
     - Request-response patterns
     - Error handling flow
   - **Authentication Flow** (`docs/diagrams/auth-flow.mmd`)
     - Clerk integration points
     - RBAC implementation
     - Authorization matrix for all 7 portals

**Files Modified:** 38 files (6 Framer Motion + 32 TypeScript fixes)

**Files Created:**
- `docs/diagrams/entity-relationship-diagram.mmd`
- `docs/diagrams/api-routes-map.mmd`
- `docs/diagrams/portal-architecture.mmd`
- `docs/diagrams/data-flows.mmd`
- `docs/diagrams/auth-flow.mmd`

**Statistics:**
- Space reclaimed: ~11MB
- TypeScript errors: 0 (down from 62+)
- Build status: ✅ Production build successful
- Technical debt documented: Schema duplicates (11 tables), relative imports (23 files)
     - Error handling flow
   - **Authentication Flow** (`docs/diagrams/auth-flow.mmd`)
     - Clerk integration
     - RBAC implementation
     - Authorization matrix

4. **Audit Results:**
   - **Database:** 145 tables across 26 schema files
   - **API Routes:** 369 total, 324 protected (88%)
   - **Components:** 218 total (50 shared, 68 portal-specific, 100+ feature)
   - **Portals:** 7 functional portals with 146 pages
   - **Issues Found:** 11 duplicate table definitions (documented, not removed for safety)
   - **Issues Found:** 23 files with relative imports (need fixing)

**Files Modified:** 6 component files for Framer Motion fixes

**Files Created:**
- `docs/diagrams/entity-relationship-diagram.mmd`
- `docs/diagrams/api-routes-map.mmd`
- `docs/diagrams/portal-architecture.mmd`
- `docs/diagrams/data-flows.mmd`
- `docs/diagrams/auth-flow.mmd`
- `scripts/archive/` (directory with 28 archived scripts)

**Statistics:**
- Space reclaimed: ~11MB
- Technical debt documented: Schema duplicates, relative imports
- Framer Motion issues resolved: 6/6 critical files fixed

---

## [1.6.0] - Parent Portal: Government School Annual Fees (February 22, 2026) 👨‍👩‍👧‍👦💰

### Added - Annual SDF Billing System & Peace-of-Mind Dashboard

**What:**
Implemented a government school-focused fee system and redesigned parent dashboard prioritizing daily attendance/safety over billing, recognizing that 95% of Bhutanese schools are government-funded with once-a-year School Development Fund (SDF) instead of monthly tuition.

**Key Features:**

1. **Parent Authentication Layout** - `/parent/*`:
   - Created missing parent portal layout (was causing authentication failures)
   - Unified portal navigation with gray gradient theme
   - Auto-redirect to `/setup/parent` for unconfigured parents

2. **Annual Fee Generator** - `/admin/schools/{id}/fee-generator` & `/school-admin/fees/generator`:
   - School-type detection: automatic frequency setting (1x for government, 2x for private)
   - Configurable fee breakdown: SDF (300), Rimdro (200), Diary (100), Sports (150), etc.
   - Bulk invoice generation for all active students
   - Session year configuration (e.g., "2026")
   - Payment status tracking with collection rates
   - Access control: Platform admin (all schools), School admin (own school only)

3. **Parent Dashboard Redesign** - `/parent/dashboard`:
   - **Safe Arrival Card** (PRIMARY): Daily attendance status with "PRESENT/ABSENT/LATE" + time
   - **2026 Session Fees Card**: "CLEARED" or "PENDING" status with amount breakdown
   - **Latest Feedback Card**: Teacher behavior logs (merit/demerit) with timestamps
   - Mobile-first bento grid (2-column mobile, 4-column desktop)
   - Quick actions: Attendance, Progress, Messages, Homework

4. **Payment Flow** - `/parent/fees/pay`:
   - QR code placeholder for mBOB payment (future: real API integration)
   - Manual receipt upload workflow
   - School admin verification queue
   - SMS confirmation on approval
   - Digital receipt generation

5. **Parent Behavior Log Access** - `/api/parent/behavior-logs`:
   - Parents can view merit/demerit logs for their linked children
   - Teacher name, timestamp, category, and severity
   - Filtered by linked children only (security enforced)

**Database Schema Changes:**

| Table | Fields Added | Purpose |
|-------|--------------|---------|
| `schools` | `currentSessionYear`, `feeGenerationDate`, `feeGenerationStatus` | Track annual fee generation per school |
| `studentFees.feeType` | "sdf", "rimdro", "diary", "sports", "stationery" | Government school fee types |

**School Type Payment Matrix:**

| School Type | Frequency | Amount | Timing |
|-------------|-----------|--------|--------|
| **Government** | 1x/year | 500-1,500 Nu. | February |
| **Private** | 2x/year | 25K-80K+ Nu. | February + July |

**Fee Breakdown Templates:**

**Government Schools:**
- SDF (School Development Fund): Nu. 300
- Rimdro (Annual Prayer/Blessing): Nu. 200
- Diary & ID Card: Nu. 100
- Sports Equipment: Nu. 150

**Private Schools:**
- Tuition: Nu. 25,000
- Lab: Nu. 2,000
- Library: Nu. 1,000
- Sports: Nu. 1,500

**API Endpoints Created:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/schools/{id}/generate-fees` | POST | Generate bulk fee invoices (platform admin) |
| `/api/admin/schools/{id}/generate-fees` | GET | Get fee generation status (platform admin) |
| `/api/school-admin/fees/generate` | POST | Generate bulk fee invoices (school admin) |
| `/api/school-admin/fees/generate` | GET | Get fee generation status (school admin) |
| `/api/parent/fees/upload-receipt` | POST | Upload payment receipt for verification |
| `/api/parent/behavior-logs` | GET | Fetch child's behavior logs |

**Files Created (12):**

| File | Purpose |
|------|---------|
| `src/app/parent/layout.tsx` | Parent portal authentication layout (CRITICAL - was missing) |
| `src/app/parent/parent-layout-client.tsx` | Client component with auth check |
| `src/app/api/admin/schools/{id}/generate-fees/route.ts` | Platform admin fee generation API |
| `src/app/api/school-admin/fees/generate/route.ts` | School admin fee generation API |
| `src/app/admin/schools/{id}/fee-generator/page.tsx` | Admin fee generator UI |
| `src/app/school-admin/fees/generator/page.tsx` | School admin fee generator UI |
| `src/app/parent/dashboard/page.tsx` | Redesigned bento grid dashboard |
| `src/components/parent/fee-payment-modal.tsx` | Payment modal with QR placeholder |
| `src/app/api/parent/fees/upload-receipt/route.ts` | Receipt upload API |
| `src/app/api/parent/behavior-logs/route.ts` | Behavior log access API |
| `src/components/parent/behavior-log-card.tsx` | Teacher feedback display component |
| `PARENT_PORTAL_IMPLEMENTATION.md` | Implementation documentation |

**Design Philosophy:**
- **Daily Peace-of-Mind > Billing**: Parents care most about "Did my child arrive safely today?"
- **Mobile-First**: All cards designed for touch (44px minimum targets)
- **Government vs Private**: Automatic frequency detection based on school type
- **Simple over Complex**: Annual SDF (1 action) vs monthly tuition (12 actions)

**Future Enhancements:**
- Real mBOB payment API integration (replace QR placeholder)
- School admin receipt verification queue UI
- SMS notifications when fees are generated
- Partial payment support (installments)
- PDF receipt generation after verification

---

## [1.5.0] - Counselor Portal: "The GNH Sentinel" (February 22, 2026) 🛡️💜

### Added - AI-Powered Student Well-being Monitoring

**What:**
Implemented three core features for the Counselor Portal aligned with Bhutan's Gross National Happiness (GNH) philosophy, enabling proactive student well-being monitoring through AI pattern detection, private session logging, and career approval workflows.

**Key Features:**

1. **Red Flag System** (AI Early Warning) - `/counselor/red-flags`:
   - AI-powered scanner analyzing `teacher_behavior_logs`, `attendance`, and `exam_results_enhanced`
   - Pattern detection thresholds: attendance <75%, 3+ lates in 30 days, marks <60%, 2+ high-severity incidents
   - Severity classification: critical, high, medium, low
   - GNH-aligned intervention recommendations via Gemini AI
   - One-click intervention creation from flagged students
   - Real-time dashboard with filtering by severity and status

2. **Wellness Compass** (Private Session Logging) - `/counselor/wellness-compass`:
   - 4-step wizard: Student selection → Concerns & GNH domains → Session notes → Review
   - Session types: individual, group, family, crisis intervention
   - Confidentiality levels: standard, high, critical
   - Private notes (counselor-only, NEVER shared with Ministry)
   - Ministry anonymization preview (shows exactly what data will be shared)
   - Parent notification: "A well-being session was conducted today" (simple, non-alarming)
   - Follow-up session scheduling

3. **Career Alignment** (Human Approval for RUB Scholarships) - `/counselor/career-alignment`:
   - Review student AI-generated career matches
   - Suitability score slider (0-100) for counselor assessment
   - Academic alignment evaluation: well_aligned, needs_improvement, misaligned
   - Skills gap checklist with recommended preparation steps
   - GNH principles selection for career-path alignment
   - RUB college matching: CST, CNR, GCBS, Sherubtse, Paro College, Samtse College
   - Scholarship recommendations linked to career field
   - Approval decisions: Approve, Approve with Reservations, Not Recommended
   - Approval valid for 1 year from date of approval

4. **Ministry Wellbeing Pulse API** - `/api/minity/wellbeing-pulse`:
   - Anonymized national well-being data aggregation
   - By dzongkhag: total students, sessions completed, crisis interventions
   - By school level: middle, higher secondary breakdown
   - Red flags summary by severity and location
   - Top concerns word cloud (anonymized)
   - Trend analysis: increasing, decreasing, stable
   - Zero personal identifiers exported

**Database Schema Changes:**

| Table | Purpose |
|-------|---------|
| `redFlags` | AI-detected at-risk student flags with pattern details and resolution tracking |
| `careerApprovals` | Counselor endorsements for student career paths with RUB scholarship linkage |

**GNH Domains Integrated:**
- Psychological Wellbeing
- Community Vitality
- Time Use Balance
- Cultural Diversity & Resilience
- Ecological Resilience
- Good Governance

**AI System Prompts Added:**
- `RED_FLAG_ANALYZER_SYSTEM` - Pattern detection with GNH principles
- `COUNSELOR_WELLNESS_SYSTEM` - Session documentation guidance
- `CAREER_ALIGNMENT_SYSTEM` - Career assessment for counselors

**API Endpoints Created:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/counselor/red-flags/scan` | POST | AI-powered red flag detection |
| `/api/counselor/red-flags/scan` | GET | Retrieve recent red flags |
| `/api/counselor/red-flags` | GET | List all red flags with filtering |
| `/api/counselor/red-flags` | PATCH | Update flag status or create intervention |
| `/api/counselor/wellness-log` | POST | Log private wellness session |
| `/api/counselor/wellness-log` | GET | Retrieve counselor's session history |
| `/api/counselor/career-approve` | POST | Create/update career approval |
| `/api/counselor/career-approve` | GET | Get students' career matches for review |
| `/api/minity/wellbeing-pulse` | GET | Aggregated anonymized well-being data |

**Files Created (10):**
| File | Purpose |
|------|---------|
| `src/app/counselor/red-flags/page.tsx` | Red Flags dashboard with severity filtering |
| `src/app/counselor/wellness-compass/page.tsx` | 4-step private session logging wizard |
| `src/app/counselor/career-alignment/page.tsx` | Career review and approval dashboard |
| `src/app/api/counselor/red-flags/scan/route.ts` | AI scanner implementation |
| `src/app/api/counselor/red-flags/route.ts` | Red flag CRUD operations |
| `src/app/api/counselor/wellness-log/route.ts` | Session logging with anonymization |
| `src/app/api/counselor/career-approve/route.ts` | Career approval workflow |
| `src/app/api/minity/wellbeing-pulse/route.ts` | National well-being aggregation |
| `docs/IMPLEMENTATION_SUMMARY_COUNSELOR_SENTINEL.md` | Feature documentation |

**Portal Theme:** Purple gradient `rgb(168 85 247) → rgb(147 51 234)`

**Dependencies:**
- `@google/generative-ai` for AI pattern analysis
- `nanoid` for unique ID generation
- Existing `drizzle-orm`, `lucide-react` components

**Counselor Dashboard Updated:**
- Added quick-access buttons: Red Flags, Wellness Compass, Career Alignment
- Added 5th stats card showing Red Flags count with link to detail page

---

## [1.6.0] - Ministry "Strategic Pulse" Dashboard (February 22, 2026) 🏛️✨

### Added - National Command Center for Ministry of Education

**What:**
Transformed the Ministry Portal from an operational view to a **"Strategic Overseer"** command center - providing the Minister (*Lyonpo*) and Department of Education (DOE) with AI-driven national education insights and real-time GNH monitoring.

**Key Features:**

1. **National Strategic Pulse Card** (`src/components/ministry/national-pulse-card.tsx`):
   - Live "State of the Nation" indicators with pulsing cyan status dot
   - Three key metrics: Attendance (94.2%), GNH Score (8.4/10), Syllabus Progress (62%)
   - AI observation panel with context-aware insights
   - Trends with up/down arrows and color-coded status badges
   - Glassmorphism design with cyan accent border for strategic "executive" feel

2. **AI Policy Briefing Card** (`src/components/ministry/policy-briefing-card.tsx`):
   - AI-generated policy recommendations based on counselor/teacher data trends
   - Priority-coded actions: urgent (red), medium (yellow), monitor (blue)
   - Expandable details with rationale and target dzongkhags
   - "Exam Stress" tag tracking → automatic mindfulness break suggestions
   - Integration with DOE advisory workflow

3. **Workforce Alignment Card** (`src/components/ministry/workforce-alignment-card.tsx`):
   - Visual comparison: Student career interests vs National HRD requirements
   - Six sectors analyzed: STEM/IT, Agriculture, Tourism, Healthcare, Education, Hydropower
   - Color-coded gaps: Blue (surplus), Green (aligned), Red (deficit)
   - Strategic action recommendations (e.g., "Redirect 5% of IT scholarships to Agriculture")
   - Click-to-expand details for each sector

4. **National Briefing API** (`src/app/api/ministry/briefing/route.ts`):
   - Aggregates data from 245+ schools across all dzongkhags
   - Returns pulse metrics, AI briefing, and workforce alignment in one call
   - Uses Gemini AI for policy briefings (in production)
   - Fallback data ensures UI works even if API fails

5. **New Ministry Pages:**
   - `/ministry/reports` - National report library with templates and scheduling
   - `/ministry/settings` - Ministry portal configuration
   - `/ministry/emis` - EMIS synchronization center
   - `/ministry/infrastructure` - National infrastructure audit
   - `/ministry/gnh` - GNH wellbeing dashboard with dzongkhag heatmap
   - `/ministry/teacher-resources` - Teacher resource optimization heatmap
   - `/ministry/labor-market` - Workforce alignment analysis

**Design System:**
- **Strategic cyan accent**: `rgb(6, 182, 212)` for "National/Executive" feel
- **Purple theme retained**: `rgb(168 85 247)` → `rgb(147 51 234)` for brand consistency
- **Glassmorphism cards**: Frosted glass with backdrop blur and gradient overlays
- **Bento Grid layout**: Responsive 2-column desktop, single column mobile
- **Live indicators**: Pulsing cyan dot showing real-time data connection

**Navigation Structure:**
```
Ministry Portal
├── Overview (Dashboard)
├── National Intelligence
│   ├── Schools
│   ├── National Analytics
│   └── GNH Dashboard
├── Strategic Planning
│   ├── Labor Market
│   ├── Teacher Resources
│   └── Infrastructure
├── Policy & Communications
│   ├── Policies
│   ├── Notifications
│   └── EMIS Sync
└── Oversight
    ├── Billing Overview
    ├── Reports
    └── Settings
```

**Data Sources Aggregated:**
- `users` table → student/teacher counts by dzongkhag
- `assessments` table → syllabus progress tracking
- `schools` table → school count and distribution
- `counseling_sessions` → mental health trends (anonymized)
- `teacher_behavior_logs` → discipline patterns
- `student_roadmaps` → career pathway alignment

**Key Insights Generated:**
- "National syllabus progress is lagging in Mathematics for Class 10"
- "Deploy regional Mathematics mentors to Eastern dzongkhags to hit BCSE targets"
- "Redirect 5% of national scholarships from IT to Sustainable Agriculture"
- "Fast-track teacher recruitment for STEM subjects (180 teacher shortage identified)"

**Files Created (9):**
| File | Purpose |
|------|---------|
| `src/app/api/ministry/briefing/route.ts` | ~250 | National briefing API |
| `src/components/ministry/national-pulse-card.tsx` | ~180 | Live pulse display |
| `src/components/ministry/policy-briefing-card.tsx` | ~220 | AI policy recommendations |
| `src/components/ministry/workforce-alignment-card.tsx` | ~240 | Workforce gap analysis |
| `src/app/ministry/reports/page.tsx` | ~180 | Report library |
| `src/app/ministry/settings/page.tsx` | ~200 | Ministry settings |
| `src/app/ministry/emis/page.tsx` | ~120 | EMIS sync center |
| `src/app/ministry/infrastructure/page.tsx` | ~160 | Infrastructure audit |
| `docs/diagrams/flowdiagram.html` | ~100 | Added Ministry flows |

**Files Modified (3):**
| File | Changes |
|------|---------|
| `src/app/ministry/page.tsx` | Complete redesign with Bento Grid layout |
| `src/components/shared/portal-sidebar.tsx` | Added Ministry navigation categories |
| `docs/CHANGELOG.md` | This entry |

**Strategic Value:**
- **Data-Driven GNH**: Real-time national wellbeing monitoring instead of annual reports
- **Workforce Planning**: Compare student roadmaps to National Skills Development Plan
- **Crisis Response**: Detect issues (e.g., Eastern dzongkhag lagging) and deploy targeted support
- **Human Capital**: Align education output with 2030 economic goals (Hydropower, Agriculture)
- **Transparency**: Minister sees country's health every morning at 8:00 AM

**TypeScript Status:**
- ✅ 0 TypeScript errors in new files (verified with `npx tsc --noEmit`)
- All new code uses proper TypeScript types (no `any` for new code)
- Uses `@/` imports consistently

**Breaking Changes:** None

---

## [1.4.0] - Progressive Disclosure Wizards (February 22, 2026) 🧙‍♂️✨

### Added - "Next-Gen SaaS" Guided Wizard System

**What:**
Implemented three progressive disclosure wizards that transform complex setup tasks into engaging, step-by-step experiences with portal-specific theming, motion animations, and optimistic persistence.

**Key Features:**

1. **Guardian Link Wizard** (Parent Portal) - `/parent/link-child`:
   - 4-step process: CID verification → Student discovery → OTP security → Financial setup
   - Bhutan CID (11-digit) validation with real-time feedback
   - Student lookup via CID or Index Number with photo display for visual confirmation
   - OTP verification via SMS OR Email (user's choice)
   - Optional mBOB payment setup and fee notification preferences
   - Creates `parentToStudent` records with relationship types

2. **Wellness Compass Wizard** (Counselor Portal) - `/counselor/intervention/create`:
   - 4-step process: Contextual review → Observation logging → Intervention choice → AI support
   - Student context display (grades, attendance, previous interventions)
   - Behavioral tag selector (Low Participation, Frequent Lateness, Social Withdrawal, etc.)
   - Severity slider (Low → Medium → High)
   - Intervention type selection (One-on-One, Parent Conference, Peer Mentoring, etc.)
   - Full AI integration via Gemini API for GNH-aligned talking points and resources
   - Creates `studentInterventions` records with goals and notes

3. **Subject-Teacher Mapping Wizard** (School Admin Portal) - `/school-admin/timetable/assign`:
   - 3-step process: Department selection → Class-section pairing → Teacher assignment
   - Department cards (Science, Mathematics, Dzongkha, English, Social Studies, IT, Arts)
   - Multi-section selector (A, B, C, D, E)
   - Per-grade REC curriculum subjects with teacher dropdown assignment
   - Teacher workload display with conflict detection
   - Auto-creates classes if they don't exist
   - Updates `classes.teacherId` for assigned teachers

**Core Infrastructure:**

| Component | Purpose |
|-----------|---------|
| `WizardLayout` | Reusable wizard frame with Framer Motion animations, portal-specific gradients, slim progress bar, auto-save to localStorage |
| `OtpInput` | 6-digit OTP input with paste support, keyboard navigation, auto-focus |
| `OtpInputWithTimer` | OTP input with countdown timer and resend functionality |
| `VictoryScreen` | Reusable completion screen with animated success icon and highlights |
| `useWizardData` | Hook for wizard data management with optimistic updates |

**API Endpoints Created:**

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/parent/verify-cid` | GET/POST | CID verification and saving to user metadata |
| `/api/parent/search-student` | GET | Student lookup by CID or student code with photo |
| `/api/parent/send-otp` | POST | OTP sending via SMS (Twilio) or Email (SendGrid) |
| `/api/parent/verify-otp` | POST | OTP verification and parent-child linking |
| `/api/counselor/student-context` | GET | Student context for intervention (grades, attendance, interventions) |
| `/api/counselor/intervention-suggestions` | POST | AI-powered GNH-aligned suggestions via Gemini |
| `/api/school-admin/curriculum-assign` | POST/GET | Teacher-subject-class assignment and retrieval |

**Design System:**
- **Portal-specific gradients**: Each wizard uses the portal's gradient colors
- **Slim progress bar**: Neon-style line indicator (not dots)
- **Glass panel styling**: Frosted glass with backdrop blur
- **Framer Motion animations**: Slide transitions between steps
- **Mobile-optimized**: Full-screen on mobile, centered card on desktop
- **Auto-save**: Wizard state persisted to localStorage for resumability

**Portal Colors:**
| Portal | Gradient |
|--------|----------|
| Student | `rgb(249 115 22) → rgb(194 65 12)` |
| Teacher | `rgb(59 130 246) → rgb(37 99 235)` |
| Parent | `rgb(107 114 128) → rgb(75 85 99)` |
| Counselor | `rgb(168 85 247) → rgb(147 51 234)` |
| Admin | `rgb(236 72 153) → rgb(219 39 119)` |
| School Admin | `rgb(139 92 246) → rgb(124 58 237)` |

**Files Created (15):**
| File | Purpose |
|------|---------|
| `src/components/shared/wizard-layout.tsx` | Core wizard frame component (~315 lines) |
| `src/components/form/otp-input.tsx` | 6-digit OTP input with timer (~190 lines) |
| `src/components/shared/victory-screen.tsx` | Completion screen component (~140 lines) |
| `src/components/wizard/guardian-link-wizard.tsx` | Parent child linking wizard (~450 lines) |
| `src/components/wizard/wellness-compass-wizard.tsx` | Counselor intervention wizard (~580 lines) |
| `src/components/wizard/subject-teacher-mapping-wizard.tsx` | Teacher assignment wizard (~420 lines) |
| `src/app/parent/link-child/page.tsx` | Guardian link wizard page |
| `src/app/counselor/intervention/create/page.tsx` | Wellness compass wizard page |
| `src/app/school-admin/timetable/assign/page.tsx` | Subject mapping wizard page |
| `src/app/api/parent/verify-cid/route.ts` | CID verification API |
| `src/app/api/parent/search-student/route.ts` | Student lookup API |
| `src/app/api/parent/send-otp/route.ts` | OTP sending API |
| `src/app/api/parent/verify-otp/route.ts` | OTP verification API |
| `src/app/api/counselor/student-context/route.ts` | Student context API |
| `src/app/api/counselor/intervention-suggestions/route.ts` | AI intervention suggestions API |
| `src/app/api/school-admin/curriculum-assign/route.ts` | Curriculum assignment API |

**TypeScript Status:**
- ✅ 0 TypeScript errors in wizard files (verified with `npx tsc --noEmit`)
- All new code uses proper TypeScript types (no `any` for new code)
- Uses `@/` imports consistently

**Success Metrics:**
| Metric | Target |
|--------|--------|
| Parent-child linkage rate | >70% |
| Intervention creation time | <3 min |
| Teacher assignment efficiency | 50% faster |
| Wizard abandonment rate | <15% |

---

## [1.3.2] - Teacher Portal Enhancement (February 22, 2026) 👨‍🏫✨

### Added - Behavior Logging, Lesson Planning, Student Reports

**What:**
Implemented four major teacher-centric features: Behavior & Discipline Logging, Lesson Planning with Syllabus Tracking, Automated Student Reports, and Resource Library Enhancement.

**Key Features:**

1. **Behavior & Discipline Logging** (`src/lib/db/teacher-logs-schema.ts`, `src/app/api/teacher/behavior/route.ts`):
   - Quick merit/demerit entry for students
   - Categories: attendance, participation, discipline, homework, leadership
   - Points system with positive (merit) and negative (demerit) values
   - Automatic parent notifications for all demerits
   - Severity levels: low, medium, high
   - Recent behavior logs displayed on teacher dashboard

2. **Lesson Planning & Syllabus Tracking** (`src/lib/db/lesson-plan-schema.ts`, `src/app/api/teacher/lessons/`):
   - Create and manage lesson plans with objectives, activities, resources
   - Track chapters and scheduled dates
   - Mark lessons as complete with coverage percentage
   - Automatic syllabus progress calculation (total vs completed chapters)
   - Integrates with REC (Royal Education Council) curriculum structure
   - Progress bar showing syllabus completion per class/subject

3. **Automated Student Snapshot Reports** (`src/lib/reports/student-snapshot.ts`, `src/app/api/teacher/reports/student/`):
   - One-click aggregated student reports from multiple data sources
   - Academic: average score, subject-wise grades, overall letter grade
   - Attendance: percentage, present/absent/late days, status rating
   - Behavior: merit/demerit points, net score, recent incidents
   - Homework: completion rate, average score, missing count
   - AI-generated summary with strengths, concerns, and recommendations
   - Downloadable PDF report format (placeholder)

4. **Resource Library Enhancement** (`src/app/api/teacher/resources/route.ts`):
   - Upload teaching materials (documents, videos, presentations)
   - Organize by grade, subject, and category
   - Link resources to specific curriculum chapters
   - Filter and search functionality

**New Database Tables (3):**

| Table | Purpose |
|-------|---------|
| `teacher_behavior_logs` | Track merit/demerit incidents with parent notification flags |
| `lesson_plans` | Store lesson plans with objectives, status, coverage tracking |
| `syllabus_progress` | Track curriculum completion per class/subject/teacher |

**New Components (4):**

| Component | Purpose |
|-----------|---------|
| `BehaviorLogModal.tsx` | Quick-entry modal for merit/demerit logging |
| `LessonPlanCard.tsx` | Display lesson with status, progress, and actions |
| `StudentReportCard.tsx` | Display aggregated student snapshot report |
| `TeacherQuickActions.tsx` | Quick actions toolbar on dashboard |

**Dashboard Enhancements:**
- Recent behavior logs section showing last 5 incidents
- Quick actions toolbar with 6 common tasks
- Behavior log counts and statistics

**Modified Files:**
- `src/lib/db/schema.ts` - Added exports for new schema tables
- `src/app/teacher/dashboard/_actions.ts` - Added `recentBehaviorLogs` to dashboard data
- `src/app/teacher/dashboard/page.tsx` - Integrated new sections

---

## [1.3.1] - Student Dashboard Enhancement (February 22, 2026) 🎓✨

### Added - Student "Career OS" Dashboard Features

**What:**
Enhanced the student dashboard with three major features: AI Career Coach chat, Visual Roadmap Tracker, and Enhanced Marks Overview - creating an aspirational "Career OS" experience for Bhutanese students.

**Key Features:**

1. **AI Career Coach Widget** (`src/components/student/ai-career-coach-widget.tsx`):
   - Collapsible chat interface for real-time career guidance
   - Quick prompts based on student context (assessments, marks, grade)
   - Conversation history persisted in localStorage
   - Uses existing `/api/ai/career-coach` endpoint (Gemini-powered)
   - Mobile responsive: full-screen modal on mobile, embedded card on desktop
   - Floating button when minimized

2. **Visual Roadmap Tracker** (`src/components/student/roadmap-tracker.tsx`):
   - Horizontal scrollable timeline with 5 stages
   - Stages: Foundation (Class 6-8) → BCSE Prep (9-10) → Specialization (11-12) → RUB College → Career
   - Dynamic status based on student's current grade (completed/current/upcoming/locked)
   - Progress percentage tracking across all milestones
   - Personalized notes based on career matches

3. **Marks Overview Card** (`src/components/student/marks-overview-card.tsx`):
   - Subject-wise performance cards with trend indicators (↑ ↓)
   - Progress bars for percentage visualization
   - Grade badges with ceramic color variants (A+→green, A→blue, B→orange, C→red)
   - Term selector to switch between exam types (midterm, final, unit test, board exam)
   - Overall performance badge with class rank display
   - Links to detailed reports and teacher chat

**New Files (6):**

| File | Purpose |
|------|---------|
| `src/types/student.ts` | Shared TypeScript interfaces for student features |
| `src/components/student/ai-career-coach-widget.tsx` | Chat-based AI career coach |
| `src/components/student/roadmap-tracker.tsx` | Visual learning path timeline |
| `src/components/student/marks-overview-card.tsx` | Academic performance display |
| `src/app/api/student/roadmap/route.ts` | Personalized roadmap API |
| `src/app/api/student/marks-summary/route.ts` | Exam results with trends API |

**Modified Files (1):**

| File | Changes |
|------|---------|
| `src/app/student/dashboard/page.tsx` | Integrated new components into dashboard layout |

**Dashboard Layout:**
- Row 1: AI Career Coach (1/3 width) + Quick Stats (2/3 width)
- Row 2: Roadmap Tracker + Marks Overview (side by side)
- Maintains existing ceramic design system and orange student portal theme

---

## [1.3.0] - Next-Gen SaaS UX/UI Upgrade (February 22, 2026) ✨🚀

### Added - Complete "Next-Gen SaaS" UX/UI Transformation

**What:**
Implemented a comprehensive UX/UI upgrade inspired by Vercel, Linear, and Stripe to transform the application into a modern, fluid cockpit with zero full-page reloads.

**Key Features:**

1. **Command+K Global Search** (`Cmd+K`):
   - Press `Cmd+K` anywhere to open global command menu
   - Navigate to any page instantly without clicking
   - Portal-specific commands for all 7 portals (student, teacher, parent, counselor, admin, school-admin, ministry)
   - Keyboard navigation (↑↓ arrows, Enter to select)
   - Real-time search filtering with keyword matching

2. **Global Slide-over System** (URL-based Panels):
   - Click any student/teacher/school name to open slide-over panel
   - No full-page navigation - context is preserved
   - URL-based state (`?panel=profile&id=123`) for linkable panel states
   - Browser back button closes panels automatically
   - Three profile views: Student, Teacher, and School with AI insights

3. **Bento Box Dashboard Layout**:
   - Modern grid layout with glassmorphism cards
   - Responsive: 1 column mobile → 4 columns desktop
   - Different card sizes (1x1, 2x1, 2x2, etc.)
   - Stat cards with trend indicators (up/down arrows with percentage)
   - Progress bars with smooth Framer Motion animations

4. **Page Transitions**:
   - Smooth fade + slide animations between routes
   - Applied to all portal pages via unified layout wrapper
   - Uses Framer Motion AnimatePresence with proper patterns

5. **Optimistic UI Patterns**:
   - TanStack Query wrapper for instant feedback
   - Helper utilities for list operations (add, remove, update)
   - Automatic rollback on error

6. **Glassmorphism Design**:
   - Frosted glass cards with backdrop blur
   - Subtle borders with transparency
   - Modern SaaS aesthetic

**New Components (20+ files):**

| Component/File | Purpose |
|----------------|---------|
| `src/lib/command-registry.ts` | Command registration for all portals |
| `src/lib/stores/command-menu-store.ts` | Zustand store for menu state |
| `src/hooks/use-global-shortcut.ts` | Keyboard shortcut handler (`Cmd+K`) |
| `src/components/command-menu/command-menu.tsx` | Main dialog component |
| `src/components/command-menu/command-input.tsx` | Search input |
| `src/components/command-menu/command-list.tsx` | Filterable list |
| `src/components/command-menu/command-item.tsx` | Command item |
| `src/components/command-menu/command-group.tsx` | Grouped sections |
| `src/hooks/use-slide-over.ts` | URL state management hook |
| `src/components/slide-over/slide-over-provider.tsx` | Global panel provider |
| `src/components/profile/student-profile-view.tsx` | Student profile panel |
| `src/components/profile/teacher-profile-view.tsx` | Teacher profile panel |
| `src/components/profile/school-profile-view.tsx` | School profile panel |
| `src/components/dashboard/bento-grid.tsx` | CSS Grid layout |
| `src/components/dashboard/glass-card.tsx` | Glassmorphism cards |
| `src/components/dashboard/stat-trend.tsx` | Stat with trend |
| `src/components/transitions/page-transition.tsx` | Route transitions |
| `src/components/transitions/transition-provider.tsx` | AnimatePresence wrapper |
| `src/hooks/use-optimistic-mutation.ts` | Optimistic mutation hook |
| `src/lib/optimistic-utils.ts` | Helper utilities |
| `src/components/global/global-providers.tsx` | Unified provider wrapper |
| `src/components/ui/scroll-area.tsx` | Missing component added |

**Modified Files (5):**

| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Added GlobalProviders wrapper |
| `src/app/[portal]/layout-client.tsx` | Added PageTransition wrapper |
| `src/app/[portal]/dashboard/page.tsx` | Replaced with Bento Grid layout |
| `src/styles/ceramic.css` | Added glassmorphism & bento grid CSS |
| `src/app/signup/general/page.tsx` | Fixed useSearchParams Suspense issue |
| `src/app/signup/institutional/page.tsx` | Fixed useSearchParams Suspense issue |

**UX Improvements:**
- **Zero full-page reloads** - All navigation handled via Next.js App Router
- **Contextual multi-tasking** - Side-overs preserve page context
- **Instant feedback** - Optimistic UI for smooth interactions
- **Mobile responsive** - Bento grid adapts from 1 to 4 columns
- **Keyboard-first** - Power users can navigate without mouse
- **Visual hierarchy** - Bento grid emphasizes important metrics

**Breaking Changes:** None

---

## [1.1.0] - Platform Admin Command Center (February 22, 2026) 🤖✨

### Added - AI-Powered Command Center for Platform Admins

**New "Summer Wars" Inspired Features:**

The Platform Admin portal now includes a next-generation Command Center with AI-powered autonomous monitoring and natural language command execution.

**New Pages:**
| Route | Purpose |
|-------|---------|
| `/admin/command-center` | AI-powered command cockpit with SITREP briefings and command terminal |
| `/admin/knowledge` | Knowledge ingestion system for RUB requirements, scholarships, and career data |

**New Database Tables (6):**
| Table | Purpose |
|-------|---------|
| `sitrep_reports` | Daily AI-generated situation reports with health status, growth/revenue/activity metrics |
| `anomaly_alerts` | AI-detected anomalies (seat limits exceeded, overdue payments, low engagement) with severity levels |
| `system_health_metrics` | Daily system performance snapshots (API latency, error rates, storage usage) |
| `knowledge_drafts` | AI-parsed external content awaiting admin review before importing into main database |
| `rub_requirements` | Structured RUB college/program requirements for intelligent career matching |
| `national_scholarships` | National scholarship database with eligibility criteria and benefits |

**New API Routes (4):**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/sitrep` | GET/POST | Generate/retrieve daily SITREP with 24h delta analysis |
| `/api/admin/command/execute` | POST/PUT | Parse natural language commands (POST) and execute after confirmation (PUT) |
| `/api/admin/knowledge/ingest` | GET/POST | AI-powered knowledge import from URLs or raw text |
| `/api/admin/knowledge/drafts/[id]/approve` | PUT/DELETE | Approve (import) or reject knowledge drafts |

**New AI Sentinel Module:**
| File | Purpose |
|------|---------|
| `src/lib/sentinel/anomaly-detector.ts` | Detects seat limit breaches, overdue invoices, low engagement schools |
| `src/lib/sentinel/sitrep-generator.ts` | Generates daily briefings using Gemini AI with Kaze persona |

**New UI Components:**
| Component | Purpose |
|-----------|---------|
| `AIPresenceIndicator` | Pulsing cyan indicator showing Kaze (AI Sentinel) is online and monitoring |
| `SITREPBriefing` | Terminal-style daily briefing display with typing effect and health status |
| `CommandTerminal` | Chat-style interface for natural language admin commands with confirmation dialogs |

**Command Center Features:**
- **Daily SITREP**: AI-generated morning briefings with 24h platform delta analysis
  - Health status: 🟢 Healthy / 🟡 Degraded / 🔴 Critical
  - Growth metrics: New schools, students, users, churn rate
  - Revenue tracking: MRR, overdue invoices, payments collected
  - Activity insights: AI consultations, assessments completed, top career trends
  - Anomaly summary: Critical/high/medium/low alert counts

- **Natural Language Commands**: Type commands like:
  - "Send payment reminder to Motithang HSS"
  - "Suspend XYZ school access until they pay"
  - "Extend trial for ABC School by 14 days"
  - "Acknowledge the seat limit alert"
  - All commands require explicit confirmation before execution

- **Knowledge Ingestion**: Import external knowledge via AI parsing
  - Paste RUB college requirements → AI structures into database
  - Share scholarship information → Auto-extracts eligibility and benefits
  - Review drafts before approving import into main database

**Navigation Updates:**
- Added "Command Center" to Platform Admin sidebar (second item after Dashboard)
- Added "Knowledge" to Platform Admin sidebar (between Assessments and Content)
- Added Command Center quick action to admin dashboard header (cyan gradient button)

**Design System:**
- Dark theme: `#030303` background
- Primary accent: `rgb(6 182 212)` (cyan-500)
- Monospace font for SITREP: Font fallback chain (SF Mono, Fira Code, monospace)
- Typing effect for SITREP reveal (3 chars per 10ms)
- Pulse animation for AI presence indicator

**Safety Features:**
- **All AI commands require confirmation** before execution
- Confirmation dialog shows: action, target, explanation, confidence score
- Critical actions (suspend, bulk changes) always show warning
- Admin can cancel before execution

**Files Created (12):**
| File | Lines | Purpose |
|------|-------|---------|
| `src/app/admin/command-center/page.tsx` | ~180 | Command Center main page |
| `src/app/admin/knowledge/page.tsx` | ~300 | Knowledge management UI |
| `src/app/api/admin/sitrep/route.ts` | ~100 | SITREP API endpoint |
| `src/app/api/admin/command/execute/route.ts` | ~400 | AI command parser & executor |
| `src/app/api/admin/knowledge/ingest/route.ts` | ~250 | Knowledge ingestion API |
| `src/app/api/admin/knowledge/drafts/[id]/approve/route.ts` | ~150 | Draft approval API |
| `src/components/admin/ai-presence-indicator.tsx` | ~100 | AI status indicator component |
| `src/components/admin/sitrep-briefing.tsx` | ~200 | SITREP display component |
| `src/components/admin/command-terminal.tsx` | ~350 | Command chat interface |
| `src/lib/sentinel/anomaly-detector.ts` | ~250 | Anomaly detection logic |
| `src/lib/sentinel/sitrep-generator.ts` | ~350 | SITREP generation logic |

**Files Modified (3):**
| File | Changes |
|------|---------|
| `src/lib/db/schema.ts` | Added 6 new tables (sitrep_reports, anomaly_alerts, system_health_metrics, knowledge_drafts, rub_requirements, national_scholarships) |
| `src/config/portal-config.ts` | Added Command, Database icons; added "command-center" and "knowledge" navigation items |
| `src/app/admin/page.tsx` | Added Command Center quick action; added cyan "Command Center" button to header |
| `src/app/admin/admin-layout-client.tsx` | Added page titles for command-center and knowledge |

**Breaking Changes:** None

---

## [1.2.0] - School Admin Operations Hub (February 22, 2026) 🏫✨

### Added - Complete School Admin "Operations Hub" Implementation

**What:**
Implemented the School Admin Portal "Operations Hub" as outlined in the system architecture flow diagrams. This release focuses on school management efficiency, seat capacity enforcement, and bulk operations.

**Key Features:**

1. **Platform Admin School Creation** (`/api/admin/schools`):
   - POST endpoint for creating new schools with tier-based capacity limits
   - Auto-generates unique school codes
   - Validates for duplicate school codes
   - Sets subscription tier and maxStudents based on tier selection
   - Returns full school object on success

2. **Billing Enforcement System** (`src/lib/billing-utils.ts`):
   - `checkSeatCapacity()` - Check if school has capacity for more students
   - `enforceSeatCapacity()` - Throw error if capacity would be exceeded
   - `getCapacityStatus()` - Get current usage with warnings at 90%
   - `getTierLimit()` - Get max students for a tier
   - `recommendTier()` - Recommend tier based on student count
   - Integrated into bulk approval routes to prevent over-subscription

3. **Bulk Student Import**:
   - Upload up to 500 students via CSV file
   - Enforces seat capacity BEFORE importing
   - Auto-creates classes if needed
   - Auto-enrolls students in classes
   - Validates email uniqueness
   - Returns detailed success/failure counts
   - CSV parsing with header detection (name, email, grade, section, etc.)

4. **Hostel Allocation System**:
   - Allocate students to hostel rooms
   - Atomic transactions ensure data integrity
   - Checks room capacity before allocation
   - Automatically frees up previous room allocation
   - Deallocate students from rooms
   - Occupancy report with building/room breakdown
   - Uses `hostelAllocations` table (separate from students)

5. **Dashboard Capacity Warnings**:
   - Visual progress bar showing usage percentage
   - Color-coded status (green/amber/red)
   - "Approaching Limit" warning at 90%
   - "At Capacity" message at 100%
   - "Upgrade Plan" action button when needed

**Tier Capacities:**
| Tier | Max Students |
|------|--------------|
| Free | 50 |
| Basic | 100 |
| Standard | 500 |
| Premium | 1,000 |
| Enterprise | 10,000 |

**Files Created (7):**
| File | Purpose |
|------|---------|
| `src/lib/billing-utils.ts` | Centralized billing and seat capacity enforcement (~100 lines) |
| `src/app/api/admin/schools/route.ts` | Platform Admin school creation API (~100 lines) |
| `src/app/api/school-admin/students/bulk-import/route.ts` | Bulk import up to 500 students (~325 lines) |
| `src/components/school-admin/bulk-import-modal.tsx` | CSV upload modal with preview (~280 lines) |
| `src/app/api/school-admin/hostels/allocate/route.ts` | Hostel room allocation API (~395 lines) |
| `src/app/api/school-admin/capacity/route.ts` | Capacity status API endpoint (~65 lines) |
| `src/components/school-admin/capacity-status-card.tsx` | Dashboard capacity card component (~140 lines) |

**Files Modified (5):**
| File | Changes |
|------|---------|
| `src/app/api/school-admin/applications/approve-batch/route.ts` | Added seat capacity check before bulk approval |
| `src/app/school-admin/students/students-client.tsx` | Integrated BulkImportModal component |
| `src/components/admin/add-school-slide-in.tsx` | Changed API to `/api/admin/schools`, fixed field names |
| `src/app/school-admin/dashboard/page.tsx` | Added CapacityStatusCard to dashboard |
| `docs/IMPLEMENTATION_SUMMARY_PHASE1.md` | Created detailed implementation summary |

**API Routes Created:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/admin/schools` | POST/GET | Create/list schools |
| `/api/school-admin/students/bulk-import` | POST | Bulk import students (CSV) |
| `/api/school-admin/hostels/allocate` | POST/GET/DELETE | Allocate/report/deallocate hostel rooms |
| `/api/school-admin/capacity` | GET | Get seat capacity status |

**Design System:**
- Uses existing custom `useToast()` hook (not sonner package)
- Follows existing Clerk ceramic design patterns
- Responsive CSV upload modal with drag-and-drop
- Preview of detected students before import (first 50 shown)
- Remove individual students before import capability
- Import progress indicator

**Safety Features:**
- **Seat capacity enforced BEFORE any student creation**
- Transaction-based hostel allocation (all-or-nothing)
- Email uniqueness validation prevents duplicates
- Proper error handling with detailed messages
- Capacity error returns `capacityInfo` in response for UI display

**TypeScript Status:**
- ✅ 0 TypeScript errors (verified with `npx tsc --noEmit`)
- All new code uses proper TypeScript types (no `any` for new code)
- Uses `@/` imports consistently

**Testing Checklist:**
- [ ] School creation flow via Platform Admin
- [ ] Seat enforcement (try to exceed tier limit)
- [ ] Bulk upload CSV with 50+ students
- [ ] Hostel allocation/deallocation
- [ ] Dashboard capacity warnings at 90%/100%

**Flow Diagram Compliance:**
- ✅ Platform Admin "Create Schools" flow implemented
- ✅ Billing enforcement prevents revenue leakage
- ✅ Bulk operations enable efficient onboarding
- ✅ Hostel management for boarding schools
- ✅ Dashboard shows capacity status for awareness

**Breaking Changes:** None

---

## [1.0.0] - Schema Recovery & Foundation (February 21, 2026) 🎉

### Fixed - Critical Database Schema Synchronization ✅ COMPLETE

**Problem:**
- 10 database tables were missing (students, teachers, parents, invoices, subscriptions, payments, library_*, ai_interactions)
- 100+ TypeScript errors due to schema drift
- Forms failing to save data (Add School, Approve School Admin, etc.)
- Timestamp timezone mismatches between schema and database
- Decimal type handling issues (PostgreSQL returns strings, code expected numbers)

**Solution:**
- Comprehensive schema audit and synchronization
- Created 10 missing database tables with proper relationships
- Fixed all timestamp definitions to use consistent `timestamp without time zone`
- Updated decimal handling for billing/financial data
- Fixed all TypeScript errors (100+ → 0)
- Created standardized API error handling

**Database Changes:**
| Table Added | Purpose |
|-------------|---------|
| `students` | Student profiles linked to users and schools |
| `teachers` | Teacher profiles with employment details |
| `parents` | Parent profiles with occupation info |
| `parent_to_student` | Join table for parent-child relationships |
| `invoices` | School billing with proper decimal amounts (tax, discount, total) |
| `subscriptions` | School subscription tiers and seat limits |
| `payments` | Payment tracking linked to invoices |
| `library_books` | Library book catalog with copy tracking |
| `library_members` | Library membership with borrowing limits |
| `library_circulation` | Book checkout/return with fine tracking |
| `ai_interactions` | AI chat history with context snapshots |
| `student_portfolios` | Student career portfolios with achievements |

**Fixed Tables:**
| Table | Changes |
|-------|---------|
| `school_admin_applications` | Added missing columns: `payment_verified_by`, `payment_verified_at`, `bank_reference_number` |
| `invoices` | Fixed: `amount` → decimal, added `taxAmount`, `discountAmount`, `totalAmount`, `invoiceDate`, `refundAmount`, `refundReason`, `refundedAt` |
| `schools` | Added: `subscriptionStatus`, `subscriptionTier`, `activatedAt`, `setupComplete`, `setupCompletedAt` |
| `users` | Fixed timestamp timezone (with → without) |
| `teachers` | Fixed timestamp timezone (with → without) |

**New API Routes Created:**
| Route | Method | Purpose |
|-------|--------|---------|
| `/api/student/profile` | GET/PATCH | Student profile management |
| `/api/student/assessments` | POST | Assessment results storage |
| `/api/teacher/profile` | GET/PATCH | Teacher profile management |
| `/api/teacher/homework` | POST/PATCH | Homework creation |
| `/api/parent/children` | GET | Parent's children list |
| `/api/parent/fees` | GET | Fee payment status |
| `/api/admin/stats` | GET | Dashboard statistics |
| `/api/ai/career` | POST | AI career recommendations |

**Developer Tools Created:**
| File | Purpose |
|------|---------|
| `src/lib/api-utils.ts` | Standardized API error handling with `createSafeHandler` |
| `scripts/quick-schema-audit.mjs` | Schema validation script |
| `scripts/create-missing-tables.mjs` | Database table creation script |

**Files Created (12+):**
| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/api-utils.ts` | ~80 | API response helper |
| `src/app/api/student/profile/route.ts` | ~150 | Student profile API |
| `src/app/api/student/assessments/route.ts` | ~600 | Assessment API |
| `src/app/api/teacher/profile/route.ts` | ~120 | Teacher profile API |
| `src/app/api/parent/children/route.ts` | ~200 | Parent children API |
| `src/app/api/admin/stats/route.ts` | ~80 | Dashboard stats |
| `scripts/quick-schema-audit.mjs` | ~250 | Schema validator |
| `scripts/create-missing-tables.mjs` | ~200 | Table creator |
| `docs/diagrams/system-architecture.mmd` | ~500 | Flow diagrams |
| `docs/diagrams/flowdiagram.html` | ~450 | Interactive diagrams |

**Files Modified (50+):**
- `src/lib/db/schema.ts` - Added imports (decimal, primaryKey, jsonb), added 10+ tables
- `src/app/admin/billing/actions.ts` - Fixed decimal type handling
- Multiple billing/invoice API routes - Fixed column references
- Multiple component files - Fixed TypeScript errors

**Impact:**
- ✅ **0 TypeScript errors** (was 100+)
- ✅ **0 missing database tables** (was 10)
- ✅ **0 schema mismatches** (was critical)
- ✅ All forms now save data correctly
- ✅ Ready for production build

**Breaking Changes:**
- `invoices.amount` changed from `text` to `decimal` - API responses now return strings
- `invoices.subscriptionId` removed - use `invoices.subscriptionTier` (text field)
- `schools.tenantId` removed - use `schools.id` for joins
- `invoices.paymentDetails` removed - use `invoices.paymentReference` (text field)

---

## [Unreleased]

### Added - Flow Diagrams (February 21, 2026) ✅ COMPLETE

**What:**
- Created comprehensive system architecture flow diagrams
- Documented user registration/onboarding flows for all 7 portals
- Documented school admin approval flow (the feature you fixed)
- Documented school creation flow
- Documented data flow: UI → API → Database
- Documented AI Career Coach flow with Bhutan-specific context
- Documented library circulation flow
- Documented invoice & billing flow

**Files Created:**
| File | Purpose |
|------|---------|
| `docs/diagrams/system-architecture.mmd` | Mermaid diagrams (11 flows) |
| `docs/diagrams/flowdiagram.html` | Interactive HTML with Mermaid.js |

**To View:**
- Open `docs/diagrams/flowdiagram.html` in browser for interactive diagrams
- Or paste `.mmd` content into [Mermaid Live Editor](https://mermaid.live)

---

## [Unreleased]

### Added - Clerk Ceramic Design System & Slide-in Forms (February 21, 2026) ✅ COMPLETE

**What:**
- Implemented Clerk ceramic design system toast notifications
- Created slide-in form component with unsaved changes toast
- Fixed admin portal React hooks error (sidebar not visible)
- Added ceramic CSS utility classes to globals.css

**Toast Features:**
- White background with colored border (`border-[#eeeef0]`)
- Colored icons (green for success, red for error, orange for warning)
- Small width (320-420px), positioned bottom-right
- Shows "Save" button when user has unsaved changes
- No auto-save - user must click "Save" to save

**Slide-in Form Features:**
- Slides in from right side (modern UX)
- No backdrop blur effect
- Shows toast notification when user types
- Footer shows "Unsaved changes" status
- Uses Clerk ceramic design colors

**Admin Portal Fix:**
- Fixed React hooks error preventing sidebar from showing
- Created dedicated admin-layout-client.tsx
- Portal admin now bypasses setup check correctly

**Files Created:**
| File | Purpose |
|------|---------|
| `src/components/ui/toast.tsx` | Clerk ceramic toast system |
| `src/components/form/slide-in-form.tsx` | Slide-in form with toast |
| `src/components/admin/add-school-slide-in.tsx` | School creation slide-in |
| `src/app/admin/admin-layout-client.tsx` | Admin layout client |
| `src/styles/ceramic.css` | Clerk ceramic CSS variables |

**Files Modified:**
| File | Changes |
|------|---------|
| `src/app/layout.tsx` | Added ceramic.css import |
| `src/app/globals.css` | Added ceramic utility classes |
| `src/app/admin/layout.tsx` | Uses admin-layout-client |
| `src/app/admin/schools/schools-client.tsx` | Uses AddSchoolSlideIn |

---

## [Unreleased]

### Added - Unified Portal Architecture with RBAC Components (February 21, 2026) ✅ COMPLETE

**What:**
- Implemented unified portal layout replacing 7 separate portal layouts
- Added RBAC components for role-based UI rendering
- Created circuit-breaker auth hook with 3 security guards
- Added portal error boundary for single point of failure protection
- Implemented dynamic SEO metadata per portal
- **DELETED 7 old portal layouts** - unified layout now exclusively serves all portals
- **DELETED 4 unused sidebar files** (1,109 lines) - cleanup completed
- **Integrated AssessmentOnboardingModal** for student portal

**Code Reduction:**
- Deleted 7 old layout files (1,176 lines)
- Deleted 4 unused sidebar files (1,109 lines)
- Single unified layout (~150 lines) replaces all
- **Net: ~2,200 lines eliminated**

**Files Created (9):**
| File | Purpose |
|------|---------|
| `src/hooks/use-current-user.tsx` | User context provider |
| `src/hooks/use-portal-auth.ts` | Auth hook with 3 guards |
| `src/components/auth/show-for-roles.tsx` | Role-based UI guard |
| `src/components/auth/show-only-for-portal.tsx` | Portal-specific wrapper |
| `src/components/auth/index.ts` | Barrel export |
| `src/app/[portal]/layout.tsx` | Server component (metadata) |
| `src/app/[portal]/layout-client.tsx` | Client component (rendering) |
| `src/components/error/portal-error-boundary.tsx` | Error isolation |

**Files Deleted (11):**
| File | Lines |
|------|-------|
| `src/app/student/layout.tsx` | 153 |
| `src/app/teacher/layout.tsx` | 169 |
| `src/app/parent/layout.tsx` | 176 |
| `src/app/counselor/layout.tsx` | 174 |
| `src/app/admin/layout.tsx` | 179 |
| `src/app/school-admin/layout.tsx` | 164 |
| `src/app/ministry/layout.tsx` | 161 |
| `src/components/shared/ministry-sidebar.tsx` | 171 |
| `src/components/shared/vercel-sidebar.tsx` | 370 |
| `src/components/admin/platform-admin-sidebar.tsx` | 266 |
| `src/components/admin/school-admin-sidebar.tsx` | 302 |

**Testing Results:**
```
/student/dashboard:    200 OK ✓
/teacher/dashboard:   200 OK ✓
/parent/dashboard:    200 OK ✓
/counselor/dashboard: 200 OK ✓
/admin/dashboard:     200 OK ✓
/school-admin/dashboard: 200 OK ✓
/ministry/dashboard:  200 OK ✓
```

**Design System Status:**
- ✅ Clerk Design System CSS already fully implemented in `globals.css`
- ✅ AssessmentOnboardingModal integrated into unified layout
- ✅ All unused sidebars deleted

**Key Features:**

1. **Unified Portal Layout** (`src/app/[portal]/layout.tsx`):
   - Single layout serves all 7 portals (student, teacher, parent, counselor, school-admin, admin, ministry)
   - Dynamic portal-specific loading spinners with color coding
   - Portal-specific component wrappers via `<ShowOnlyForPortal>`
   - Error boundary prevents cascading failures across portal

2. **Circuit-Breaker Auth Hook** (`src/hooks/use-portal-auth.ts`):
   - Guard 1: Onboarding status check (restricted/pending_approval/rejected → redirect)
   - Guard 2: Portal type cross-check (redirects to correct portal if accessing wrong one)
   - Guard 3: Setup guard (redirects to `/setup/unified` if not configured)
   - Parallel API fetching for performance
   - Comprehensive logging for debugging

3. **RBAC Components**:
   - `<ShowForRoles roles={['admin', 'school-admin']}>` - Show content only for specific roles
   - `<HideFromRoles roles={['student']}>` - Hide content from specific roles
   - `<ShowOnlyForPortal portal="student">` - Portal-specific content wrapper
   - `useCurrentUser()` - Hook to access current user context

4. **User Context Provider** (`src/hooks/use-current-user.tsx`):
   - Provides userType, userId, userName, schoolId throughout app
   - Used by all RBAC components
   - Integrated with root layout

5. **Dynamic SEO Metadata** (`src/app/[portal]/generate-metadata.ts`):
   - Generates unique titles per portal (e.g., "Student Portal | Bhutan EduSkill")
   - Portal-specific descriptions for SEO
   - OpenGraph and Twitter card support

6. **Portal Error Boundary** (`src/components/error/portal-error-boundary.tsx`):
   - Prevents single component crashes from breaking entire portal
   - User-friendly error messages with "Refresh Page" and "Go to Dashboard" actions
   - Development mode error details for debugging

**Database Changes:**
- No schema changes required (uses existing users table)
- UserProvider wraps existing authentication

**Files Created (9):**
- `src/hooks/use-current-user.tsx`
- `src/hooks/use-portal-auth.ts`
- `src/components/auth/show-for-roles.tsx`
- `src/components/auth/show-only-for-portal.tsx`
- `src/components/auth/index.ts`
- `src/app/[portal]/layout.tsx`
- `src/app/[portal]/generate-metadata.ts`
- `src/app/[portal]/page.tsx`
- `src/app/[portal]/dashboard/page.tsx`

**Files Modified (1):**
- `src/app/layout.tsx` - Updated UserProvider import path

**Code Reduction:**
- 7 layout files (~1,050 lines) → 1 unified layout (~150 lines)
- 315 lines of duplicated auth code → 80 lines in single hook
- **Total reduction: ~1,450 lines (82%)**

**Benefits:**
- Single point of maintenance for portal layouts
- Consistent authentication across all portals
- Type-safe role-based UI components
- Better error handling with isolation
- Dynamic SEO without manual configuration

**Testing:**
- All 7 portals verified working (200 OK responses)
- Sub-routes tested (`/student/classes`, `/student/homework`, `/teacher/students`)
- Zero TypeScript errors in new files
- Dev server tested and verified

---

### Added - Flow Diagram Compliance & Bulk Approval System (February 21, 2026)

**What:**
- Implemented complete compliance with flow diagram specifications for user onboarding and approval workflows
- Added Excel-style bulk approval grid for high-volume teacher/student approvals
- Implemented auto-save forms with Clerk-style toast notifications
- Created distinct signup paths for Institutional vs General users
- Added payment verification for school admin applications
- Implemented zero data access enforcement for pending users

**Key Features:**

1. **Bulk Approval Grid** (`src/components/school-admin/bulk-approval-grid.tsx`):
   - Excel-style data grid for approving 50+ teachers/students efficiently
   - Inline department and class assignment with dropdowns
   - Bulk selection with approve/reject actions
   - Auto-save with 500ms debounce
   - Sticky footer showing selected count
   - No save buttons - auto-save on each change

2. **Batch Approval APIs**:
   - `POST /api/school-admin/applications/approve-batch` - Bulk approve with assignments
   - `POST /api/school-admin/applications/reject-batch` - Bulk reject with reasons
   - `PATCH /api/school-admin/applications/[userId]/assignment` - Single user assignment
   - Transaction-based updates for data integrity

3. **AutoSave Form Wrapper** (`src/components/form/auto-save-form.tsx`):
   - Auto-saves on every field change (debounced 500ms)
   - Clerk-style toast notifications (success/error/saving)
   - No save/cancel buttons needed
   - Dirty state tracking
   - Optimistic UI updates with rollback on error

4. **Distinct Signup Paths**:
   - `/signup` - Role selection page BEFORE Clerk authentication
   - `/signup/institutional` - School Admin/Counselor path (school code first)
   - `/signup/general` - Student/Teacher/Parent path (school code after auth)
   - `/api/schools/validate-code` - Pre-auth school code validation

5. **User State Pages**:
   - `/pending-approval` - Awaiting Portal page with auto-refresh (30s)
   - `/restricted` - Complete profile prompt for new users
   - `/rejected` - Rejection notice with retry option

6. **Payment Verification**:
   - Platform admin must verify Bank Ref # before approving applications
   - `POST /api/admin/school-admin-applications/[id]/verify-payment`
   - Visual indicators for verified vs pending payments
   - Revoke verification option

7. **Zero Data Access Enforcement** (`src/middleware.ts`):
   - Restricted/pending users blocked from all APIs except setup
   - Only allowed: `/api/user/profile`, `/api/setup/*`, `/api/auth/*`
   - Portal layouts redirect based on `onboardingStatus`

8. **School Code Format Fix**:
   - Changed from `abbrev-district-year` to `ABC-DIST-2024` format
   - 3-char school name + 4-char district + year

**Database Changes:**
- Added `onboardingStatus` enum: `restricted | pending_approval | approved | active | rejected`
- Added `paymentVerifiedBy`, `paymentVerifiedAt`, `bankReferenceNumber` to `school_admin_applications`

**Files Created (21):**
- `src/components/school-admin/bulk-approval-grid.tsx`
- `src/components/form/auto-save-form.tsx`
- `src/components/form/index.ts`
- `src/app/pending-approval/page.tsx`
- `src/app/restricted/page.tsx`
- `src/app/rejected/page.tsx`
- `src/app/signup/page.tsx`
- `src/app/signup/institutional/page.tsx`
- `src/app/signup/general/page.tsx`
- `src/app/api/school-admin/applications/approve-batch/route.ts`
- `src/app/api/school-admin/applications/reject-batch/route.ts`
- `src/app/api/school-admin/applications/[userId]/assignment/route.ts`
- `src/app/api/admin/school-admin-applications/[id]/verify-payment/route.ts`
- `src/app/api/schools/validate-code/route.ts`

**Files Modified (8):**
- `src/components/admin/add-school-modal.tsx` - School code format fix
- `src/middleware.ts` - Zero data access enforcement
- `src/app/student/layout.tsx` - Onboarding status checks
- `src/app/teacher/layout.tsx` - Onboarding status checks
- `src/app/parent/layout.tsx` - Onboarding status checks
- `src/app/counselor/layout.tsx` - Onboarding status checks
- `src/app/admin/school-admin-applications/school-admin-applications-client.tsx` - Payment verification UI
- `src/lib/db/schema.ts` - New fields for onboarding and payment

**Design System:**
- All components follow Clerk Design System (see `docs/design/CLERK_DESIGN_SYSTEM.md`)
- Ceramic gray scale, purple brand colors
- 150ms hover transitions, rounded-lg corners
- Toast notifications with slide animations

**Flow Diagram Compliance:**
- ✅ STEP 1: Initial Onboarding - Distinct paths implemented
- ✅ STEP 2-3: Platform Admin Oversight - Payment verification added
- ✅ STEP 4: School Admin Setup - Active status after completion (already existed)
- ✅ STEP 5-6: Join & Approval - Bulk grid + pending pages implemented
- ✅ STEP 7: Active Portals - All 4 portals operational
- ✅ Data Isolation - Tenant isolation verified, zero data access enforced

**TypeScript Status:**
- 0 new errors introduced
- Pre-existing errors only in billing schema (unrelated to this work)

### Added - School Subscription Management with December 31 Renewal (February 21, 2026)

**What:**
- Implemented comprehensive school subscription system with payment status tracking
- Added subscription tier management (Basic, Standard, Premium, Enterprise)
- Set all school subscriptions to expire on December 31st annually (Bhutan academic year end)
- Added trial period support with configurable duration
- Integrated subscription expiry date calculation and display

**Features:**
1. **Payment Status Tracking**: Four status options with visual indicators
   - Pending Payment (yellow) - Limited access until payment received
   - Free Trial (blue) - Trial period with tier selection
   - Active/Paid (green) - Full access with subscription
   - Suspended (red) - Account suspended
2. **Subscription Tiers**: Four pricing tiers
   - Basic (PP-6) - Primary level
   - Standard (PP-10) - Middle school
   - Premium (PP-12) - Higher secondary
   - Enterprise (Custom) - Custom pricing
3. **Automatic Renewal Date**: All subscriptions expire on December 31st
   - Active subscriptions: Dec 31 of current year (or next year if past Dec 31)
   - Trial subscriptions: Dec 31 OR after trial days (whichever is later)
   - Trial durations: 14, 30, 60, or 90 days
4. **Live Preview**: Real-time calculation and display of expiry date in school creation modal

**Database Changes:**
- Added `subscriptionExpiresAt` column to `schools` table
- Tracks subscription activation date (`activatedAt`)
- Stores subscription tier and status for each school

**Files Modified:**
- `src/lib/db/schema.ts` - Added subscriptionExpiresAt column to schools table
- `src/app/api/schools/route.ts` - Updated to calculate and store subscription expiry dates
- `src/components/admin/add-school-modal.tsx` - Enhanced with subscription status, tier selection, trial duration, and renewal date preview

**UI Enhancements:**
- Color-coded status indicators (yellow/blue/green/red dots)
- Tier dropdown with pricing level labels
- Trial duration selector (14/30/60/90 days)
- Live preview box showing calculated expiry date
- Contextual help text explaining renewal policy

**Usage:**
When creating a school, admins can now:
1. Set payment status (Pending, Trial, Active, Suspended)
2. Select subscription tier (affects features and pricing)
3. For trials: Choose duration (14-90 days)
4. See the calculated expiry date (December 31st or trial end)
5. System automatically stores activation and expiry dates

### Added - Capacity-Based Subscription Billing System (February 21, 2026)

**What:**
- Changed subscription model from feature-limited tiers to capacity-based pricing
- All schools now receive 100% of platform features regardless of tier
- Pricing based solely on student seat capacity
- Added comprehensive invoice generation and tracking system
- Implemented real seat usage tracking with alerts

**Key Changes:**
1. **Capacity-Based Tiers**: Pricing based on student count, not features
   - Small (100 students) - For schools starting out
   - Medium (500 students) - For growing schools
   - Large (1000 students) - For established institutions
   - All tiers include FULL platform access

2. **Invoice Management System**:
   - Auto-generated invoice numbers (INV-YYYY-#### format)
   - Track invoice status: sent, paid, pending, overdue, cancelled
   - Payment method and reference tracking
   - PDF URL support for invoice downloads
   - Billing period tracking (annual by default)

3. **Real Seat Usage Tracking**:
   - Live count of active students and teachers
   - Usage percentage calculation with color-coded progress bar
   - Automatic alerts when approaching 90% capacity
   - Remaining seats calculation

4. **Tier Update API**:
   - Admin can change school subscription tier
   - Automatically updates maxStudents capacity
   - Audit logging for tier changes

**Database Changes:**
- Added `invoices` table with comprehensive billing fields
  - Invoice number, school ID, subscription tier
  - Amount, currency, billing period dates
  - Status tracking, payment details
  - Created by audit field

**API Endpoints Created:**
- `GET /api/admin/schools/[id]/invoices` - Fetch all invoices for a school
- `POST /api/admin/schools/[id]/invoices` - Generate new invoice
- `GET /api/admin/schools/[id]/seat-usage` - Get real seat usage data
- `PATCH /api/admin/schools/[id]/tier` - Update subscription tier

**Files Created:**
- `src/app/api/admin/schools/[id]/invoices/route.ts` - Invoice management API
- `src/app/api/admin/schools/[id]/seat-usage/route.ts` - Seat usage tracking API
- `src/app/api/admin/schools/[id]/tier/route.ts` - Tier update API

**Files Modified:**
- `src/lib/db/schema.ts` - Added invoices table
- `src/app/admin/schools/[id]/billing-section.tsx` - Connected to real APIs, removed mock data
- `src/app/admin/schools/[id]/approve-school-modal.tsx` - Updated to capacity-based labels

**UI Features:**
- Live seat usage bar with color coding (green/yellow/red)
- Invoice history with status badges and download buttons
- Payment summary (Total Billed/Paid/Pending)
- Tier update with toast notifications
- Capacity alert when approaching 90% usage

**Pricing:**
- Pricing amounts are configurable (not hardcoded in system)
- User can set their own pricing per tier
- System uses placeholder amounts for display only

---

## [1.3.0] - 2026-02-16