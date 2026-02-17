# Changelog

All notable changes to the Bhutan EduSkill platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Fixed
- **Admin Portal - Reports Page**
  - Added PDF report generation using jsPDF library
  - Fixed report generation and download buttons
  - Connected to real API endpoint at `/api/admin/reports`
  - Added PDF and JSON export options for reports

- **Admin Portal - Teachers Page**
  - Fixed bug in `updateTeacher` function where undefined `teacher` variable was referenced
  - Edit teacher functionality now works correctly

- **Admin Portal - Counselors Page**
  - Fixed duplicate `revalidatePath` import in actions file

- **Teacher Portal - Homework Page**
  - Replaced mock data with real API calls to `/api/teacher/homework`
  - Added loading states, error handling, and notifications
  - Connected create, delete, and publish buttons to backend

- **Student Portal - Homework Page**
  - Replaced mock data with API calls to `/api/student/homework`
  - Implemented real homework submission functionality
  - Added draft saving feature
  - Added loading states and error notifications

- **Database Schema**
  - Added `counseling_sessions` table for counselor portal sessions functionality
  - Table includes fields for session type, status, scheduling, recurring sessions, and notes

### Changed
- Updated API response types in `/api/admin/reports` to properly include `status` field in error responses
- Fixed TypeScript type issues in admin reports API route

### Dependencies
- Added `jspdf` package for PDF report generation

## [0.2.0] - 2026-02-16

### Added
- Build 23 completed with major TypeScript error fixes
- Admin portal functionality improvements
- Multiple portal layout fixes

### Fixed
- Fixed 200+ TypeScript type errors across the codebase
- Fixed database schema column mismatches
- Fixed Framer Motion animation issues
- Fixed import inconsistencies

## [0.1.0] - 2026-02-15

### Added
- Initial platform release with 7 portals (Admin, Teacher, Student, Parent, Counselor, School-Admin, Ministry)
- Multi-tenant school management system
- Career assessment and guidance features
- Homework management system
- User authentication via Clerk
- PostgreSQL database with Drizzle ORM
