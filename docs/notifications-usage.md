# Push Notifications - Implementation Complete

## Overview

The push notification system is now fully implemented with real-time polling, toast notifications, and a beautiful UI component.

## Files Created

### 1. Notification Hook
**File:** `src/lib/hooks/use-notifications.ts`
- Real-time polling (configurable interval)
- Unread count tracking
- Toast notifications for new items
- Mark as read functionality

### 2. Notification Bell Component
**File:** `src/components/ui/notification-bell.tsx`
- Bell icon with unread badge
- Dropdown with recent notifications
- Mark all as read functionality
- Empty state handling
- Urgent notification indicator (red pulse)

### 3. Send Notification Helper
**File:** `src/lib/notifications/send.ts`
- Simplified API for sending notifications
- Pre-built helpers for common events
- Bulk notification support
- Email fallback hooks

### 4. Notifications Page
**File:** `src/app/[portal]/notifications/page.tsx`
- Full-page view of all notifications
- Filter by status (all/unread/read)
- Filter by type (homework/grade/attendance/etc.)
- Mark all as read

## Usage Examples

### In a Component (Client-side)

```tsx
"use client";

import { NotificationBell } from "@/components/ui/notification-bell";

export default function Layout() {
  return (
    <header>
      <NotificationBell pollingInterval={30000} enableToasts={true} />
    </header>
  );
}
```

### Sending a Notification (Server-side/API Route)

```typescript
import { sendNotification } from "@/lib/notifications/send";

// Send to a specific user
await sendNotification({
  userId: "user-123",
  title: "Homework Due",
  message: "Your math homework is due tomorrow at 5 PM.",
  type: "homework",
  priority: "high",
  actionUrl: "/student/homework/math-123",
});

// Send to all students in a school
await sendNotification({
  targetAudience: "students",
  schoolId: "school-456",
  title: "School Closure",
  message: "School will be closed tomorrow due to weather conditions.",
  type: "alert",
  priority: "urgent",
});
```

### Pre-built Notification Helpers

```typescript
import {
  notifyHomeworkDue,
  notifyAssessmentPosted,
  notifyAttendanceMarked,
  notifyGradePosted,
  notifyFeeReminder,
  notifyMessageReceived,
} from "@/lib/notifications/send";

// Homework due reminder
await notifyHomeworkDue({
  studentId: "student-123",
  homeworkTitle: "Chapter 5 Problems",
  subject: "Mathematics",
  dueDate: new Date("2026-03-01"),
  actionUrl: "/student/homework/123",
});

// Fee reminder (sends email if urgent)
await notifyFeeReminder({
  parentId: "parent-456",
  studentName: "Tashi Wangmo",
  amount: 1500,
  dueDate: new Date("2026-03-15"),
  actionUrl: "/parent/fees",
});
```

### Sending from an API Route

```typescript
// src/app/api/teacher/homework/route.ts
import { sendNotification } from "@/lib/notifications/send";

export async function POST(req: Request) {
  const { title, subject, dueDate, classIds } = await req.json();

  // Create homework...
  const homework = await createHomework({ title, subject, dueDate });

  // Notify all students in the class
  const students = await getStudentsByClass(classIds);
  const studentIds = students.map(s => s.id);

  await sendNotification({
    userIds: studentIds,
    title: "New Homework Posted",
    message: `${title} for ${subject} is due on ${new Date(dueDate).toLocaleDateString()}.`,
    type: "homework",
    priority: "normal",
    actionUrl: `/student/homework/${homework.id}`,
  });

  return Response.json({ success: true });
}
```

## Notification Types

| Type | Use Case | Priority |
|------|----------|----------|
| `homework` | Homework assignments, reminders | normal/urgent |
| `assessment` | Tests, quizzes posted | high |
| `grade` | Grades posted | normal |
| `attendance` | Attendance marked, absences | high if absent |
| `fee` | Fee payment reminders | urgent when due soon |
| `message` | New messages | normal |
| `announcement` | General announcements | normal |
| `alert` | Urgent alerts | urgent |
| `reminder` | Deadline reminders | high |
| `welcome` | Welcome messages | low |

## API Endpoints

### Get Notifications
```
GET /api/notifications/my-notifications?limit=20&status=all
```

### Get Unread Count
```
GET /api/notifications/my-notifications/unread-count
```

### Mark as Read
```
POST /api/notifications/my-notifications
{
  "deliveryIds": ["del-123", "del-456"]
}
```

### Mark All as Read
```
POST /api/notifications/my-notifications
{
  "markAll": true
}
```

## Integration with Existing Components

The `NotificationBell` component is already integrated into the portal sidebar:
- File: `src/components/shared/portal-sidebar.tsx`
- Line: Replaced the placeholder notification button

## Polling Configuration

Default polling interval is 30 seconds. Adjust based on your needs:

```tsx
<NotificationBell pollingInterval={60000} /> // 1 minute
<NotificationBell pollingInterval={15000} /> // 15 seconds
```

## Next Steps

1. **Email Integration**: Connect the email fallback to your email service
2. **Push Notifications**: Integrate with Web Push API for browser notifications
3. **SMS Notifications**: Add SMS provider for urgent alerts
4. **Notification Preferences**: Build UI for users to customize their notification settings

## Testing

To test the notification system:

1. Open the browser DevTools Console
2. Navigate to any portal page
3. Use this snippet to create a test notification:

```javascript
fetch('/api/notifications', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'Test Notification',
    message: 'This is a test notification from the dev console.',
    type: 'announcement',
    priority: 'normal',
  }),
});
```

Or create a test API route:

```typescript
// src/app/api/test/notifications/route.ts
import { sendNotification } from "@/lib/notifications/send";
import { requireAuth } from "@/lib/auth-utils";

export async function POST(req: Request) {
  const { userId } = await requireAuth();

  await sendNotification({
    userId,
    title: "Test Notification",
    message: "This is a test notification sent at " + new Date().toLocaleTimeString(),
    type: "announcement",
    priority: "normal",
  });

  return Response.json({ success: true });
}
```
