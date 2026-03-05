# Bhutan EduSkill - Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - March 4, 2026

#### Unified API System (Complete Migration)
- **11 New Feature Files** - Complete feature definitions with schema, permissions, and actions:
  - `timetable-slots.feature.ts` - Day/time scheduling for timetables
  - `submissions.feature.ts` - Homework submissions with draft/submitted/graded workflow
  - `rubrics.feature.ts` - Assessment rubrics with duplicate action
  - `messages.feature.ts` - Internal messaging with markRead and unreadCount
  - `roadmaps.feature.ts` - Career/learning roadmaps with updateProgress
  - `skill-gaps.feature.ts` - Track skill gaps and learning needs
  - `schedule-exceptions.feature.ts` - Timetable exceptions with approve/cancel
  - `resource-shares.feature.ts` - Resource sharing with read/write/admin permissions
  - `library-loans.feature.ts` - Book loans with returnBook and renew actions
  - `library-fines.feature.ts` - Fine tracking with pay and waive actions
  - `transport-routes.feature.ts` - Vehicle routes with getStops and updateLoad
  - `treatment-plans.feature.ts` - Counselor treatment plans with goals and interventions

#### Webhook System
- **Clerk Webhook** - Added to `users.feature.tsx` (user.created, user.updated, user.deleted)
- **Stripe Webhook** - Added to `subscriptions.feature.tsx` (checkout.session.completed, subscription events, invoice.paid)

#### API Unified Structure
```
src/app/api/
├── resources/[resource]/          ← Unified CRUD (all resources)
│   ├── route.ts                   ← Main CRUD handler
│   ├── actions/route.ts           ← Non-CRUD operations
│   ├── public/route.ts            ← Public endpoints
│   └── webhooks/route.ts          ← Webhook handlers
│
├── admin/*                         ← Platform admin (separate)
├── webhooks/*                      ← External webhooks (separate)
├── setup/*                         ← Setup flows (separate)
└── payments/*                      ← Payment integration (separate)
```

#### Frontend API Call Updates
- Updated `admin-layout-client.tsx` - `/api/auth/set-role` → `/api/resources/users/actions/get-role`
- Updated `use-portal-auth.ts` - Migrated to unified API, simplified to single call

### Changed - March 4, 2026

#### Build Improvements
- **48 build warnings → 0 warnings** - Fixed all import errors
- Added all missing exports to `features/index.ts`
- Added singular aliases (UserFeature, StudentFeature, etc.)
- Fixed `TimetableFeature` alias for timetables
- Fixed Sync icon import → RefreshCw in sync-clerk page

#### Features Index
- Cleaned up duplicate exports (removed stubs for real features)
- Updated lazy features map with real implementations
- Added proper exports for all 11 new features

### Fixed - March 4, 2026
- Fixed missing `eq` import in `schools.feature.ts` public handlers
- Fixed duplicate `LibraryFineFeature` exports causing build failure
- Fixed runtime issues in feature definitions

---

## [2.0.0] - February 25, 2026

### Added
- Query optimization patterns (13 N+1 problems fixed)
- Type safety improvements (85 `any` types eliminated)
- Security patterns documentation
- Design system documentation

### Changed
- DEVELOPMENT_FRAMEWORK.md v1.1
- AGENT_SOP.md v1.3
- Memory organization updates

---

## [1.0.0] - Initial Release
- 7 Portals (Platform Admin, School Admin, Teacher, Student, Parent, Counselor, Ministry)
- 145+ database tables
- 354+ API routes
- 218+ components
- 0 TypeScript errors
