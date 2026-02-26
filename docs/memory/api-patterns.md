# API Route Patterns - Standard Templates

> **LAST UPDATED:** 2026-02-24
> **STATUS:** 🔴 CRITICAL - Use for ALL new API routes

---

## Standard API Route Template

```typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    // 1. Authenticate (optionally with role requirement)
    const { userId, user } = await requireAuth(['admin']); // Add allowed roles as needed

    // 2. Business logic
    const data = await someOperation();

    // 3. Log success
    logger.info("Route executed", { route: "/api/endpoint", userId });

    // 4. Return response
    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    // 5. Log error with context
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });

    // 6. Return error response
    return Response.json(
      { success: false, error: "Error message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
```

---

## Authentication Patterns

### Pattern 1: No Role Check (Any Authenticated User)

```typescript
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { userId, user } = await requireAuth();
  // userId is DATABASE ID, user is full user object
  // ... rest of logic
}
```

### Pattern 2: With Role Check

```typescript
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const { userId, user } = await requireAuth(['admin', 'school-admin']);
  // Only users with these roles can access
  // ... rest of logic
}
```

### Pattern 3: Error Response from requireAuth

```typescript
import { requireAuth } from "@/lib/auth-utils";

export async function GET(req: Request) {
  const authResult = await requireAuth(['teacher']);

  if ('error' in authResult) {
    return Response.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  const { userId, user } = authResult;
  // ... rest of logic
}
```

---

## POST Request Pattern (Creating Data)

```typescript
export async function POST(req: Request) {
  try {
    const { userId, user } = await requireAuth(['school-admin']);

    // Parse request body
    const body = await req.json();
    const { name, grade, section, teacherId } = body;

    // Validate
    if (!name || !grade) {
      return Response.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Perform operation
    const result = await createClass({ name, grade, section, teacherId });

    logger.info("Class created", { classId: result.class.id, userId });

    return Response.json({ success: true, data: result.class });
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "POST" });
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
```

---

## PUT/PATCH Pattern (Updating Data)

```typescript
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId, user } = await requireAuth(['admin']);
    const id = (await params).id;

    const body = await req.json();
    const { name, grade, section } = body;

    // Update logic
    const result = await updateClass(id, { name, grade, section });

    logger.info("Class updated", { classId: id, userId });

    return Response.json({ success: true, data: result });
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "PATCH" });
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
```

---

## DELETE Pattern

```typescript
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await requireAuth(['admin']);
    const id = (await params).id;

    // Delete logic
    await deleteClass(id);

    logger.info("Class deleted", { classId: id, userId });

    return Response.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "DELETE" });
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
```

---

## Response Types

Use these types for consistent responses:

```typescript
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// Success response
Response.json({ success: true, data: someObject })

// Error response
Response.json({ success: false, error: "Something went wrong" }, { status: 400 })
```

---

## Working Examples

### Teacher Approval API
**File:** `src/app/api/school-admin/teachers/pending/route.ts`

### Class Creation API
**File:** `src/app/api/school-admin/classes/route.ts`

### User Profile API
**File:** `src/app/api/user/profile/route.ts`

---

## Common Mistakes to Avoid

❌ **WRONG:** Using `auth()` directly
```typescript
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();  // Returns Clerk ID, not DB ID
```

✅ **CORRECT:** Using `requireAuth()`
```typescript
import { requireAuth } from "@/lib/auth-utils";
const { userId } = await requireAuth();  // Returns database ID
```

❌ **WRONG:** No error handling
```typescript
export async function GET(req: Request) {
  const data = await db.select().from(users);  // Can throw
  return Response.json(data);
}
```

✅ **CORRECT:** Always use try-catch with logging
```typescript
export async function GET(req: Request) {
  try {
    const data = await db.select().from(users);
    return Response.json({ success: true, data });
  } catch (error) {
    logger.apiError(error);
    return Response.json({ success: false, error: "Failed" }, { status: 500 });
  }
}
```
