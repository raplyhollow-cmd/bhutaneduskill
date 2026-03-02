# Bhutan EduSkill - Implementation Tasklist

**Date:** February 19, 2026
**Goal:** Establish proper node connections following B2B SaaS standards

---

## Task Overview (15 Tasks)

| # | Task | Priority | Est. Time |
|---|------|----------|-----------|
| 1 | Create Service Layer - Assessment to Career Matching | High | 2-3 hrs |
| 2 | Create Global User Context | High | 2 hrs |
| 3 | Fix Dashboard Data (Student/Teacher/Parent) | High | 3-4 hrs |
| 4 | Fix journal table references | High | 1 hr |
| 5 | Complete Clerk Integration | High | 2-3 hrs |
| 6 | Create Repository Layer | Medium | 3-4 hrs |
| 7 | Add Cross-Portal Navigation | Medium | 2 hrs |
| 8 | Connect Homework to Progress | Medium | 2 hrs |
| 9 | Connect Attendance to Report Cards | Medium | 2 hrs |
| 10 | Create Notification Service | Medium | 2 hrs |
| 11 | Install QR/Barcode Packages | Low | 1 hr |
| 12 | Add Images to Documents | Low | 2 hrs |
| 13 | Implement Virus Scanning | Medium | 2 hrs |
| 14 | Create Clerk Webhook | High | 2 hrs |
| 15 | Add Error Boundaries | Low | 2 hrs |

---

## Phase 1: Critical Connections (Week 1)

### Task 1: Create Service Layer - Assessment to Career Matching

**Files to Create:**
- `src/lib/services/assessment.service.ts`
- `src/lib/services/career-matching.service.ts`

**Implementation:**
```typescript
// src/lib/services/career-matching.service.ts
import { db } from "@/lib/db";
import { careers, assessmentResults, users } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

export interface CareerMatch {
  careerId: string;
  careerName: string;
  matchPercentage: number;
  matchingTraits: string[];
  reason: string;
}

export async function calculateCareerMatches(
  userId: string,
  assessmentType: 'riasec' | 'mbti' | 'disc'
): Promise<CandidateMatch[]> {
  // 1. Get latest assessment results
  const results = await db.select()
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, userId))
    .orderBy(desc(assessmentResults.createdAt))
    .limit(1);

  if (!results.length) return [];

  // 2. Extract dominant traits
  const traits = extractTraits(results[0], assessmentType);

  // 3. Match with careers
  const allCareers = await db.select().from(careers);
  const matches = rankByCompatibility(traits, allCareers);

  // 4. Save matches to database
  await saveCareerMatches(userId, matches);

  return matches;
}
```

**Integration Point:** Call this service after assessment completion

---

### Task 2: Create Global User Context

**Files to Create:**
- `src/contexts/UserContext.tsx`

**Implementation:**
```typescript
// src/contexts/UserContext.tsx
"use client";

import { createContext, useContext, useEffect, useState } from "react";

interface UserContextType {
  user: User | null;
  school: School | null;
  permissions: Permission[];
  loading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserContext();
  }, []);

  async function fetchUserContext() {
    const res = await fetch('/api/user/context');
    const data = await res.json();
    setUser(data.user);
    setSchool(data.school);
    setPermissions(data.permissions);
    setLoading(false);
  }

  return (
    <UserContext.Provider value={{ user, school, permissions, loading, refresh: fetchUserContext }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
```

**Files to Modify:**
- `src/app/layout.tsx` - Wrap with UserProvider

---

### Task 3: Fix Dashboard Data

**Files to Modify:**
- `src/app/student/dashboard/page.tsx`
- `src/app/teacher/dashboard/page.tsx`
- `src/app/parent/dashboard/page.tsx`

**Implementation:**
```typescript
// Replace fake data with real queries
export default async function StudentDashboard() {
  const { userId } = await requireAuth(['student']);

  // Real homework count
  const pendingHomework = await db.select()
    .from(homework)
    .where(and(
      eq(homework.classId, student.classId),
      eq(homework.dueDate, new Date())
    ));

  // Real attendance
  const attendance = await db.select()
    .from(attendanceRecords)
    .where(eq(attendanceRecords.studentId, userId));

  const attendanceRate = calculateAttendance(attendance);

  // Real assessment results
  const latestAssessment = await db.select()
    .from(assessmentResults)
    .where(eq(assessmentResults.userId, userId))
    .orderBy(desc(assessmentResults.createdAt))
    .limit(1);

  return <DashboardContent {...realData} />;
}
```

---

### Task 4: Fix Journal Table References

**Files to Modify:**
- `src/app/api/student/assessment-profile/route.ts`
- `src/app/api/ai/insights/route.ts`

**Implementation:**
```typescript
// Check correct table name in schema
// It's likely 'journal' or 'journalEntries'
import { journal } from "@/lib/db/schema";

// Re-enable the commented query
const journalStats = await db.select()
  .from(journal)
  .where(eq(journal.userId, userId));
```

---

### Task 5: Complete Clerk Integration

**Files to Create:**
- `src/lib/clerk-utils.ts`

**Files to Modify:**
- `src/app/api/admin/users/route.ts`

**Implementation:**
```typescript
// src/lib/clerk-utils.ts
export async function createClerkUser(data: {
  email: string;
  firstName: string;
  lastName: string;
  password?: string;
}) {
  const response = await fetch('https://api.clerk.com/v1/users', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: [data.email],
      password: data.password || generatePassword(),
      first_name: data.firstName,
      last_name: data.lastName
    })
  });

  return response.json();
}

export async function sendInvitation(email: string) {
  await fetch('https://api.clerk.com/v1/invitations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email_address: email,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/setup/unified`
    })
  });
}
```

---

### Task 14: Create Clerk Webhook (High Priority)

**Files to Create:**
- `src/app/api/clerk/webhook/route.ts`

**Implementation:**
```typescript
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(req: Request) {
  const headersList = await headers();
  const svixId = headersList.get('svix-id');
  const svixTimestamp = headersList.get('svix-timestamp');
  const svixSignature = headersList.get('svix-signature');

  // Verify webhook signature
  const wh = new Webhook(process.env.CLERK_WEBHOOK_SECRET!);
  const body = await req.text();
  const evt = wh.verify(body, {
    'svix-id': svixId!,
    'svix-timestamp': svixTimestamp!,
    'svix-signature': svixSignature!,
  }) as WebhookEvent;

  // Handle user.created event
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    // Check if user exists in our DB
    const existing = await db.select()
      .from(users)
      .where(eq(users.clerkUserId, id))
      .limit(1);

    if (existing.length === 0) {
      // Create placeholder user
      await db.insert(users).values({
        id: `user_${nanoid()}`,
        clerkUserId: id,
        email: email_addresses[0].email_address,
        firstName: first_name || '',
        lastName: last_name || '',
        type: 'pending', // Will be set during setup
        onboardingComplete: false,
        createdAt: new Date(),
      });
    }
  }

  return NextResponse.json({ success: true });
}
```

---

## Phase 2: Data Connections (Week 2)

### Task 6: Create Repository Layer

**Files to Create:**
- `src/lib/repositories/user.repository.ts`
- `src/lib/repositories/school.repository.ts`
- `src/lib/repositories/assessment.repository.ts`
- `src/lib/repositories/homework.repository.ts`

**Pattern:**
```typescript
// src/lib/repositories/assessment.repository.ts
import { db } from '@/lib/db';
import { assessments, assessmentResults } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const AssessmentRepository = {
  async findByStudentId(studentId: string) {
    return db.select()
      .from(assessments)
      .where(eq(assessments.userId, studentId));
  },

  async findResultsByStudentId(studentId: string) {
    return db.select()
      .from(assessmentResults)
      .where(eq(assessmentResults.userId, studentId));
  },

  async saveResult(data: AssessmentResultInput) {
    return db.insert(assessmentResults).values(data);
  },

  // ... more methods
};
```

---

### Task 7: Add Cross-Portal Navigation

**Files to Modify:**
- `src/components/shared/portal-sidebar.tsx`
- `src/app/teacher/students/[id]/page.tsx`

**Implementation:**
```typescript
// Add "View as..." links
// Teacher can see: View Student Profile, View Career Assessment
// Parent can see: View Detailed Assessment, View Class Performance

// Example in teacher/student page:
<Link href={`/student/assessment/${student.id}`}>
  <Button variant="outline">
    View Assessment Results
  </Button>
</Link>
<Link href={`/student/careers?studentId=${student.id}`}>
  <Button variant="outline">
    View Career Profile
  </Button>
</Link>
```

---

### Task 8: Connect Homework to Progress

**Files to Modify:**
- `src/app/student/progress/page.tsx`
- Create: `src/lib/services/progress.service.ts`

**Implementation:**
```typescript
// Calculate progress from homework submissions
export async function calculateStudentProgress(userId: string) {
  const submissions = await db.select()
    .from(homeworkSubmissions)
    .innerJoin(homework, eq(homeworkSubmissions.homeworkId, homework.id))
    .where(eq(homeworkSubmissions.studentId, userId));

  const completed = submissions.filter(s => s.submission.status === 'graded').length;
  const total = submissions.length;
  const averageGrade = submissions.reduce((sum, s) => sum + (s.submission.grade || 0), 0) / total;

  return {
    completionRate: (completed / total) * 100,
    averageGrade,
    onTimeRate: calculateOnTimeRate(submissions)
  };
}
```

---

### Task 9: Connect Attendance to Report Cards

**Files to Modify:**
- `src/lib/report-cards/aggregator.ts`

**Implementation:**
```typescript
export async function generateReportCard(studentId: string, termId: string) {
  // ... existing code

  // Add attendance data
  const attendance = await db.select()
    .from(attendanceRecords)
    .where(and(
      eq(attendanceRecords.studentId, studentId),
      eq(attendanceRecords.termId, termId)
    ));

  const presentDays = attendance.filter(a => a.status === 'present').length;
  const totalDays = attendance.length;
  const attendanceRate = (presentDays / totalDays) * 100;

  return {
    ...reportCard,
    attendance: {
      present: presentDays,
      total: totalDays,
      rate: attendanceRate
    }
  };
}
```

---

### Task 10: Create Notification Service

**Files to Create:**
- `src/lib/services/notification.service.ts`

**Implementation:**
```typescript
export const NotificationService = {
  async createNotification(data: {
    userId: string;
    type: 'info' | 'warning' | 'success' | 'error';
    title: string;
    message: string;
    link?: string;
  }) {
    await db.insert(notifications).values({
      id: `notif_${nanoid()}`,
      ...data,
      read: false,
      createdAt: new Date(),
    });

    // Send email for important notifications
    if (data.type === 'warning' || data.type === 'error') {
      await sendEmail({
        to: data.userId,
        subject: data.title,
        body: data.message,
      });
    }
  },

  async notifyMinistryVerification(submissionId: string) {
    // Get all platform admins
    const admins = await db.select()
      .from(users)
      .where(eq(users.type, 'admin'));

    for (const admin of admins) {
      await this.createNotification({
        userId: admin.id,
        type: 'info',
        title: 'New Ministry Verification',
        message: 'A ministry account requires verification',
        link: `/admin/verification/${submissionId}`,
      });
    }
  },
};
```

---

## Phase 3: Polish & Enhancements (Week 3-4)

### Task 11: Install QR/Barcode Packages

**Command:**
```bash
npm install qrcode @types/qrcode jsbarcode @types/jsbarcode
```

**Files to Modify:**
- `src/lib/id-cards/qr-generator.ts`
- `src/lib/id-cards/barcode-generator.ts`

---

### Task 12: Add Images to Documents

**Files to Modify:**
- `src/lib/report-cards/pdf-generator.ts`
- `src/lib/id-cards/generator.ts`

---

### Task 13: Implement Virus Scanning

**Files to Create:**
- `src/lib/security/virus-scan.ts`

**Files to Modify:**
- `src/app/api/files/upload/route.ts`

---

### Task 15: Add Error Boundaries

**Files to Create:**
- `src/components/error/error-boundary.tsx`

**Files to Modify:**
- `src/app/layout.tsx`

---

## Execution Order

### Sprint 1 (Days 1-3): Critical Path
1. Task 4: Fix journal table (1 hr) - Unblocks AI
2. Task 2: User Context (2 hrs) - Foundation
3. Task 1: Service Layer (3 hrs) - Connects assessments to careers

### Sprint 2 (Days 4-6): Data Connections
4. Task 3: Dashboard data (4 hrs)
5. Task 8: Homework to Progress (2 hrs)
6. Task 9: Attendance to Report Cards (2 hrs)

### Sprint 3 (Days 7-9): Auth & Integration
7. Task 5: Clerk Integration (3 hrs)
8. Task 14: Clerk Webhook (2 hrs)
9. Task 6: Repository Layer (4 hrs)

### Sprint 4 (Days 10-14): Polish
10. Task 7: Cross-Portal Navigation (2 hrs)
11. Task 10: Notification Service (2 hrs)
12. Tasks 11-15: Remaining polish (8 hrs)

---

## Success Criteria

Each task is complete when:
- [ ] Code follows existing patterns
- [ ] TypeScript compiles without errors
- [ ] Feature works end-to-end
- [ ] Tested with at least 2 user types
- [ ] No console errors