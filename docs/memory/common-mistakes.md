# Common Mistakes - AVOID THESE

> **LAST UPDATED:** 2026-02-24
> **STATUS:** 🔴 CRITICAL - Review before committing code

---

## Database Mistakes

### ❌ db.query.* API

**Wrong:**
```typescript
const classes = await db.query.classes.findMany({
  with: { teacher: true },
});
```

**Why:** Causes `Cannot read properties of undefined (reading 'referencedTable')` error

**Correct:**
```typescript
const classes = await db
  .select({
    id: classes.id,
    name: classes.name,
    teacherFirstName: users.firstName,
  })
  .from(classes)
  .leftJoin(users, eq(classes.teacherId, users.id));
```

---

### ❌ Wrong Field Names

| Wrong | Correct | Why |
|-------|---------|-----|
| `clerkId` | `clerkUserId` | Schema uses clerkUserId |
| `school_id` | `schoolId` | Drizzle uses camelCase |
| `lastLoginAt` | `lastLogin` | Schema uses lastLogin |
| `isEmailVerified` | `emailVerified` | Schema uses emailVerified |

---

### ❌ Using relations in schema.ts

**Wrong:**
```typescript
export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, {  // Self-referential - causes crash!
    fields: [users.parentId],
    references: [users.id],
  }),
}));
```

**Why:** All relations are disabled due to circular references

**Correct:** Use explicit joins in queries instead

---

## React Mistakes

### ❌ Hooks After Conditionals

**Wrong:**
```tsx
function Component() {
  if (condition) return null;
  const [state] = useState();  // CRASH!
  return <div />;
}
```

**Why:** React expects same number of hooks on every render

**Correct:**
```tsx
function Component() {
  const [state] = useState();
  if (condition) return <div />;
  return <div />;
}
```

---

### ❌ repeat: Infinity Without repeatType

**Wrong:**
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{ repeat: Infinity, duration: 2 }}
/>
```

**Why:** Causes `iterationCount must be non-negative` error

**Correct:**
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    repeat: Infinity,
    repeatType: "loop",  // REQUIRED!
    duration: 2
  }}
/>
```

---

## TypeScript Mistakes

### ❌ Adding New `any` Types

**Wrong:**
```typescript
function processData(data: any): any {
  return data.map((item: any) => item.name);
}
```

**Why:** 300+ existing `any` types already cause issues

**Correct:**
```typescript
interface DataItem { name: string; id: string; }
function processData(data: DataItem[]): DataItem[] {
  return data;
}
```

---

### ❌ Array Index Without Type Guard

**Wrong:**
```typescript
const user = users[0];  // implicitly 'any'
```

**Correct:**
```typescript
const user = users.at(0);
// OR
const user = users[0] as User | undefined;
// OR
if (users.length > 0) {
  const user = users[0];  // Safe
}
```

---

## Authentication Mistakes

### ❌ Using auth() Instead of requireAuth()

**Wrong:**
```typescript
import { auth } from "@clerk/nextjs/server";
const { userId } = await auth();
```

**Why:** Returns Clerk userId, but code expects database userId

**Correct:**
```typescript
import { requireAuth } from "@/lib/auth-utils";
const { userId } = await requireAuth();  // Returns database ID
```

---

## Import Path Mistakes

### ❌ Relative Imports

**Wrong:**
```typescript
import { Button } from "../../components/ui/button";
import { logger } from "../../../lib/logger";
```

**Why:** Breaks when files move, harder to read

**Correct:**
```typescript
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
```

---

## API Response Mistakes

### ❌ Not Using Standard Response Format

**Wrong:**
```typescript
return Response.json(data);
```

**Correct:**
```typescript
import type { ApiSuccess } from "@/types";
return Response.json({ success: true, data } satisfies ApiSuccess);
```

---

## Styling Mistakes

### ❌ Tailwind Gradient Classes

**Wrong:**
```tsx
<div className="from-orange-500 to-orange-600">
```

**Why:** Causes build errors, doesn't exist in Tailwind

**Correct:**
```tsx
<div style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}>
```

---

## Console Statement Mistakes

### ❌ Using console.log

**Wrong:**
```typescript
console.log("Data:", data);
console.error("Error:", error);
```

**Correct:**
```typescript
import { logger } from "@/lib/logger";
logger.info("Data loaded", { data });
logger.error(error);
```

---

## Server Action Mistakes

### ❌ Not Validating Input

**Wrong:**
```typescript
export async function createClass(data: any) {
  await db.insert(classes).values(data);  // No validation!
}
```

**Correct:**
```typescript
export async function createClass(data: ClassFormData) {
  if (!data.name || !data.grade) {
    return { success: false, error: "Missing required fields" };
  }
  // ... rest of logic
}
```

---

## For Missing Fields

### ❌ Assuming Field Exists

**Before adding a field, ALWAYS verify:**

```bash
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);
sql\`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'table_name'
  ORDER BY column_name
\`.then(console.log);
"
```

---

## Summary of Quick Fixes

| Error Type | Quick Fix |
|-------------|------------|
| referencedTable error | Use `db.select().from().leftJoin()` instead of `db.query.*` |
| Hooks crash | Move all hooks to top of component |
| Animation error | Add `repeatType: "loop"` to `repeat: Infinity` |
| Type errors | Add proper types, avoid `any` |
| Auth failures | Use `requireAuth()` instead of `auth()` |
| Import breaks | Use `@/` alias instead of relative paths |
| Build errors | Check field names against schema.ts |

---

**Remember:** When in doubt, find a working example in the codebase and copy the pattern!
