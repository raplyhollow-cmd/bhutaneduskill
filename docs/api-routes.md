# API Routes Documentation

## Overview

This project uses Next.js App Router API routes for backend endpoints. See [Advanced API Techniques](#advanced-api-techniques) for best practices.

---

## Authentication (Clerk)

```
/sign-in                 # Clerk sign-in page
/sign-up                 # Clerk sign-up page
/sign-out                # Clerk sign-out page
```

---

## User Management

```
/api/user/profile        # Get/update user profile
```

---

## Assessments

```
/api/assessments         # Assessment CRUD
/api/assessments/start   # Start new assessment
/api/saved-careers       # Saved career interests
```

---

## Data Export

```
/api/data-export         # Export student data (counselor)
```

---

## Transport

```
/api/transport/tracking/[vehicleId]  # Vehicle tracking
```

---

## Inventory

```
/api/inventory/items     # Inventory management
```

---

## Hostel

```
/api/hostel/allocations  # Hostel room allocations
```

---

## Timetable

```
/api/timetable/generate  # Generate timetables
```

---

## Advanced API Techniques

### 1. Middleware Pattern (Auth Wrapping)

```tsx
// src/lib/api/middleware.ts
export function withAuth(handler: (req: NextRequest, session: any) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const session = await getAuth(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return handler(req, session)
  }
}

// Usage in route.ts
export const GET = withAuth(async (req, session) => {
  return NextResponse.json({ data: 'protected' })
})
```

### 2. Server Actions (Next.js 13+) - Preferred for Forms

```tsx
// app/actions.ts (Server Action)
'use server'

import { db } from '@/lib/db'

export async function createHomework(data: HomeworkData) {
  const homework = await db.homework.create({ data })
  return homework
}

// Usage in component
export default function CreateHomeworkPage() {
  async function handleSubmit(formData: FormData) {
    'use server'
    await createHomework({ title: formData.get('title') })
  }
  return <form action={handleSubmit}>...</form>
}
```

**Benefits:** No manual fetch(), automatic form handling, type-safe, less code

### 3. Zod Validation

```tsx
import { z } from 'zod'

const CreateHomeworkSchema = z.object({
  title: z.string().min(1).max(100),
  dueDate: z.date(),
  points: z.number().min(0).max(100),
})

export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = CreateHomeworkSchema.parse(body)  // Throws if invalid
  // ... proceed with validated data
}
```

### 4. Error Handling Wrapper

```tsx
// src/lib/api/response.ts
export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<NextResponse> {
  return handler()
    .then(data => NextResponse.json({ success: true, data }))
    .catch(error => {
      console.error(error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.status || 500 }
      )
    })
}

// Usage
export const GET = () => withErrorHandler(async () => {
  return await db.homework.findMany()
})
```

### 5. Route Config Options

```tsx
export const dynamic = 'force-dynamic'        // Always dynamic (no caching)
export const revalidate = 60                  // Revalidate every 60s
export const runtime = 'edge'                 // Run on Edge (faster, limited)
export const fetchCache = 'force-cache'       // Cache responses
```

### 6. Streaming Responses

```tsx
export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of fetchData()) {
        controller.enqueue(encoder.encode(JSON.stringify(chunk)))
      }
      controller.close()
    }
  })
  return new NextResponse(stream, {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

---

## Best Practices for This Project

- Use **Server Actions** for forms (homework, attendance, profile updates)
- Keep **API routes** for external integrations (webhooks, third-party APIs)
- Add **Zod validation** to all user inputs
- Create **middleware wrapper** for protected routes
