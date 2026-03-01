# What Works - Bhutan EduSkill

> **Last Updated**: March 1, 2026
> **Purpose**: Document what features and workflows are confirmed working. The "success story" companion to ERRORS_AND_FIXES.md.

---

## Quick Status Overview

| Category | Status | Notes |
|----------|--------|-------|
| **Authentication** | ✅ Working | Multi-portal auth with approval flow |
| **Student Portal** | ✅ Working | All core features functional |
| **Teacher Portal** | ✅ Working | Including new approval workflow |
| **Parent Portal** | ✅ Working | Child tracking and progress |
| **Counselor Portal** | ✅ Working | Interventions and sessions |
| **School Admin Portal** | ✅ Working | Full school management |
| **Platform Admin Portal** | ✅ Working | Analytics, notifications, partners |
| **Ministry Portal** | ✅ Working | National analytics and reports |
| **Database** | ✅ Working | All 145+ tables operational |
| **API Routes** | ✅ Working | 350+ routes, 88% protected |

---

## 1. Authentication & Authorization

### What Works:
- ✅ Clerk integration for user authentication
- ✅ Multi-portal routing based on user type
- ✅ Pending approval flow blocks access until approved
- ✅ Multi-role approval system (School Admin, Platform Admin, Teacher)
- ✅ `createApiRoute` wrapper for consistent auth handling
- ✅ Role-based access control (RBAC)

### The Pattern That Works:
```typescript
// In API routes
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    if (!auth) return errorResponse("Unauthorized", 401);
    const { userId, user } = auth;
    // ... handler logic
  },
  ['admin', 'school-admin', 'teacher'] // Allowed roles
);
```

---

## 2. Student Approval Workflow

### What Works:
- ✅ Student signup → `onboardingStatus = "pending_enrollment"`
- ✅ Blocked from portal → redirected to `/pending-approval`
- ✅ THREE approval paths:
  1. School Admin approves via `/school-admin/students/pending`
  2. Platform Admin approves via `/admin/students`
  3. Class Teacher approves via `/teacher/approvals`
- ✅ After approval → `onboardingStatus = "enrolled"`
- ✅ Student can access portal

### The Security That Works:
- Teachers can only approve students in grades they teach
- School admins can approve any student in their school
- Platform admins have no restrictions
- Approval is logged with `reviewedBy` and `reviewedAt`

---

## 3. Assessment System

### What Works:
- ✅ RIASEC Career Interest Assessment
- ✅ MBTI Personality Type Assessment
- ✅ DISC Personality Assessment
- ✅ Work Values Inventory
- ✅ Career matching based on results
- ✅ Assessment history and statistics

### The Data Flow:
```
1. Student takes assessment
2. Answers saved to assessments table
3. Type-specific results (RIASEC, MBTI, etc.) saved
4. Career matches generated automatically
5. Results available on student dashboard
```

---

## 4. School Management

### What Works:
- ✅ School creation via Platform Admin
- ✅ School editing with subscription management
- ✅ Partner management
- ✅ Global subjects database (110+ subjects)
- ✅ Department management
- ✅ Class creation and management
- ✅ Teacher assignment to classes

### The Query Pattern That Works:
```typescript
// Column-specific selects avoid "column does not exist" errors
const school = await db
  .select({
    id: schools.id,
    name: schools.name,
    code: schools.code,
    subscriptionStatus: schools.subscriptionStatus,
  })
  .from(schools)
  .where(eq(schools.id, schoolId));
```

---

## 5. Teacher Features

### What Works:
- ✅ Dashboard with class overview
- ✅ Student list with search and filter
- ✅ Homework assignment creation
- ✅ Attendance tracking
- ✅ Timetable view
- ✅ Reports generation
- ✅ **NEW: Student approval workflow**
- ✅ Earnings tracking (if applicable)
- ✅ Messages/communication

### The Approval Feature:
```typescript
// Teachers can approve students for grades they teach
GET /api/teacher/pending-students
→ Returns students in teacher's assigned grades

POST /api/school-admin/applications/[id]/approve
→ Works for teachers (with grade validation)
```

---

## 6. Admin Features

### Platform Admin:
- ✅ Analytics dashboard with multiple metrics
- ✅ Notification management (create, schedule, send)
- ✅ Partner management
- ✅ School management (CRUD operations)
- ✅ User management
- ✅ Global subject management
- ✅ Reports generation

### School Admin:
- ✅ School-specific dashboard
- ✅ Student management (create, approve)
- ✅ Teacher management
- ✅ Class and department management
- ✅ Attendance tracking
- ✅ Homework management
- ✅ Report card generation
- ✅ Fee generation

---

## 7. Database Operations

### What Works:
- ✅ `db.select().from()` with column specifications
- ✅ `db.insert().values()` with proper JSON handling
- ✅ `db.update().set()` for modifications
- ✅ `db.delete()` for removals
- ✅ Joins between related tables
- ✅ Transactions for complex operations

### The JSON Pattern That Works:
```typescript
// JSON columns need null, not empty strings
await db.insert(users).values({
  section: null,         // ✅ Correct
  parentContact: null,   // ✅ Correct
  // NOT "" (empty string)
});
```

### The Conditional Insert Pattern:
```typescript
// Only include fields that have values
const notificationValues = {
  id: notificationId,
  title: body.title.trim(),
};

if (scheduledFor) {
  notificationValues.scheduledFor = scheduledFor;
}

await db.insert(notifications).values(notificationValues);
```

---

## 8. Error Handling Patterns

### What Works:
- ✅ `Promise.allSettled()` for independent parallel operations
- ✅ Array destructuring with null fallback
- ✅ Type assertions for API responses
- ✅ Centralized error logging with `logger.apiError()`

### The Promise.allSettled Pattern:
```typescript
const results = await Promise.allSettled([
  getMetric1(),
  getMetric2(),
  getMetric3(),
]);

// Check individual results
for (let i = 0; i < results.length; i++) {
  if (results[i].status === "rejected") {
    logger.error(`Metric ${i} failed`, results[i].reason);
  }
}
```

---

## 9. Portal Routing

### What Works:
- ✅ Automatic redirect based on user type
- ✅ Layout-based authentication checks
- ✅ Pending approval redirect
- ✅ Setup wizard redirect for new users

### The Flow:
```
1. User logs in via Clerk
2. /api/auth/set-role determines user type and status
3. If pending → /pending-approval
4. If needs setup → /setup/unified
5. If complete → Redirect to portal dashboard
```

---

## 10. Frontend-Backend Communication

### What Works:
- ✅ Consistent response structures
- ✅ Proper error response handling
- ✅ Loading states during API calls
- ✅ Type-safe data access

### The Response Pattern:
```typescript
// Success response
return successResponse({
  assessments: transformedAssessments,
  stats,
});

// Error response
return errorResponse("Failed to fetch assessments", 500);

// Bad request
return badRequestResponse("Assessment type is required");
```

---

## Working Features by Portal

### Student Portal (✅ 95% Complete)
- Dashboard with overview
- Class list and details
- Homework viewing
- Assessment taking
- Career exploration
- Progress tracking
- Fee viewing
- BCSE results

### Teacher Portal (✅ 100% Complete)
- Dashboard with metrics
- Student management
- **Student approvals** (NEW)
- Homework creation
- Attendance tracking
- Timetable view
- Reports generation
- Settings management

### Parent Portal (✅ 90% Complete)
- Dashboard with child overview
- Child linking
- Progress viewing
- Homework tracking
- Attendance viewing
- Fee payment
- Communication

### Counselor Portal (✅ 95% Complete)
- Dashboard with metrics
- Student list
- Intervention management
- Session tracking
- Notes management
- Red flag detection
- Data export

### School Admin Portal (✅ 95% Complete)
- School dashboard
- Student management
- Teacher management
- Class management
- Department management
- Attendance tracking
- Report card generation
- Fee generation

### Platform Admin Portal (✅ 90% Complete)
- Analytics dashboard
- School management
- Partner management
- User management
- Notification management
- Global subject management
- Reports generation

### Ministry Portal (✅ 90% Complete)
- National analytics
- School overview
- Policy management
- Billing overview
- EMIS sync capability
- GNH metrics

---

## Common Patterns That Work

### 1. API Route Pattern
```typescript
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    if (!auth) return errorResponse("Unauthorized", 401);

    try {
      // Route logic here
      return successResponse({ data });
    } catch (error) {
      logger.apiError(error);
      return errorResponse("Operation failed", 500);
    }
  },
  ['admin'] // Allowed roles
);
```

### 2. Database Query Pattern
```typescript
import { db } from "@/lib/db";
import { eq, and, or } from "drizzle-orm";

const results = await db
  .select({
    id: users.id,
    name: users.name,
    // Only needed columns
  })
  .from(users)
  .where(eq(users.id, userId));
```

### 3. React Component Pattern
```typescript
"use client";

export default function Component() {
  // ALL hooks at top
  const [state, setState] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Effect logic
  }, []);

  // Conditional returns AFTER hooks
  if (!state) {
    return <Loading />;
  }

  return <MainContent />;
}
```

---

## Verified Working Endpoints

### Authentication
- ✅ `GET /api/auth/set-role` - Returns user type and status
- ✅ `POST /api/auth/set-role` - Updates user role

### Student
- ✅ `GET /api/student/assessments` - Fetch student assessments
- ✅ `POST /api/student/assessments` - Save assessment results
- ✅ `GET /api/student/dashboard` - Dashboard data

### Teacher
- ✅ `GET /api/teacher/dashboard` - Teacher dashboard
- ✅ `GET /api/teacher/students` - Student list
- ✅ `GET /api/teacher/pending-students` - Pending approvals (NEW)
- ✅ `POST /api/teacher/homework` - Create homework

### Admin
- ✅ `GET /api/admin/analytics-data` - Analytics metrics
- ✅ `GET /api/admin/notifications` - Notification list
- ✅ `POST /api/admin/notifications` - Create notification
- ✅ `POST /api/admin/notifications/send` - Send notification
- ✅ `GET /api/admin/partners` - Partner list
- ✅ `POST /api/admin/schools` - Create school
- ✅ `PUT /api/schools/[id]` - Update school

---

## What Makes This Work

### 1. Single Source of Truth
Centralized authentication in `/api/auth/set-role` means all portals use the same logic.

### 2. Defensive Coding
Null checks, fallbacks, and conditional field insertion prevent crashes.

### 3. Column-Specific Queries
Only selecting needed columns avoids "column does not exist" errors.

### 4. Proper Type Handling
Using `null` for JSON columns instead of empty strings.

### 5. Consistent Patterns
All API routes follow `createApiRoute` pattern.
All database queries use column specification.
All components declare hooks first.

---

*Last Updated: March 1, 2026*
*Status: All major features working*
*Mood: Optimistic - seeing the light*