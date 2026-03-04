# Changelog

All notable changes to Bhutan EduSkill will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added - Version 2.0.0 (March 4, 2026) - Unified Architecture Migration

#### Architecture Migration
- **Complete Migration to Unified Architecture** - Removed all old manual API routes and components
  - Deleted 13 old API route directories (`/api/students`, `/api/teachers`, `/api/classes`, etc.)
  - Deleted 3 old component directories (`/components/attendance`, `/components/homework`, `/components/forms`)
  - Single universal API pattern: `/api/resources/[resource]`
  - Single component set: `FeatureDataGrid`, `FeatureForm`, `FeatureListPage`

- **Feature Definitions System** (`src/features/`)
  - 53 feature definitions created (`.feature.tsx` files)
  - Lazy loading pattern to avoid circular dependencies
  - `getFeature()` helper for runtime feature access
  - Schema, permissions, and UI configuration in one place

- **Generated Pages** - 104 unified pages auto-generated from feature definitions
  - List pages for all entities
  - Detail pages with edit/view modes
  - Form pages with validation
  - Consistent UX across all portals

#### Core Infrastructure
- **Lazy Loading Feature Exports** (`src/features/index.ts`)
  - Runtime `require()` pattern to prevent circular dependencies
  - Feature aliases for backward compatibility
  - Centralized feature registry

- **Universal API Route** (`src/app/api/resources/[resource]/route.ts`)
  - Handles all CRUD operations for any resource
  - Pagination, filtering, sorting, searching
  - Permission-based access control
  - Validation using feature schemas

- **Notification System** (`src/components/unified/Notifications.tsx`)
  - Toast notifications (success, error, info, warning)
  - In-app notification center
  - Native JavaScript implementation (no date-fns dependency)
  - Singleton toast manager pattern

- **Root Layout Update** (`src/app/layout.tsx`)
  - Added `NotificationProvider` for global notifications
  - Consolidated provider setup

#### E2E Testing
- **Unified API Tests** (`src/tests/e2e/unified-api.spec.ts`)
  - Pagination, filtering, sorting tests
  - CRUD operation tests
  - Permission tests
  - Validation tests
  - Performance benchmarks

- **Unified UI Tests** (`src/tests/e2e/unified-ui.spec.ts`)
  - Data grid rendering tests
  - Form validation tests
  - Navigation tests
  - Accessibility tests
  - Responsive design tests

#### Migration Scripts
- **Full Migration Script** (`scripts/full-migration.ts`)
  - Automated deletion of old APIs
  - Automated deletion of old components
  - Feature definition generation
  - Unified page generation
  - Root layout updates
  - Migration report generation

- **Cleanup Scripts**
  - `fix-features.sh` - Removes duplicate feature files
  - `create-missing-features.sh` - Creates missing feature definitions
  - `cleanup-migration.ts` - Cleans up after migration

#### Build Results
- Production build: **SUCCESS** (601 static pages generated)
- TypeScript errors: **0**
- All routes compiling successfully
- Old system completely removed

#### Breaking Changes
- All old API routes removed - use `/api/resources/[resource]` instead
- All old component directories removed - use unified components
- Feature files now use lazy loading pattern
- Duplicate feature files removed

### Changed
- Previous version moved to [0.9.0]

---

## [Unreleased]

### Added - Version 1.0.0 (March 3, 2026)

#### Infrastructure & Performance
- **Analytics Charts** (`src/components/charts/analytics-charts.tsx`)
  - Bar, Line, Pie, Area, Multi-line, Stacked bar, Gauge charts
  - Responsive design with Recharts
  - Consistent color scheme across platform

- **Email System** (`src/lib/email/email-system.ts`)
  - Template-based notification system
  - Queue for batch sending
  - Templates: assessments, homework, attendance, roadmap alerts

- **Loading Skeletons** (`src/components/loading/skeletons.tsx`)
  - Dashboard, Table, Card, List, Form skeleton states
  - Consistent loading UX

- **Dark Mode Theme** (`src/lib/theme/dark-theme.ts`)
  - Complete dark mode color configuration
  - Consistent styling across all portals

- **Animation Constants** (`src/lib/theme/animations.ts`)
  - Standardized durations and easing functions
  - Consistent motion design

- **Error Handling UI** (`src/lib/utils/error-handling.tsx`)
  - User-friendly error cards
  - Recovery actions and severity levels

- **API Response Caching** (`src/lib/cache/query-cache.ts`)
  - LRU cache implementation
  - TTL-based expiration
  - Cache stores: dashboard, analytics, reports, config

- **Image Optimization** (`src/lib/images/optimization.ts`)
  - Next.js image utilities
  - Responsive sizes and quality settings
  - Blur placeholder generation

- **Bundle Code Splitting** (`src/lib/performance/code-splitting.ts`)
  - Dynamic import wrappers
  - Heavy component lazy loading
  - Route-based code splitting

- **Database Indexes** (`src/lib/db/indexes.ts`)
  - Performance optimization indexes
  - User, assessment, enrollment, homework, attendance, grade indexes

#### Features
- **Notification Center** (`src/components/notifications/notification-center.tsx`)
  - Unified alerts across all portals
  - Bell icon with unread count
  - Mark as read/dismiss actions
  - Skeleton loading state

- **Real-time Updates** (`src/app/api/stream/route.ts`)
  - Server-Sent Events for live data
  - Connection heartbeat
  - Portal-specific streaming

- **Global Search** (`src/lib/search/global-search.ts`)
  - Search students, teachers, schools, assessments
  - Fuzzy matching
  - Portal-specific filtering

- **Bulk Operations** (`src/lib/bulk/operations.ts`)
  - Multi-select actions for students, assessments, teachers
  - Bulk assign, activate, delete, publish
  - Error tracking and results

- **Advanced Filters** (`src/lib/data/filters.ts`)
  - Complex query builder
  - Student, teacher, assessment filters
  - Pagination support

- **Data Export** (`src/lib/data/export.ts`)
  - CSV, Excel, PDF export for all portals
  - Student data, assessment results, grades reports
  - Workforce data export

- **Calendar Integration** (`src/lib/calendar/integration.ts`)
  - Event scheduling and management
  - Recurring events
  - iCal export support

- **File Upload Enhancements** (`src/lib/uploads/enhanced.ts`)
  - Drag-drop upload with progress
  - File validation
  - Chunked upload support

#### Security & Infrastructure
- **Audit Logging** (`src/lib/audit/logging.ts`)
  - Activity tracking for all user actions
  - Entity-level audit logs
  - Security event logging

- **Backup System** (`src/lib/backup/system.ts`)
  - Database backup creation
  - Incremental backups
  - Backup integrity verification

- **Security Hardening** (`src/lib/security/hardening.ts`)
  - Rate limiting implementation
  - Input sanitization
  - CSRF protection
  - Security headers configuration
  - Password strength validator
  - File upload validation

- **Monitoring Setup** (`src/lib/monitoring/setup.ts`)
  - Client-side error tracking
  - Performance monitoring (Web Vitals)
  - User behavior tracking
  - Server-side logging

#### Testing
- **Accessibility Audit** (`src/lib/testing/accessibility.ts`)
  - WCAG 2.1 AA compliance tools
  - Alt text, form labels, heading hierarchy checks
  - Color contrast, keyboard accessibility, ARIA validation

- **Mobile Testing** (`src/lib/testing/mobile.ts`)
  - Mobile device viewport configs
  - Touch target size testing
  - Text readability validation
  - Mobile navigation testing

- **E2E Test Suite** (`src/tests/e2e/expanded.spec.ts`)
  - Mobile UX tests
  - Authentication flow tests
  - Assessment flow tests
  - Teacher/School Admin workflow tests
  - Performance and accessibility tests

#### Documentation
- **API Documentation** (`docs/api/openapi-spec.yaml`)
  - OpenAPI 3.0 specification
  - All endpoints documented
  - Authentication, schemas, responses

- **Component Storybook** (`.storybook/`)
  - Storybook configuration
  - Component stories: Button, Input, Card
  - Design system documentation

#### CI/CD
- **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
  - Lint, type check, unit tests
  - E2E testing with Playwright
  - Security scanning
  - Accessibility auditing
  - Automated deployment to Vercel

- **Storybook Deploy** (`.github/workflows/storybook.yml`)
  - Automated Storybook builds
  - Chromatic deployment

#### Sales & Business
- **Pricing Model** (`src/lib/pricing-config.ts`)
  - 4 tiers: Starter, Growth, Premier, Enterprise
  - Bhutan-specific discounts (Rural, Ministry)
  - Annual payment savings

- **Demo Materials** (`docs/sales/BHUTAN_EDUSKILL_PITCH.md`)
  - 16-slide pitch deck
  - One-pager document
  - ROI calculator

- **Sales CRM** (`src/lib/db/schema/sales-schema.ts`)
  - Leads, activities, tasks, documents
  - Pipeline tracking

- **School Onboarding** (`src/components/onboarding/school-onboarding-wizard.tsx`)
  - 5-step guided setup
  - Dzongkha support

- **Trial Conversion** (`src/components/sales/trial-conversion.tsx`)
  - Trial banner and modal
  - Extension offers

#### Intelligence Layer
- **Roadmap Engine** (`src/lib/intelligence/roadmap-engine.ts`)
  - Personalized Class 6 → Class 12 → RUB → Career roadmaps
  - RIASEC-based career matching

- **BCSE Tracker** (`src/lib/intelligence/bcse-tracker.ts`)
  - Grade tracking vs BCSE requirements
  - Gap analysis and alerts

- **RUB Matcher** (`src/lib/intelligence/rub-matcher.ts`)
  - College matching based on profile
  - Admission requirements

- **Workforce Analyzer** (`src/lib/intelligence/workforce-analyzer.ts`)
  - Ministry workforce predictions
  - 2028, 2030, 2035 projections

- **GNH Integration** (`src/lib/intelligence/gnh-analyzer.ts`)
  - 6 GNH domains
  - Weighted scoring

### Changed
- Fixed mobile homepage navigation (removed back-to-top button blocking hamburger menu)
- Fixed mobile nav text contrast (gray-900 for visibility)
- Simplified sign-in page (removed unnecessary elements)
- Connected intelligence engine to all assessment APIs

### Fixed
- Assessment report display in Student Portal
- Teacher assessment results view
- School Admin assessment analytics

---

## [0.9.0] - Previous Releases

### Platform Features
- 7 portal authentication (Student, Teacher, School Admin, Parent, Counselor, Admin, Ministry)
- 145+ database tables
- 354+ API routes
- 218+ components
- RIASEC, MBTI, DISC, SPARK, Work Values assessments
- Homework management
- Attendance tracking
- Grade management
- Class management
- School management

---

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | March 3, 2026 | Complete platform with all features |
| 0.9.0 | February 2026 | Core platform functionality |
