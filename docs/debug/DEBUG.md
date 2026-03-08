# Debug Documentation

**Last Updated:** March 8, 2026
**Purpose:** Central reference for debugging common issues in the Bhutan EduSkill project

---

## Quick Reference - Common Issues

### 0. React Rendering - "Cannot read properties of undefined" (NEW)

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot read properties of undefined (reading '0')` | Accessing array index on undefined/null string | Normalize at API boundary: `field || ""` |
| `Objects are not valid as a React child` | Rendering object values directly | Check schema - JSON fields can be objects |
| `TypeError: name is undefined` | Conditional name generation missing all branches | Add explicit fallback to default string |

**Pattern - Null-Safe Name Display:**
```typescript
// API - Normalize to empty strings (NEVER return null)
const teachersList = teacherUsers.map((teacherUser: any) => ({
  id: teacherUser.id,
  firstName: teacherUser.firstName || "",  // ✅ Always string
  lastName: teacherUser.lastName || "",
  email: teacherUser.email || "",
}));

// Frontend - Defensive name generation
const firstName = teacher.firstName || "";
const lastName = teacher.lastName || "";
const email = teacher.email || "";

let name = "Unknown";  // ✅ Always has a value
if (firstName && lastName) {
  name = `${firstName} ${lastName}`;
} else if (firstName) {
  name = firstName;
} else if (lastName) {
  name = lastName;
} else if (email) {
  name = email;
}
// Now name[0] is safe: {name[0] || "?"}
```

**Key Lesson**: When database fields are `string | null`, normalize at API boundary to empty strings before sending to frontend

---

### 1. TypeScript Errors

### 1. TypeScript Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Object literal may only specify known properties, 'success' does not exist` | Wrong `ApiErrorResponse` type format | Use `{ error, status }` not `{ success: false, error }` |
| `Generic type 'ApiSuccess<T>' requires 1 type argument(s)` | Missing generic type | Add type: `satisfies ApiSuccess<DataType>` |
| `Cannot find name 'sql'` | Missing drizzle import | Add `sql` to imports: `import { eq, and, sql } from "drizzle-orm"` |
| `iterationCount must be non-negative` | Framer Motion missing repeatType | Always add `repeatType: "loop"` to infinite animations |

### 2. Database Query Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `db.query.* is not a function` | Using disabled query API with neon-http | Use `db.select().from().where()` pattern instead |
| `Property 'clerkId' does not exist` | Wrong field name | Use `clerkUserId` not `clerkId` |
| `Property 'school_id' does not exist` | Drizzle uses camelCase | Use `schoolId` not `school_id` |
| `relation * is disabled` | Relations disabled in neon-http | Use explicit joins with `.innerJoin()` |

### 3. Authentication Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| "User not found" in setup | API doesn't create user if not exists | Ensure setup API checks for user and creates if missing |
| Redirected to setup despite being admin | 3-file bypass pattern incomplete | Check set-role API, admin layout, and dashboard |
| `requireAuth returns error` | Wrong role or not authenticated | Check user type matches required roles array |

### 4. Build Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Build out of memory | Large project exceeds default memory | Set `NODE_OPTIONS="--max-old-space-size=16384"` |
| Tailwind gradient errors | Using Tailwind classes for gradients | Use inline styles: `style={{ background: 'linear-gradient(...)' }}` |
| Port already in use | Previous dev server running | Kill process on port 3003 |

---

## File-Specific Debugging

### API Route Response Format

**Correct Pattern:**
```typescript
// Success response
return NextResponse.json({
  data: { ... }
} satisfies ApiSuccess<DataType>);

// Error response
return NextResponse.json(
  { error: "Message", status: 400 } satisfies ApiErrorResponse,
  { status: 400 }
);
```

**Incorrect Pattern (causes errors):**
```typescript
// DON'T DO THIS
return NextResponse.json({
  success: false,  // ❌ ApiErrorResponse doesn't have 'success'
  error: "Message"
});
```

### Database Query Pattern

**Correct Pattern (neon-http):**
```typescript
import { db } from "@/lib/db";
import { users, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

const result = await db
  .select()
  .from(users)
  .where(eq(users.id, userId));
```

**Incorrect Pattern (doesn't work):**
```typescript
// DON'T DO THIS - query API is disabled
const result = await db.query.users.findFirst({
  where: eq(users.id, userId)
});
```

### Framer Motion Animation

**Correct Pattern:**
```tsx
<motion.div
  animate={{ opacity: [0, 1, 0] }}
  transition={{
    repeat: Infinity,
    repeatType: "loop",  // ✅ REQUIRED for infinite animations
    duration: 2
  }}
/>
```

**Incorrect Pattern:**
```tsx
// DON'T DO THIS - causes error
transition={{ repeat: Infinity, duration: 2 }}  // ❌ Missing repeatType
```

---

## API Endpoint Debugging

### Test an API Route

```bash
# Test authentication
curl -X GET http://localhost:3003/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN"

# Test POST with data
curl -X POST http://localhost:3003/api/school-admin/subjects/abc123/teachers \
  -H "Content-Type: application/json" \
  -d '{"teacherId": "teacher-123", "role": "subject_expert"}'
```

### Check Database Connection

```bash
# Run database connection test
node scripts/check-db-connection.js
```

### Verify Schema

```bash
# Check schema matches database
npm run db:push
```

---

## Portal-Specific Debugging

### Platform Admin Bypass Not Working

**Files to Check:**
1. `src/app/api/auth/set-role/route.ts` - Must return `needsSetup: false` for admins
2. `src/app/admin/layout.tsx` - Must skip setup redirect for admins
3. `src/app/dashboard/page.tsx` - Must redirect admins to `/admin`

### School Admin Can't See Features

**Common Causes:**
- `schoolId` not set on user record
- User type is not `school-admin`
- Feature requires specific permissions

### Teacher Shows "No Classes Assigned"

**Checks:**
1. User has been approved (not pending)
2. Teacher has assignments in `teacher_assignments` table
3. Class belongs to teacher's school
4. Academic year matches

---

## Performance Debugging

### Slow Page Loads

**Check:**
1. Database query N+1 problems
2. Missing indexes on frequently queried fields
3. Large component re-renders
4. Client-side vs server-side data fetching

### Memory Leaks

**Common Causes:**
1. Event listeners not cleaned up
2. Timers/intervals not cleared
3. Large data stored in component state
4. Growing arrays without limits

---

## Environment Variables

### Required Variables

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Database (Neon PostgreSQL)
DATABASE_URL=

# Application
NEXT_PUBLIC_APP_URL=
```

---

## Logging

### View Logs

```bash
# Check production logs
tail -f logs/app.log

# Check error logs
tail -f logs/error.log
```

### Enable Debug Logging

```typescript
import { logger } from "@/lib/logger";

logger.debug("Debug info", { key: "value" });
logger.info("Info message");
logger.warn("Warning message");
logger.error("Error message", { error });
```

---

## Recovery Procedures

### Reset Database

```bash
# Push schema to database
npm run db:push

# Or use Drizzle Studio
npm run db:studio
```

### Clear Next.js Cache

```bash
# Remove .next directory
rm -rf .next

# Rebuild
npm run build
```

### Fix Corrupted Build

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

---

## Contact for Debug Help

1. Check `docs/ERRORS_AND_FIXES.md` for documented fixes
2. Review `docs/DEVELOPMENT_FRAMEWORK.md` for coding patterns
3. Check `MEMORY.md` for project-specific rules
4. Review recent `CHANGELOG.md` entries for breaking changes
