# Comprehensive Task List v2.0 - Bhutan EduSkill Platform

> **Generated:** 2026-02-17 (Re-Run)
> **Based On:** QA Comprehensive Audit Report v2.0
> **Platform Version:** v1.3.0+
> **Previous Tasks:** 78 tasks completed in v1.3.0

This document contains ALL remaining tasks identified during the comprehensive QA re-audit, organized by priority and category.

---

## Table of Contents

1. [High Priority - Authentication Consistency](#high-priority---authentication-consistency)
2. [High Priority - Missing Database Tables](#high-priority---missing-database-tables)
3. [Medium Priority - Incomplete Features](#medium-priority---incomplete-features)
4. [Medium Priority - Code Quality](#medium-priority---code-quality)
5. [Low Priority - Type Safety](#low-priority---type-safety)
6. [Low Priority - Optimizations](#low-priority---optimizations)
7. [Optional - Testing & Documentation](#optional---testing--documentation)

---

## High Priority - Authentication Consistency

### AUTH-001: Migrate Teacher Attendance API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['teacher'])`

**File:**
- [ ] `src/app/api/teacher/attendance/route.ts`

**Fix Pattern:**
```typescript
// Replace:
const { userId } = await auth();
if (!userId) return NextResponse.json({ error: "Unauthorized" });

// With:
const authResult = await requireAuth(['teacher']);
if ('error' in authResult) return authResult;
const { userId, user } = authResult;
```

---

### AUTH-002: Migrate Teacher Dashboard API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['teacher'])`

**File:**
- [ ] `src/app/api/teacher/dashboard/route.ts`

---

### AUTH-003: Migrate Teacher Attendance Detail API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['teacher'])`

**File:**
- [ ] `src/app/api/teacher/attendance/[classId]/[date]/route.ts`

---

### AUTH-004: Migrate Parent Attendance API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['parent'])`

**File:**
- [ ] `src/app/api/parent/attendance/route.ts`

---

### AUTH-005: Migrate Parent Children API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['parent'])`

**File:**
- [ ] `src/app/api/parent/children/route.ts`

---

### AUTH-006: Migrate Student Attendance Records API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['student'])`

**File:**
- [ ] `src/app/api/student/attendance/my-records/route.ts`

---

### AUTH-007: Migrate Library API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with `requireAuth(['student', 'teacher', 'admin'])`

**File:**
- [ ] `src/app/api/library/route.ts`

---

### AUTH-008: Migrate Events API

**Priority:** 🟡 MEDIUM
**Estimated Time:** 10 minutes
**Files Affected:** 1 file

**Task:** Replace `auth()` with appropriate role check

**File:**
- [ ] `src/app/api/events/route.ts`

---

### AUTH-009 to AUTH-024: Migrate Remaining Routes

**Priority:** 🟡 MEDIUM
**Estimated Time:** 20 minutes
**Files Affected:** 16 files

**Task:** Replace `auth()` with `requireAuth()` in remaining routes

**Files:**
- [ ] `src/app/api/assessment-submissions/[id]/route.ts`
- [ ] `src/app/api/assessment-types/[id]/questions/route.ts`
- [ ] `src/app/api/teacher/homework/[id]/draft/route.ts`
- [ ] `src/app/api/teacher/homework/[id]/route.ts`
- [ ] `src/app/api/student/homework/[id]/draft/route.ts`
- [ ] `src/app/api/student/homework/[id]/route.ts`
- [ ] `src/app/api/files/[id]/route.ts`
- [ ] `src/app/api/student/content/scholarships/matched/route.ts`
- [ ] And 8 more homework/content related routes

---

## High Priority - Missing Database Tables

### DB-001: Create Counseling Sessions Table

**Priority:** 🟡 HIGH
**Estimated Time:** 2 hours
**Impact:** High - Counselor Sessions feature completely broken

**Task:** Create `counseling_sessions` table and update API

**Requirements:**
```typescript
// Add to src/lib/db/schema.ts
export const counselingSessions = pgTable("counseling_sessions", {
  id: text("id").primaryKey(),
  studentId: text("student_id").references(() => users.id, { onDelete: "cascade" }),
  counselorId: text("counselor_id").references(() => users.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  status: text("status").notNull(), // scheduled, completed, cancelled, no-show
  sessionType: text("session_type").notNull(), // individual, group, emergency
  notes: text("notes"),
  outcome: text("outcome"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

**Steps:**
- [ ] Add table to schema
- [ ] Run `npm run db:push`
- [ ] Update `/api/counselor/sessions` API
- [ ] Test session creation and listing

---

### DB-002: Create Library Reservations Table

**Priority:** 🟡 MEDIUM
**Estimated Time:** 1 hour
**Impact:** Medium - Library reservation feature incomplete

**Task:** Create `library_reservations` table

**Requirements:**
```typescript
export const libraryReservations = pgTable("library_reservations", {
  id: text("id").primaryKey(),
  bookId: text("book_id").references(() => books.id),
  userId: text("user_id").references(() => users.id),
  reservedAt: timestamp("reserved_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull(), // active, claimed, expired, cancelled
  notifiedAt: timestamp("notified_at"),
});
```

**Steps:**
- [ ] Add table to schema
- [ ] Run `npm run db:push`
- [ ] Update library API for reservations
- [ ] Test reservation flow

---

### DB-003: Create Library Members Table

**Priority:** 🟡 MEDIUM
**Estimated Time:** 1 hour
**Impact:** Medium - Library membership tracking incomplete

**Task:** Create `library_members` table

**Requirements:**
```typescript
export const libraryMembers = pgTable("library_members", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id).unique(),
  memberId: text("member_id").notNull().unique(),
  membershipType: text("membership_type").notNull(), // student, teacher, staff
  joinedAt: timestamp("joined_at").defaultNow(),
  expiresAt: timestamp("expires_at"),
  status: text("status").notNull(), // active, suspended, expired
});
```

**Steps:**
- [ ] Add table to schema
- [ ] Run `npm run db:push`
- [ ] Update library API
- [ ] Test membership flow

---

### DB-004: Create Digital Resources Table

**Priority:** 🟢 LOW
**Estimated Time:** 1 hour
**Impact:** Low - Digital library feature not implemented

**Task:** Create `digital_resources` table for e-books, videos, etc.

---

## Medium Priority - Incomplete Features

### FEAT-001: Complete Library Statistics API

**Priority:** 🟡 HIGH
**Estimated Time:** 4 hours
**File:** `src/app/api/library/stats/route.ts`

**Task:** Implement real statistics calculations

**Requirements:**
- Borrow count by month
- Returns count by month
- New books added by month
- Active reservations count
- Overdue books count
- Most borrowed books

---

### FEAT-002: Implement Counselor Sessions Feature

**Priority:** 🟡 HIGH
**Estimated Time:** 3 hours
**Files:** Counselor portal pages and API

**Task:** Complete sessions feature (after DB-001)

**Requirements:**
- Session scheduling
- Session status tracking
- Session notes
- Session history
- Calendar view

---

### FEAT-003: Implement Real Ministry Analytics

**Priority:** 🟡 MEDIUM
**Estimated Time:** 6 hours
**File:** `src/app/ministry/analytics/page.tsx`

**Task:** Replace mock data with real calculations

**Requirements:**
- Enrollment growth calculations
- Historical trend data
- School performance comparison
- Regional statistics
- Export functionality

---

### FEAT-004: Implement Admin Partner Analytics

**Priority:** 🟢 MEDIUM
**Estimated Time:** 3 hours
**File:** `src/app/admin/partners/[id]/analytics/page.tsx`

**Task:** Replace mock data with real calculations

**Requirements:**
- Commission tracking
- Referral statistics
- Revenue attribution
- Performance metrics

---

### FEAT-005: Implement Clerk User Creation API

**Priority:** 🟢 MEDIUM
**Estimated Time:** 2 hours
**File:** Admin user management

**Task:** Create users via Clerk API when added by admin

**Requirements:**
- Clerk API integration
- Invite email sending
- User verification
- Error handling

---

### FEAT-006: Implement Email Notification System

**Priority:** 🟢 MEDIUM
**Estimated Time:** 4 hours
**Files:** Multiple notification locations

**Task:** Integrate email service (Resend, SendGrid, etc.)

**Requirements:**
- Email service integration
- Notification templates
- Email preferences
- Delivery tracking
- Failed retry logic

---

### FEAT-007: Implement File Upload Virus Scanning

**Priority:** 🟢 LOW
**Estimated Time:** 2 hours
**File:** File upload handlers

**Task:** Integrate virus scanning API (ClamAV, etc.)

---

### FEAT-008: Implement User Deletion Cleanup

**Priority:** 🟢 MEDIUM
**Estimated Time:** 3 hours
**File:** Admin user management

**Task:** Cascade delete related records when user is deleted

**Requirements:**
- Related records identification
- Soft delete option
- Cleanup script
- Confirmation dialog

---

### FEAT-009: Complete School Admin Bell Schedule

**Priority:** 🟢 LOW
**Estimated Time:** 2 hours
**File:** `src/app/api/school-admin/settings/bell-schedule/route.ts`

**Task:** Complete bell schedule management API

---

## Medium Priority - Code Quality

### QUAL-001: Replace Console Statements in API Routes

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours
**Files Affected:** ~180 API route files

**Task:** Replace remaining ~350 console statements with logger

**Progress:** 676 replaced, ~490 remaining

**High Impact Files:**
- [ ] `src/app/api/admin/assessments/actions.ts` (49 statements)
- [ ] `src/app/api/admin/content/actions.ts` (39 statements)
- [ ] `src/app/api/admin/careers/actions.ts` (25 statements)

**Fix Pattern:**
```typescript
// Instead of:
console.log("Data:", data);
console.error("Error:", error);

// Use:
import { logger } from "@/lib/logger";
logger.info("Data loaded", { data });
logger.error(error);
```

---

### QUAL-002: Replace Console Statements in Components

**Priority:** 🟢 LOW
**Estimated Time:** 1 hour
**Files Affected:** ~60 component files

**Task:** Replace remaining ~100 console statements

---

### QUAL-003: Add JSON Parsing Helpers

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours
**File:** `src/lib/db/json-helpers.ts`

**Task:** Create helper functions for JSON text fields

**Requirements:**
- Helper for `users.subjects` field
- Helper for `classes.students` field
- Helper for `schools.facilities` field
- Error handling for malformed JSON

---

### QUAL-004: Add Database Indexes

**Priority:** 🟡 MEDIUM
**Estimated Time:** 1 hour
**File:** `src/lib/db/schema.ts`

**Task:** Add indexes for frequently queried columns

**Columns to Index:**
- `users.clerkUserId`
- `users.schoolId`
- `users.type`
- `schools.code`
- `assessments.userId`
- `homework.classId`
- `attendanceRecords.studentId`
- `counselingSessions.studentId`
- `counselingSessions.counselorId`

---

### QUAL-005: Implement Redis Rate Limiting

**Priority:** 🟢 LOW
**Estimated Time:** 3 hours
**File:** `src/lib/rate-limit.ts`

**Task:** Replace in-memory rate limiting with Redis

---

### QUAL-006: Add Audit Logging

**Priority:** 🟢 LOW
**Estimated Time:** 4 hours
**Files:** Sensitive operation endpoints

**Task:** Log all sensitive operations for audit trail

**Operations to Log:**
- User creation/deletion
- School creation/modification
- Grade changes
- Fee modifications
- Assessment results
- Login attempts

---

## Low Priority - Type Safety

### TYPE-001: Fix Data Export Types

**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours
**File:** `src/lib/data-export/index.ts`

**Task:** Replace 12 `: any` types with proper types

---

### TYPE-002: Fix Admin Page Types

**Priority:** 🟡 MEDIUM
**Estimated Time:** 3 hours
**Files:** Multiple admin pages

**Task:** Replace 39 `: any` types in admin pages

**Files:**
- [ ] `src/app/admin/teachers/page.tsx` (9 occurrences)
- [ ] `src/app/admin/counselors/page.tsx` (8 occurrences)
- [ ] `src/app/admin/reports/page.tsx` (6 occurrences)
- [ ] Other admin pages

---

### TYPE-003: Fix AI Features Types

**Priority:** 🟢 MEDIUM
**Estimated Time:** 2 hours
**File:** `src/lib/ai-features/index.ts`

**Task:** Replace 7 `: any` types

---

### TYPE-004: Fix API Route Types

**Priority:** 🟢 LOW
**Estimated Time:** 5 hours
**Files:** 40+ API route files

**Task:** Replace 111 `: any` types in API routes

---

### TYPE-005: Fix Library Utility Types

**Priority:** 🟢 LOW
**Estimated Time:** 2 hours
**Files:** 4 library files

**Task:** Replace 39 `: any` types

**Files:**
- [ ] `src/lib/api/school-admin.ts`
- [ ] `src/lib/api/student.ts`
- [ ] `src/lib/api/teacher.ts`
- [ ] `src/lib/api/counselor.ts`

---

## Low Priority - Optimizations

### PERF-001: Implement Response Caching

**Priority:** 🟢 LOW
**Estimated Time:** 3 hours
**Files:** Frequently accessed API routes

**Task:** Add caching for static/semi-static data

**Candidates:**
- School list
- Assessment types
- Career database
- College/scholarship data

---

### PERF-002: Implement Pagination

**Priority:** 🟢 MEDIUM
**Estimated Time:** 3 hours
**Files:** Large dataset endpoints

**Task:** Add pagination to improve performance

**Endpoints:**
- Student lists
- Homework lists
- Assessment results
- Reports

---

### PERF-003: Optimize Database Queries

**Priority:** 🟢 LOW
**Estimated Time:** 2 hours
**Files:** Multiple API routes

**Task:** Consolidate similar queries, add joins where appropriate

---

### PERF-004: Lazy Load 3D Components

**Priority:** 🟢 LOW
**Estimated Time:** 1 hour
**Files:** Landing page components

**Task:** Implement dynamic imports for 3D components

---

### PERF-005: Bundle Size Optimization

**Priority:** 🟢 LOW
**Estimated Time:** 4 hours
**Files:** Build configuration

**Task:** Analyze and reduce bundle size

---

## Optional - Testing & Documentation

### TEST-001: Add Unit Tests

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 12 hours

**Task:** Create unit tests for critical functions

**Areas:**
- Authentication utilities
- RBAC permission checks
- Assessment scoring
- Fee calculations
- Data export functions

---

### TEST-002: Add Integration Tests

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 15 hours

**Task:** Create API endpoint integration tests

---

### TEST-003: Add E2E Tests

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 20 hours

**Task:** Create end-to-end tests for critical user flows

---

### TEST-004: Security Audit

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 4 hours

**Task:** Conduct penetration testing

---

### TEST-005: Performance Testing

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 4 hours

**Task:** Load test for 100+ concurrent users

---

### DOC-001: API Documentation

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 8 hours

**Task:** Create OpenAPI/Swagger documentation

---

### DOC-002: Component Storybook

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 8 hours

**Task:** Create Storybook for UI components

---

### DOC-003: Developer Onboarding Guide

**Priority:** 🟢 OPTIONAL
**Estimated Time:** 3 hours

**Task:** Write comprehensive onboarding guide

---

## Summary Statistics

| Category | Tasks | Estimated Time | Priority |
|----------|-------|----------------|----------|
| **Authentication Consistency** | 24 | 2 hours | 🟡 High |
| **Missing Database Tables** | 4 | 5 hours | 🟡 High |
| **Incomplete Features** | 9 | 29 hours | 🟡 Medium |
| **Code Quality** | 6 | 16 hours | 🟡 Medium |
| **Type Safety** | 5 | 14 hours | 🟢 Low |
| **Optimizations** | 5 | 13 hours | 🟢 Low |
| **Testing & Documentation** | 7 | 70 hours | 🟢 Optional |
| **TOTAL** | **60** | **149 hours** | - |

---

## Priority Breakdown

| Priority | Tasks | Estimated Time |
|----------|-------|----------------|
| 🟡 HIGH | 6 | 9 hours |
| 🟡 MEDIUM | 33 | 52 hours |
| 🟢 LOW | 21 | 88 hours |

---

## Quick Start Path (Minimum Viable)

**For immediate production readiness (8 hours):**

1. **AUTH-001 to AUTH-010** (2 hours) - Fix top 10 auth routes
2. **DB-001** (2 hours) - Create counseling_sessions table
3. **QUAL-001** (2 hours) - Replace console statements in critical APIs
4. **QUAL-004** (1 hour) - Add database indexes
5. **TEST-003 (partial)** (1 hour) - Manual testing walkthrough

---

## Progress Tracking

### Completed (v1.3.0)
- ✅ 70+ API routes secured
- ✅ 10 missing APIs created
- ✅ 24 incomplete features completed
- ✅ 150+ console statements replaced
- ✅ SQL injection vulnerability fixed

### Remaining (This Task List)
- ⏳ 24 auth route migrations
- ⏳ 4 database tables
- ⏳ 9 incomplete features
- ⏳ 490 console statements
- ⏳ 549 type safety issues

---

*Last Updated: 2026-02-17*
*Based On: QA Comprehensive Audit Report v2.0*
*Platform Version: v1.3.0+*
*Previous Tasks: 78 completed in v1.3.0*
