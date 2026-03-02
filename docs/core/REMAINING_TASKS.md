# Remaining Tasks - Bhutan EduSkill Platform

> **Generated:** 2026-02-17 (Updated)
> **Platform Health:** 9.0/10
> **Previous Work:** 9 batches completed (auth migrations, database tables, console statements, type fixes, library stats, rate limiting, audit logging, database indexes, type safety)
> **Total Remaining:** ~26 hours of work

---

## Summary of Current State

| Metric | Value | Status |
|--------|-------|--------|
| TypeScript Errors | 0 | ✅ Clean build |
| Explicit `any` types | ~131 | ⚠️ Reduced from 241 |
| Console statements | 0 | ✅ All replaced |
| Database indexes | 80 | ✅ Complete |
| Incomplete features | 8 | ⚠️ 1 completed |
| Rate limiting | ✅ | ✅ Complete |
| Audit logging | ✅ | ✅ Complete |

---

## ✅ COMPLETED BATCHES

### ✅ BATCH 5: Replace Console Statements (COMPLETED)
- **Status:** ✅ Complete
- **Result:** 198 console statements replaced with `logger`
- **Files:** 69 client component and lib files

### ✅ BATCH 6: Fix Explicit Any Types (COMPLETED)
- **Status:** ✅ Partially Complete (80+ fixed)
- **Result:** Reduced from 241 to ~131 explicit `any` types
- **Files:** 25+ files with high priority fixes

### ✅ BATCH 7: Library Statistics API (COMPLETED)
- **Status:** ✅ Complete
- **Result:** Real database queries replacing mock data
- **File:** `src/app/api/library/stats/route.ts`

### ✅ BATCH 8: Database Indexes (COMPLETED)
- **Status:** ✅ Complete
- **Result:** 80 indexes added to 15+ tables
- **Impact:** Query performance improvement

### ✅ BATCH 9: Rate Limiting (COMPLETED)
- **Status:** ✅ Complete
- **Result:** Sliding window rate limiting on critical routes
- **Files:** `src/lib/rate-limit.ts` + protected routes

### ✅ BATCH 10: Audit Logging (COMPLETED)
- **Status:** ✅ Complete
- **Result:** Non-blocking audit trail for security compliance
- **Files:** `src/lib/audit-log.ts` + applied to sensitive operations

---

## REMAINING BATCHES

**Impact:** Improved debugging, production monitoring
**Priority:** 🟡 MEDIUM
**Files:** ~69 files

### Progress
- ✅ 380+ console statements replaced in API routes (BATCH 3)
- ⏳ 198 remaining in client components and lib files

### Files with Most Console Statements

| File | Count | Priority |
|------|-------|----------|
| `src/app/parent/communication/page.tsx` | 14 | High |
| `src/app/school-admin/timetable/page.tsx` | 8 | Medium |
| `src/app/teacher/learning/page.tsx` | 6 | Medium |
| `src/app/teacher/layout.tsx` | 6 | Medium |
| `src/app/student/modules/page.tsx` | 6 | Medium |
| `src/app/teacher/dashboard/page.tsx` | 5 | Medium |
| `src/app/school-admin/settings/page.tsx` | 7 | Medium |

### Fix Pattern

```typescript
// Add import
import { logger } from "@/lib/logger";

// Replace console.log
console.log("Data:", data);
// With
logger.debug("Data loaded", { data });

// Replace console.error
console.error("Error:", error);
// With
logger.error(error);

// For client components, use console.debug (development only)
if (process.env.NODE_ENV === 'development') {
  console.debug("Component data:", data);
}
```

---

## BATCH 6: Fix Explicit Any Types (12 hours)

**Impact:** Type safety, reduced runtime errors
**Priority:** 🟡 MEDIUM
**Files:** 112 files

### Top Files Requiring Fixes

| File | `: any` count | Priority |
|------|--------------|----------|
| `src/lib/data-export/index.ts` | 12 | High |
| `src/app/api/ai/insights/route.ts` | 7 | High |
| `src/app/admin/teachers/page.tsx` | 9 | Medium |
| `src/app/admin/counselors/page.tsx` | 8 | Medium |
| `src/app/admin/reports/page.tsx` | 6 | Medium |
| `src/app/api/hostel/route.ts` | 6 | Medium |
| `src/lib/ai-features/index.ts` | 7 | Medium |
| `src/app/school-admin/fees/defaulters/route.ts` | 5 | Low |

### Common Patterns to Fix

#### Pattern 1: API Response Types
```typescript
// WRONG
const data: any = await response.json();

// CORRECT
interface ApiResponse {
  success: boolean;
  data: UserData[];
}
const data = await response.json() as ApiResponse;
```

#### Pattern 2: Database Query Results
```typescript
// WRONG
const results: any[] = await db.select().from(users);

// CORRECT
import { User } from "@/lib/db/schema";
const results = await db.select().from(users) as User[];
```

#### Pattern 3: Dynamic Objects
```typescript
// WRONG
const metadata: any = {};

// CORRECT
interface Metadata {
  [key: string]: string | number | boolean;
}
const metadata: Metadata = {};
```

#### Pattern 4: Array Operations
```typescript
// WRONG
const first = array[0] as any;

// CORRECT
const first = array[0] ?? null;
// OR
type FirstItem = typeof array[0] | null;
const first: FirstItem = array[0] ?? null;
```

---

## BATCH 7: Complete Incomplete Features (29 hours)

### FEAT-1: Library Statistics API (4 hours)
**File:** `src/app/api/library/stats/route.ts`

**Requirements:**
- Real borrow count by month
- Real returns count by month
- Real new books added by month
- Active reservations count
- Overdue books count
- Most borrowed books list

**Current:** Returns mock data

### FEAT-2: Counselor Sessions Feature (3 hours)
**Files:** Counselor portal pages + API

**Status:** Table exists but feature incomplete

**Requirements:**
- Session scheduling UI
- Session status tracking
- Session notes functionality
- Session history view
- Calendar integration

### FEAT-3: Ministry Analytics (6 hours)
**File:** `src/app/ministry/analytics/page.tsx`

**Requirements:**
- Real enrollment growth calculations
- Historical trend data
- School performance comparison
- Regional statistics
- Export to CSV/PDF

### FEAT-4: Admin Partner Analytics (3 hours)
**File:** `src/app/admin/partners/[id]/analytics/page.tsx`

**Requirements:**
- Commission tracking
- Referral statistics
- Revenue attribution
- Performance metrics

### FEAT-5: Clerk User Creation API (2 hours)
**File:** Admin user management

**Requirements:**
- Integrate Clerk Backend API
- Send invite emails
- Verify user creation
- Handle errors gracefully

### FEAT-6: Email Notification System (4 hours)
**Files:** Multiple notification locations

**Requirements:**
- Integrate Resend/SendGrid
- Create notification templates
- User email preferences
- Delivery tracking
- Retry failed sends

### FEAT-7: File Upload Virus Scanning (2 hours)
**File:** File upload handlers

**Requirements:**
- Integrate ClamAV or similar
- Scan before storage
- Quarantine infected files
- Notify admins

### FEAT-8: User Deletion Cleanup (3 hours)
**File:** Admin user management

**Requirements:**
- Identify all related records
- Soft delete option
- Hard delete with confirmation
- Cascade cleanup script

### FEAT-9: School Admin Bell Schedule (2 hours)
**File:** `src/app/api/school-admin/settings/bell-schedule/route.ts`

**Requirements:**
- Complete CRUD API
- Validation for time overlaps
- School-specific schedules
- Day-of-week patterns

---

## BATCH 8: Add Database Indexes (1 hour)

**Impact:** Query performance improvement
**Priority:** 🟡 MEDIUM
**File:** `src/lib/db/schema.ts`

### Indexes to Add

```typescript
// Users table
.index("idx_users_clerk_id", users.clerkUserId)
.index("idx_users_school_id", users.schoolId)
.index("idx_users_type", users.type)

// Schools table
.index("idx_schools_code", schools.code)

// Assessments table
.index("idx_assessments_user_id", assessments.userId)
.index("idx_assessments_type", assessments.type)

// Homework table
.index("idx_homework_class_id", homework.classId)

// Attendance table
.index("idx_attendance_student_id", attendanceRecords.studentId)
.index("idx_attendance_date", attendanceRecords.date)

// Counseling sessions
.index("idx_counseling_student", counselingSessions.studentId)
.index("idx_counseling_counselor", counselingSessions.counselorId)
```

---

## BATCH 9: Implement Rate Limiting (3 hours)

**Impact:** DDoS protection, API stability
**Priority:** 🟢 LOW
**File:** `src/lib/rate-limit.ts`

### Requirements

- Replace in-memory rate limiting
- Integrate Redis (or Vercel KV)
- Per-user rate limits
- Per-IP rate limits
- Burst allowance
- Sliding window counter

### Implementation Pattern

```typescript
// src/lib/rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL);

export async function checkRateLimit(
  identifier: string,
  limit: number = 100,
  window: number = 60000 // 1 minute
): Promise<{ allowed: boolean; remaining: number }> {
  const key = `ratelimit:${identifier}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window / 1000);
  }

  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
  };
}
```

---

## BATCH 10: Add Audit Logging (4 hours)

**Impact:** Security compliance, accountability
**Priority:** 🟡 MEDIUM
**Files:** Sensitive operation endpoints

### Operations to Log

| Operation | Details to Log |
|-----------|----------------|
| User creation | Who created, which user, timestamp |
| User deletion | Who deleted, which user, reason |
| School creation/modification | Admin, school, changes |
| Grade changes | Teacher, student, old grade, new grade |
| Fee modifications | Admin, student, old amount, new amount |
| Assessment results | Teacher, student, scores |
| Login attempts | User, IP, success/failure |

### Implementation Pattern

```typescript
// src/lib/audit-log.ts
export async function logAuditEvent(data: {
  action: string;
  userId: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, any>;
  ipAddress?: string;
}) {
  await db.insert(auditLogs).values({
    id: nanoid(),
    ...data,
    timestamp: new Date(),
  });
}

// Usage in API routes
await logAuditEvent({
  action: "user.created",
  userId: user.id,
  targetId: newUser.id,
  targetType: "user",
  details: { role: newUser.role },
  ipAddress: request.headers.get("x-forwarded-for"),
});
```

---

## Priority Order Recommendation

### Phase 1: Critical for Production (8 hours)
1. **BATCH 8** - Database indexes (1 hour) - Performance impact
2. **BATCH 5** - Console statements in high-traffic files (1 hour)
3. **FEAT-1** - Library Statistics API (4 hours) - User-facing
4. **FEAT-2** - Counselor Sessions (2 hours) - User-facing

### Phase 2: Code Quality (15 hours)
5. **BATCH 5** - Remaining console statements (2 hours)
6. **BATCH 6** - High-priority any type fixes (8 hours)
7. **BATCH 10** - Audit logging (4 hours)
8. **FEAT-5** - Clerk User Creation (2 hours)

### Phase 3: Features & Polish (30 hours)
9. **BATCH 6** - Remaining any type fixes (4 hours)
10. **FEAT-3** - Ministry Analytics (6 hours)
11. **FEAT-6** - Email Notifications (4 hours)
12. **FEAT-4** - Partner Analytics (3 hours)
13. **FEAT-7,8,9** - Remaining features (9 hours)
14. **BATCH 9** - Rate Limiting (3 hours)
15. **Testing & Documentation** (5 hours)

---

## File Changes Summary

### BATCH 5 Files (69 files)
- `src/app/parent/communication/page.tsx` (14 console)
- `src/app/school-admin/timetable/page.tsx` (8 console)
- `src/app/teacher/learning/page.tsx` (6 console)
- `src/app/teacher/layout.tsx` (6 console)
- `src/app/student/modules/page.tsx` (6 console)
- `src/app/teacher/dashboard/page.tsx` (5 console)
- `src/app/school-admin/settings/page.tsx` (7 console)
- `src/app/parent/dashboard/page.tsx` (3 console)
- `src/app/parent/documents/page.tsx` (4 console)
- `src/app/parent/homework/page.tsx` (2 console)
- ... and 59 more files

### BATCH 6 Files (112 files)
- `src/lib/data-export/index.ts` (12 any types)
- `src/app/api/ai/insights/route.ts` (7 any types)
- `src/app/admin/teachers/page.tsx` (9 any types)
- `src/app/admin/counselors/page.tsx` (8 any types)
- `src/app/admin/reports/page.tsx` (6 any types)
- `src/app/api/hostel/route.ts` (6 any types)
- `src/lib/ai-features/index.ts` (7 any types)
- `src/app/api/school-admin/fees/defaulters/route.ts` (5 any types)
- ... and 104 more files

---

## Quick Reference Commands

```bash
# Check TypeScript errors
npx tsc --noEmit

# Count console statements
grep -r "console\." src/ --include="*.ts" --include="*.tsx" | wc -l

# Count explicit any types
grep -r ": any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Run build
npm run build

# Push database schema
npm run db:push

# Start dev server
npm run dev
```

---

*Generated: 2026-02-17*
*Platform Version: v1.3.0+*
*Previous Tasks Completed: 4 batches (auth, database, console, types)*
