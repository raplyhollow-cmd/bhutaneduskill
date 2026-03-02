# Push Notifications Implementation

This document describes the complete push notification system implemented for the Bhutan EduSkill platform.

## Overview

The push notification system enables real-time notifications to be delivered to users even when they are not actively using the application. It uses the Web Push API with VAPID (Voluntary Application Server Identification) for authentication.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUSH NOTIFICATION FLOW                          │
└─────────────────────────────────────────────────────────────────────────────┘

   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   Teacher    │────▶│   API Route  │────▶│  Push Queue  │
   │   Dashboard  │     │  /api/push/  │     │   Database   │
   └──────────────┘     └──────────────┘     └──────────────┘
                                                        │
                                                        ▼
   ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
   │   Student    │◀────│   Service    │◀────│  Push Sender │
   │   Device     │     │   Worker     │     │   (web-push) │
   └──────────────┘     └──────────────┘     └──────────────┘
```

## Components

### 1. Database Schema (`src/lib/db/push-schema.ts`)

Three tables manage push notifications:

- **`push_subscriptions`** - Stores user device subscriptions
  - Endpoint URL from Push API
  - VAPID keys (p256dh, auth)
  - Device type and user agent
  - Active status and timestamps

- **`push_notifications`** - Queues sent notifications
  - Notification content (title, body, icon)
  - Delivery status tracking
  - Retry count and error handling
  - Scheduled delivery support

- **`push_notification_settings`** - User preferences
  - Master enable/disable switch
  - Per-type preferences (homework, grades, etc.)
  - Quiet hours configuration

### 2. API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/push/subscribe` | POST/GET | Register/manage device subscription |
| `/api/push/unsubscribe` | POST | Remove device subscription |
| `/api/push/send` | POST | Send push notification(s) |
| `/api/push/settings` | GET/PUT | Get/update user preferences |
| `/api/push/vapid-public-key` | GET | Get VAPID public key |

### 3. Client Hooks (`src/hooks/use-push-notification.ts`)

#### `usePushNotification()`

Main hook for managing push subscriptions:

```tsx
const {
  isSupported,       // Browser supports push
  permission,        // Current permission state
  subscription,      // Current subscription object
  isLoading,         // Operation in progress
  error,             // Error message
  requestPermission, // Request notification permission
  subscribe,         // Subscribe to push
  unsubscribe,       // Unsubscribe from push
  checkServerSubscription, // Check if subscribed on server
} = usePushNotification({
  autoSubscribe: true,
  onSubscriptionChange: (sub) => console.log('Subscription changed', sub),
});
```

#### `usePushNotificationStatus()`

Lightweight hook for status only:

```tsx
const {
  isSupported,   // Browser support
  permission,    // Permission state
  hasSubscription, // Has active subscription
  canRequest,    // Can request permission
  isSubscribed,  // Is fully subscribed
} = usePushNotificationStatus();
```

#### `useOneClickSubscribe()`

Simplified hook for one-click subscription button:

```tsx
const {
  canShowPrompt,  // Should show subscribe prompt
  isSubscribed,   // Is subscribed
  isDenied,       // Permission denied
  isLoading,      // Processing
  handleSubscribe,// Handle subscribe click
} = useOneClickSubscribe();
```

### 4. UI Components

#### `NotificationBell` (`src/components/ui/notification-bell.tsx`)

Enhanced with push notification features:

- Shows bell icon with blue ring when subscribed
- Displays push notification prompt after 30 seconds
- Shows subscription status in dropdown
- Quick enable/disable from dropdown

```tsx
<NotificationBell
  pollingInterval={30000}
  displayLimit={5}
  enableToasts={true}
/>
```

#### `PushNotificationSettings` (`src/components/push/push-notification-settings.tsx`)

Full settings panel for managing preferences:

```tsx
<PushNotificationSettings className="max-w-2xl" />
```

Features:
- Master enable/disable toggle
- Per-type notification preferences
- Quiet hours configuration
- Active device management
- Subscribe/unsubscribe controls

#### `PushNotificationToggle` (`src/components/push/push-notification-settings.tsx`)

Lightweight toggle button:

```tsx
<PushNotificationToggle />
```

### 5. Server Sender (`src/lib/push/push-sender.ts`)

Utility functions for sending notifications:

```typescript
// Send single notification
await sendPushNotification({
  userId: 'user-123',
  type: 'homework',
  title: 'New Homework',
  body: 'Math homework due tomorrow',
  data: { url: '/student/homework/123' },
  tag: 'homework:123',
});

// Send bulk notifications
await sendBulkPushNotifications(userIds, {
  type: 'announcement',
  title: 'School Closed',
  body: 'School closed tomorrow due to weather',
});

// Helper functions
await sendHomeworkNotification(userId, 'Math Chapter 5', '2024-03-15');
await sendGradeNotification(userId, 'Math', 'A');
await sendAttendanceNotification(userId, 'Present', '2024-03-15');
await sendAnnouncementNotification(userIds, 'Event', 'Annual day celebration');
await sendFeeReminderNotification(userId, 5000, '2024-03-30');
```

### 6. Service Worker (`public/sw.js`)

Enhanced service worker with:

- Push event handling with proper data parsing
- Notification click handling with URL navigation
- Notification close tracking
- Subscription change handling

## Setup Instructions

### 1. Generate VAPID Keys

```bash
npm run generate:vapid-keys
```

This will output your public and private keys.

### 2. Add Keys to Environment

Add to your `.env` file:

```env
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_SUBJECT=mailto:admin@bhutaneduskill.bt
```

For Vercel deployment, add these as environment variables in the dashboard.

### 3. Database Tables

The tables should already exist in your schema. If not, run:

```bash
npm run db:push
```

## Usage Examples

### Sending Notifications from API

```typescript
import { sendPushNotification } from '@/lib/push/push-sender';

// In your API route
export async function POST(req: Request) {
  const { userId } = await requireAuth();

  // Send push notification
  await sendPushNotification({
    userId,
    type: 'homework',
    title: 'New Assignment',
    body: 'Complete Chapter 5 exercises',
    data: { url: '/student/homework' },
  });

  return Response.json({ success: true });
}
```

### Adding Subscribe Button

```tsx
import { PushNotificationToggle } from '@/components/push/push-notification-settings';

function SettingsPage() {
  return (
    <div>
      <h1>Settings</h1>
      <PushNotificationToggle />
    </div>
  );
}
```

### Full Settings Page

```tsx
import { PushNotificationSettings } from '@/components/push/push-notification-settings';

function NotificationSettingsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      <PushNotificationSettings className="max-w-2xl" />
    </div>
  );
}
```

## Notification Types

The system supports the following notification types:

| Type | Description | Default Icon |
|------|-------------|--------------|
| `homework` | Homework assignments | FileText |
| `announcement` | School announcements | Bell |
| `grade` | Grade postings | Award |
| `attendance` | Attendance updates | CheckCircle |
| `reminder` | General reminders | Calendar |
| `alert` | Urgent alerts | AlertTriangle |
| `message` | New messages | MessageSquare |
| `fee` | Fee reminders | CreditCard |
| `timetable` | Schedule changes | BookOpen |
| `exam` | Exam notifications | GraduationCap |

## Quiet Hours

Users can configure quiet hours to suppress non-urgent notifications:

- Time range in HH:MM format
- Can be limited to mobile devices only
- Alert notifications bypass quiet hours (always delivered)

## Browser Support

Push notifications work on:

- Chrome/Edge (Desktop & Android)
- Firefox (Desktop & Android)
- Safari (Desktop & iOS - requires additional setup)
- Opera (Desktop & Android)

## Testing

### Test Push Notifications

1. Subscribe your device using the NotificationBell component
2. Send a test notification:

```typescript
await sendPushNotification({
  userId: 'your-user-id',
  type: 'alert',
  title: 'Test Notification',
  body: 'This is a test push notification',
});
```

### Debug Service Worker

In Chrome DevTools:

1. Open Application > Service Workers
2. Check "Update on reload"
3. Check console for push event logs

## Troubleshooting

### Permission Denied

If users deny permission:

1. Guide them to browser settings
2. They must manually enable in browser preferences

### Subscription Fails

Common causes:

- VAPID keys not configured
- Service worker not registered
- Not using HTTPS (required for push)
- Browser doesn't support push API

### Notifications Not Arriving

Check:

1. Subscription is active in database
2. User has notifications enabled in settings
3. Notification type is not disabled
4. Not in quiet hours
5. Service worker is active

## Security Notes

1. **VAPID keys** - Never expose private key in client code
2. **User authentication** - All API routes use `requireAuth()`
3. **Subscription validation** - Verify userId matches authenticated user
4. **Endpoint uniqueness** - Each subscription has unique endpoint

## Performance Considerations

1. **Bulk sending** - Use `sendBulkPushNotifications` for multiple users
2. **Batching** - Consider batching notifications for efficiency
3. **Retry logic** - Failed sends are tracked with retry count
4. **Cleanup** - Inactive subscriptions are marked, not deleted

## Future Enhancements

- [ ] Scheduled notification queue processor
- [ ] Notification templates
- [ ] A/B testing for notification content
- [ ] Analytics dashboard for notification engagement
- [ ] Web Socket fallback for instant delivery
- [ ] iOS Safari support (requires Apple Push Notification Service)
