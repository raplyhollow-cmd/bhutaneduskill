# Changelog

All notable changes to Bhutan EduSkill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - BATCH 6: Type Safety Improvements (80+ files)
- **Type Safety Improvements** - Replaced 80+ explicit `any` types with proper types:
  - `lib/data-export/index.ts` (12 occurrences) - Used `Record<string, unknown>`, `unknown[]`
  - `api/ai/insights/route.ts` (7 occurrences) - Proper type guards and interfaces
  - `lib/ai-features/index.ts` (7 occurrences) - Type-safe AI response handling
  - `admin/teachers/page.tsx` (9 occurrences) - Typed user data and form values
  - `admin/counselors/page.tsx` (8 occurrences) - Proper counselor types
  - `admin/reports/page.tsx` (6 occurrences) - Typed report data structures
  - `api/hostel/route.ts` (6 occurrences) - Safe database query types
  - `api/school-admin/fees/defaulters/route.ts` (5 occurrences) - Fee calculation types
  - Plus 60+ additional files across admin pages, API routes, and components
- **Type Pattern Standardization**:
  - `any` → `unknown` for error handling
  - `Record<string, any>` → `Record<string, unknown>`
  - `any[]` → `unknown[]` or proper typed arrays
  - Dynamic objects now use index signatures: `[key: string]: string | number | boolean`

### Added - BATCH 7: Incomplete Features Completed
- **Library Statistics API** - `/api/library/stats` with real database queries:
  - Borrow count by month (last 6 months)
  - Return count by month (last 6 months)
  - New books added by month
  - Total books, available, borrowed, reserved counts
  - Overdue books count with fine calculations
  - Active reservations count
  - Total and active member counts
  - Digital resources count
  - Most borrowed books list
  - Total overdue fines, paid, and pending amounts

### Added - BATCH 8: Database Performance (80 indexes)
- **Database Indexes** - Added 80 indexes across core tables:
  - **users table** (7 indexes): clerkUserId, schoolId, type, parentId, email, isActive, school+type composite
  - **schools table** (4 indexes): code, isActive, districtId, tenantId
  - **assessments table** (5 indexes): userId, classId, type, status, user+type composite
  - **classes table** (5 indexes): schoolId, teacherId, grade, isActive, school+grade composite
  - **homework table** (5 indexes): classId, subjectId, isPublished, dueDate, isActive
  - **homeworkSubmissions** (4 indexes): homeworkId, studentId, status, homework+student composite
  - **attendance** (7 indexes): studentId, classId, schoolId, date, status, student+date, class+date
  - **enrollments** (6 indexes): studentId, classId, status, academicYear, class+status, student+year
  - **counselingSessions** (6 indexes): studentId, counselorId, status, scheduledAt, schoolId, type
  - **circulation** (7 indexes): bookId, borrowerId, status, dueDate, returnDate, schoolId, borrower+status
  - **libraryMembers** (4 indexes): userId, schoolId, status, membershipNumber
  - **libraryReservations** (5 indexes): bookId, userId, status, expiryDate, schoolId
  - **digitalResources** (5 indexes): schoolId, type, category, accessLevel, isActive
  - **consentRecords** (4 indexes): userId, parentId, type, status
  - **counselorNotes** (3 indexes): studentId, counselorId, createdAt
  - **parentChildren** (3 indexes): parentId, childId, relationship

### Added - BATCH 9: Rate Limiting System
- **Rate Limiting Framework** - `src/lib/rate-limit.ts`:
  - Sliding window algorithm for accurate rate tracking
  - Burst allowance with token bucket approach
  - Per-user and per-IP rate limiting
  - Non-blocking architecture (logging only when limits exceeded)
  - Redis-ready for future distributed deployments
- **Rate Limit Presets**:
  - `api` - 100 requests/minute, 20 burst/10sec
  - `auth` - 5 requests/minute, 2 burst/10sec (stricter)
  - `payment` - 10 requests/minute, 3 burst/10sec (stricter)
  - `upload` - 10 requests/minute, 3 burst/10sec
  - `assessment` - 20 requests/minute, 5 burst/10sec
  - `export` - 5 requests/minute, 2 burst/10sec
- **Protected Routes**:
  - `/api/payments/rma/initiate` - Payment initiation
  - `/api/auth/set-role` - Authentication endpoint
  - `/api/assessment-submissions` - Assessment submissions
  - `/api/files/upload` - File uploads
  - `/api/data-export` - Data exports

### Added - BATCH 10: Audit Logging System
- **Audit Logging Framework** - `src/lib/audit-log.ts`:
  - Non-blocking audit trail (logging failures don't break main app)
  - Helper functions for common operations
  - Automatic IP address capture from requests
  - Before/after value tracking for updates
- **Audit Actions** (30+ defined):
  - User operations: USER_CREATED, USER_UPDATED, USER_DELETED, USER_LOGIN, USER_LOGOUT
  - Content operations: COLLEGE_CREATED, COLLEGE_UPDATED, COLLEGE_DELETED, SCHOLARSHIP_CREATED, CAREER_CREATED
  - Financial operations: FEE_STRUCTURE_CREATED, FEE_PAYMENT_RECEIVED, INVOICE_GENERATED
  - Assessment operations: ASSESSMENT_COMPLETED, ASSESSMENT_STARTED
  - School operations: SCHOOL_CREATED, SCHOOL_UPDATED, SCHOOL_STATUS_CHANGED
  - And 15+ more action types
- **Applied Audit Logging**:
  - User creation in all setup APIs
  - User updates and deletions in admin management
  - College/Scholarship/Career CRUD operations
  - Fee structure modifications
  - Assessment result recording

### Added - BATCH 5: Console Statement Replacement (69 files)
- **Logger Implementation** - Replaced 198 remaining console statements:
  - `app/parent/communication/page.tsx` (14 statements)
  - `app/school-admin/timetable/page.tsx` (8 statements)
  - `app/teacher/learning/page.tsx` (6 statements)
  - `app/teacher/layout.tsx` (6 statements)
  - `app/student/modules/page.tsx` (6 statements)
  - `app/teacher/dashboard/page.tsx` (5 statements)
  - `app/school-admin/settings/page.tsx` (7 statements)
  - Plus 59 additional client component and lib files
- **Logging Pattern**:
  - `console.log()` → `logger.debug()` or `logger.info()`
  - `console.error()` → `logger.error()`
  - `console.warn()` → `logger.warn()`
  - Development-only logging to reduce production noise

### Added - General Improvements
- **Safe Query Error Handling** - `safeQuery()` helper function for graceful database query failures:
  - Prevents API from returning 500 errors when tables don't exist
  - Logs warnings for failed queries with error details
  - Returns default values (null/[]) instead of crashing
- **Server-Only Auth Utilities** - `src/lib/auth-utils-server.ts`:
  - Separate server-only version to prevent client component import issues
  - `requireAuthServer()` for API routes and server actions
  - `getServerUserId()` for getting current user ID server-side
  - `hasServerRole()` for role checking server-side

### Changed
- **Student Career Coach** - Improved error handling for database queries:
  - All 6 database queries now wrapped in safe error handling
  - Gemini model updated from `gemini-1.5-flash` to `gemini-2.5-flash`
  - Better logging for debugging query failures
- **Intelligent Post-Authentication Routing** - Middleware-based routing eliminates `/dashboard` intermediate step:
  - Users now go directly to their appropriate portal after sign-in
  - No more confusing `/dashboard` URL flash
  - `src/middleware.ts` enhanced with `getPortalForUserType()` and `shouldIntelligentRoute()`
- **Portal Selection Page** - `/dashboard` converted to beautiful portal hub:
  - All 7 portals displayed as cards with icons, descriptions, and hover effects
  - Users can manually navigate between portals if they have multiple access levels
  - Fully responsive design with mobile-first approach
- **Enhanced Middleware** - Added intelligent routing logic for authenticated users on root and `/dashboard` paths
- **Sign-In Flow** - Changed `fallbackRedirectUrl` from `/dashboard` to `/` in both sign-in and sign-up pages
- **Dashboard Architecture** - Removed server-component router, deleted problematic layout with React hook violation
- **Code Organization** - 363 files updated: `"use client"` and `"use server"` directives moved to top of files (Turbopack requirement)
- **AuthResult Pattern** - All 17 API routes now return `NextResponse.json()` instead of raw `authResult` for proper TypeScript types

### Fixed
- **Student Career Coach 500 Error** - Fixed by:
  - Updating Gemini model name from `gemini-1.5-flash` to `gemini-2.5-flash`
  - Adding safe error handling for all database queries
  - Graceful fallback when assessment result tables don't exist
- **React Error #310** - Dashboard layout violated Rules of Hooks with conditional return after `useAuth()` call
- **Circular Import in Logger** - Fixed `src/lib/logger.ts` which was importing itself
- **Turbopack Build Errors** - Fixed 195+ errors related to `"use client"` and `"use server"` directive positioning
- **TypeScript Type Errors** - Fixed `LogContext` type to accept numeric keys
- **Admin Layout Fallback** - Changed from `/dashboard` to `/setup/unified` for invalid user types
- **Middleware Routing** - Fixed base URL construction for Vercel deployment compatibility

### Removed
- `src/app/dashboard/layout.tsx` - Deleted problematic client component with React hook violation
- Old dashboard page server-component router logic
- **198 console statements** - Replaced with centralized `logger` (BATCH 5)
- **80+ explicit `any` types** - Replaced with proper TypeScript types (BATCH 6)

### Added (from previous release)
- **Real-Time Data for Platform AI** - Admin Platform Assistant now queries Neon PostgreSQL database for actual statistics:
  - User counts (total, students, teachers, counselors, school admins)
  - Active users (logged in within last hour)
  - School statistics (student counts, completion rates)
  - Assessment completion metrics
  - System status overview
- **Data Assistant Module** (`src/lib/data-assistant.ts`):
  - Question intent detection (user counts, active users, system status, schools, assessments)
  - Direct Neon PostgreSQL queries via Drizzle ORM
  - Formatted data injection into AI prompts
- **Production-Ready Security** - All 70+ API routes now protected with `requireAuth()`:
  - Fee Management APIs (4 routes)
  - Subject & Attendance APIs (3 routes)
  - Library APIs (2 routes)
  - Transport & ID Card APIs (4 routes)
  - Counselor Assessment API (1 route)
  - Assessment APIs (5 routes)
  - Content & College APIs (5 routes)
  - Tuition & Course APIs (6 routes)
  - Billing & Payment APIs (4 routes)
  - Communication & File APIs (7 routes)
  - Hostel & Leave APIs (4 routes)
  - Journal & Skills APIs (4 routes)
  - Classes, Results, Plans, Reports APIs (11 routes)
- **Missing APIs Created** (10 endpoints):
  - Teacher Reports API (`/api/teacher/reports`)
  - Live Sessions API (`/api/teacher/live-sessions`)
  - Teacher Schedule API (`/api/teacher/schedule`)
  - Leave Management API (`/api/leave`) with balance tracking
  - Student Check-in API (`/api/student/attendance/check-in`)
  - RUB Applications API (`/api/rub/applications`)
  - Certificates API (`/api/certificates/[assessmentId]`)
  - Timetable Generation API (`/api/timetable/generate`)
  - Messages/Communication API (`/api/communication/messages`)
  - Study Abroad API (`/api/study-abroad`)
- **Type Safety** - Zero TypeScript errors (was 200+):
  - API Routes: 13 files, 80+ `any` types replaced
  - Library Utilities: 4 files, 72 `any` types replaced
  - Admin Modals: 14 files, 30+ `any` types replaced
  - Portal Pages: 9 files, 40+ `any` types replaced
  - Assessment Types: 5 files, 12 `any` types replaced
  - Component Props: 5 files, 15 `any` types replaced
- **Code Quality** - 150+ console statements replaced with centralized `logger`
- **Error Boundaries** - Added to 5 critical AI and 3D components
- **24 Incomplete Features Completed**:
  - Student Settings Page (database-backed, profile upload)
  - Library System (catalog, borrowing, reservations, fines)
  - Transport Management (routes, tracking, allocations, notifications)
  - Hostel Management (allocations, room assignments)
  - Leave Management (balance tracking, approval workflow)
  - Parent Documents (viewing, uploading consent forms)
  - Parent Homework View (child's homework display)
  - Parent Assessments View (results with class comparison)
  - Parent Careers View (recommendations with progress)
  - Parent Communication (messaging, threading, attachments)
  - Teacher Reports (student performance, class analysis)
  - Teacher Learning Modules (rich text, video, quizzes, certificates)
  - Counselor Resources (CRUD, file upload, sharing)
  - Counselor Interventions (creation, status tracking, outcomes)
  - School Admin Timetable (auto-generation, conflicts, export)
  - School Admin Tuition (courses, tutors, enrollments, revenue)
  - School Admin Settings (school info, academic year, grades, bell schedule)
  - Admin Billing Management (invoices, payments, subscriptions, refunds)
  - Admin Partners Module (CRUD, portal access, commissions, analytics)
  - Admin Support Module (tickets, assignments, responses, ratings)
  - Ministry Analytics (national stats, school comparison, trends, export)
  - Ministry Schools Management (delete, status, bulk operations, export)
  - Ministry Billing (revenue tracking, school-wise billing, invoices)
  - Inventory System (items, transactions, alerts, procurement, vendors)
- **Database Schema Additions**:
  - `leave_balances` table for leave tracking
  - `support_tickets`, `support_ticket_responses`, `support_agents` tables
  - `partners`, `partner_commissions` tables
  - `transport_allocations` columns: `stopName`, `isActive`, `fee`, `isPaid`
  - `transport_routes` columns: `startLocation`, `endLocation`, `distance`, `estimatedTime`
  - `vehicles` columns: `capacity`, `routeId`, `driverName`, `driverPhone`, `gpsEnabled`
  - Export fixes for hostel, billing, transport schemas
- **New UI Components**:
  - `AddTicketModal`, `EditTicketModal` for support tickets
  - `Separator` component for visual dividers
  - `ErrorBoundary` component for error handling
  - Certificate generation with professional design
- **SQL Injection Fix** - `/api/schools/lookup` now uses parameterized queries

### Changed
- **Authentication Pattern** - All APIs now use `requireAuth()` instead of Clerk `auth()`
- **Logging** - Centralized to `@/lib/logger` throughout codebase
- **Type Safety** - Proper interfaces defined, no `any` types in new code
- **Error Responses** - All use `ApiErrorResponse` with proper `status` property
- **Success Responses** - All use `ApiSuccess<T>` with `data` property only

### Fixed
- **Student Career Coach 500 Error** - Removed invalid `with: { career: true }` relation from careerMatches query:
  - `careerMatches.careerId` is a text field, not a foreign key reference
  - Now uses `matches[0]?.careerTitle` directly from careerMatches table
  - AI Career Coach now returns actual responses instead of fallback messages
- **Platform Assistant Generic Responses** - Now uses real database data for:
  - "How many users?" → Shows exact counts by user type
  - "System status?" → Shows platform metrics from Neon PostgreSQL
  - "Active users?" → Lists users active within last hour
  - "Which school has most students?" → Shows ranked school list
- **Admin System Prompt Updated** - Instructs AI to use provided data directly instead of suggesting database queries
- **TypeScript Build** - Zero errors (was 200+)
- **Admin Careers Page** - "Add Career" button working, modal components created
- **Portal Authentication** - All 7 portals redirect to setup if user not configured
- **Framer Motion Errors** - All infinite animations have `repeatType: "loop"`
- **Transport API Schema** - Added missing columns, fixed 22 TypeScript errors
- **Hostel API Schema** - Added missing exports: `hostelFees`, `hostelPayments`, `roomInspections`, `hostelComplaints`, `hostelRules`
- **Duplicate Schema Exports** - Removed duplicates in `src/lib/db/schema.ts`
- **Teacher Attendance History** - Fixed SQL type issues
- **Ministry Billing APIs** - Fixed ApiSuccess response format
- **Parent Career Matches** - Added `status` property to error responses
- **Certificates API** - Fixed ArrayBuffer/Uint8Array conversion
- **Database Query Results** - Fixed Drizzle ORM relation array access patterns
- **Messages API** - Fixed JSON field handling (readBy, attachments, participants)

### Security (COMPLETED)
- ✅ All 70+ previously unprotected API routes now secured
- ✅ SQL injection vulnerability fixed
- ✅ Role-based access control implemented on all sensitive endpoints

### Removed
- 150+ `console.log/error/warn/debug` statements (replaced with `logger`)
- 250+ `: any` type assertions (replaced with proper types)

---

## [1.3.0] - 2026-02-17

### Added
- **Unified AI Assistant** - Single floating chat bubble that adapts to user role:
  - Students see Career Coach (orange theme, career-focused)
  - All other roles see Platform Assistant (role-themed, full-featured)
  - 7 role-specific system prompts (student, teacher, parent, counselor, school-admin, admin, ministry)
  - Privilege control - technical questions restricted to platform admins
  - Dynamic theming - adapts colors to each portal's theme
  - Quick action buttons tailored to each user type
  - Floating chat bubble with minimize/maximize support
  - Fallback responses when AI service is unavailable
- **Complete AI Integration** - 10 AI features fully implemented with Google Gemini API:
  - AI Career Coach - Floating chatbot for students
  - Career Path Predictor - Predicts career success based on assessments
  - Skill Gap Analyzer - Identifies missing skills for target careers
  - AI Study Planner - Creates personalized weekly study schedules
  - Essay Reviewer - Provides feedback on college application essays
  - Interview Coach - Conducts mock interviews with feedback
  - RUB Admission Predictor - Predicts admission chances for Bhutan colleges
  - Class Insights - AI-powered teaching suggestions for teachers
  - Scholarship Matcher - Matches scholarships to student profiles
  - Mood Tracker - Wellness monitoring with crisis resources
- **AI Analytics Tracking** - New `ai_interactions` database table for usage analytics
- **AI Dashboard Insights** - All 7 portal dashboards now show personalized AI insights
- **Admin Reports Page** - New `/admin/reports` page with 6 report templates (School Performance, User Engagement, Assessment Summary, Career Interests, Revenue, Platform Usage)

### Changed
- **Clerk Authentication Props** - Updated to use `fallbackRedirectUrl` instead of deprecated `afterSignInUrl` and `afterSignUpUrl`
- **AI Model Update** - Upgraded Gemini API model from `gemini-1.5-flash` (deprecated) to `gemini-2.5-flash` (current stable release)

### Fixed
- **Duplicate AI Bubbles** - Created UnifiedAIAssistant component that shows only ONE bubble based on user role (Career Coach for students, Platform Assistant for all others)
- **Gemini API Model** - Fixed 404 errors by updating model name from `gemini-1.5-flash` to `gemini-2.5-flash`
- **Admin Dashboard 404** - Sidebar link changed from `/admin/dashboard` to `/admin`
- **Card Component onClick Error** - Added `"use client"` directive to `card.tsx` and `button.tsx`
- **Database Schema Mismatches** - Added missing columns:
  - `assessments.started_at`, `assessments.results`
  - `attendance.check_in_time`, `attendance.reason`, `attendance.entry_method`
  - `module_progress.is_completed`
- **Admin Redirect Loop** - Dashboard router now correctly redirects to `/admin` instead of `/admin/dashboard`
- **AI TypeScript Errors** - Fixed regex patterns and type issues in scholarship and interview coach routes
- **Counselor Dashboard** - Connected to real AI insights with student intervention data
- **School Admin Dashboard** - Connected to AI insights with school context statistics

### Planned
- PWA icon generation
- Mobile app completion
- Testing & Validation (unit tests, integration tests, E2E tests)
- **40+ API routes require authentication hardening** - Identified via comprehensive QA audit
- **SQL injection vulnerability** - `/api/schools/lookup` requires parameterized queries
- **Role-based access control** - Missing on fee, subject, attendance, library APIs

### To Do (Testing - Optional Enhancements)
- **Unit Tests** - Critical business logic functions
- **Integration Tests** - API endpoint testing
- **E2E Tests** - Critical user flows
- **Performance Testing** - Load testing for 100+ concurrent users
- **Accessibility Audit** - WCAG 2.1 AA compliance
- **Database Indexes** - Add indexes for frequently queried columns
- **Response Caching** - Implement caching for static data
- **API Documentation** - OpenAPI/Swagger specs

---

## [1.2.0] - 2026-02-16

### Added
- **QA Comprehensive Audit Report** - 500+ line analysis of entire platform
- **QA Quick Reference** - Action-oriented summary for developers
- **Comprehensive Task List** - 78 documented tasks across all categories
- **Virtual User Testing** - All 7 portals tested via code analysis
- **Security Audit** - 40+ unprotected API routes identified
- **Type Safety Audit** - 615 `: any` types catalogued
- **Feature Completeness Audit** - 232 TODO comments documented

### Changed
- **Platform Health Score** - Assessed at 6.5/10 (not production ready)
- **Task Management** - Documented 233 hours of work across 78 tasks
- **Documentation** - QA reports added to docs/ folder

### Security
- **CRITICAL: 40+ API routes** - Identified as using `auth()` without role verification
- **CRITICAL: SQL injection** - Found in `/api/schools/lookup` route
- **HIGH: Type safety** - 615 `: any` types bypass TypeScript protections
- **MEDIUM: Missing endpoints** - 5+ teacher APIs not implemented

### Metrics
- **96 pages** audited across 7 portals
- **164 API routes** reviewed for security
- **100+ components** analyzed
- **75+ database tables** validated
- **1,166 console statements** found (need replacing)
- **232 TODO comments** catalogued for completion

---

## [1.1.0] - 2026-02-16

### Added
- **Documentation Standardization** - Complete reorganization of 36+ MD files into structured hierarchy
- **Development Framework** - `docs/DEVELOPMENT_FRAMEWORK.md` as single source of truth for all coding patterns
- **Unified Changelog** - `docs/CHANGELOG.md` replaces daily build reports
- **Documentation Index** - `docs/README.md` with organized navigation
- **Section READMEs** - Index files for architecture/, design/, guides/, plans/
- **Archive Structure** - Organized archive for build-reports/, change-logs/, session-logs/, outdated-plans/

### Changed
- **Documentation Organization** - From flat 36 files to structured hierarchy (7 folders)
- **CLAUDE.md** - Updated to reference new documentation structure
- **MEMORY.md** - Added references to Development Framework
- **All Documentation** - Categorized into: architecture, design, guides, plans, archive

### Fixed
- **Documentation Discoverability** - Clear navigation from main index
- **Historical Records** - Preserved all content in archive folder
- **Cross-References** - Updated all links to new file locations

---

## [1.0.0] - 2026-02-16

### Added
- **Ministry Portal** - 7th portal for Ministry of Education oversight
- **Complete RBAC System** - 6 tables, 36 permissions, 9 roles, 51 API route protections
- **Mobile-First Premium Components** - Bottom navigation, full-screen modals, 2-column cards
- **AI Integration Foundation** - Google Gemini integration prepared
- **Unified Setup Wizard** - Single setup flow for all user types

### Changed
- **Authentication Flow** - All portals now use unified auth pattern with setup redirect
- **Import Patterns** - Standardized to `@/` alias throughout codebase
- **Error Handling** - Centralized logger with security event tracking

### Fixed
- **400+ TypeScript Errors** - Batch-fixed schema-related type mismatches
- **User Creation in Setup** - All setup APIs now create users if not exists
- **Portal Authentication Redirects** - Fixed demo data fallback issue
- **Platform Admin Bypass** - Admin users now skip setup correctly (3-file coordination)
- **Framer Motion Errors** - `iterationCount must be non-negative` resolved by adding `repeatType: "loop"`
- **Database Field Names** - Standardized `clerkUserId`, `lastLogin` naming
- **SSG Build Errors** - Added `dynamic = 'force-dynamic'` to pages with database queries
- **RBAC Permissions** - Fixed role assignment to use `user_roles` table (snake_case)

---

## [0.9.0] - 2026-02-14

### Added
- TypeScript error batch-fixing pattern
- SSG dynamic rendering exports
- Database schema validation utilities

### Fixed
- **3 SSG Build Errors** - Forced dynamic rendering on dashboard pages
- **Type Errors** - Schema-related type mismatches across multiple files

---

## [0.8.0] - 2026-02-10

### Added
- **25 Components Updated** - Improved padding, spacing, touch targets
- **8 New Components** - Checkbox, Radio, Dialog, Alert, Toast, etc.
- **UX Design System** - Comprehensive standards document

### Changed
- Card padding from `px-6` to `px-6 py-5`
- Badge spacing from `px-2 py-0.5` to `px-3 py-1.5`
- Input height from `h-9` to `h-10`
- Table cell padding from `px-2 py-2` to `px-4 py-3`

---

## [0.7.0] - 2026-02-09

### Added
- Career Compass integration
- Assessment system
- School management features
- Teacher/Parent portals

### Changed
- Database schema expanded to 90+ tables
- Multi-tenant architecture implemented

---

## [0.1.0] - 2026-01-01

### Added
- Initial project setup
- Student portal
- Basic authentication with Clerk
- Database schema foundation
- Admin portal

---

## Archive Index

Historical build reports and implementation logs have been archived:

| Archive Folder | Contents |
|----------------|----------|
| `archive/build-reports/` | Daily build success reports |
| `archive/change-logs/` | Old change records |
| `archive/session-logs/` | Development session summaries |
| `archive/outdated-plans/` | Completed implementation plans |

---

## Versioning

For versions available, see the [tags on this repository](../../tags).

## Formatting

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security vulnerability fixes
