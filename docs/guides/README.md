# Development Guides

How-to guides for common development tasks.

## Guides

| Guide | Description |
|-------|-------------|
| [Setup](../CLERK_SETUP.md) | Clerk authentication and environment setup |
| [Authentication](../archive/auth-flow.md) | Authentication patterns and RBAC implementation |
| [API Development](../archive/api-routes.md) | Creating API routes with proper patterns |
| [Deployment](deployment.md) | Deployment procedures and production setup |

## Quick Patterns

### API Route Template
```typescript
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

export async function GET(req: Request) {
  try {
    const { userId, user } = await requireAuth(['admin']);
    // Business logic
    return Response.json({ success: true, data } satisfies ApiSuccess);
  } catch (error) {
    logger.apiError(error, { route: "/api/endpoint", method: "GET" });
    return Response.json(
      { success: false, error: "Message" } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
```

### requireAuth Pattern
```typescript
// Basic auth
const { userId, user } = await requireAuth();

// With role check
const { userId, user } = await requireAuth(['admin', 'school-admin']);
```

### Import Pattern
```typescript
// ALWAYS use @/ alias
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth-utils";

// NEVER use relative paths
// import { Button } from "../../components/ui/button"; // DON'T DO THIS
```

For comprehensive rules, see the [Development Framework](../DEVELOPMENT_FRAMEWORK.md).
