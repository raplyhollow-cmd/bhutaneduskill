# Database Query Patterns - MUST FOLLOW

> **LAST UPDATED:** 2026-02-24
> **STATUS:** 🔴 CRITICAL - Read before ANY database work

---

## THE GOLDEN RULE

**NEVER use `db.query.*` API** - It does NOT work with our driver setup.

---

## Why db.query Doesn't Work

Our project uses `drizzle-orm/neon-http` driver with all relations disabled due to circular reference issues.

```typescript
// src/lib/db/index.ts
import { drizzle } from "drizzle-orm/neon-http";  // ← NOT neon-serverless
export const db = drizzle(neonClient, { schema });

// src/lib/db/schema.ts
// All 21 relations are DISABLED (commented out)
// Self-referential relations (users.parentId → users.id) caused crashes
```

---

## Correct Query Patterns

### Pattern 1: Simple SELECT (No Joins)

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ✅ CORRECT
const user = await db
  .select()
  .from(users)
  .where(eq(users.clerkUserId, clerkUserId))
  .limit(1);
```

### Pattern 2: SELECT with LEFT JOIN (One Relation)

```typescript
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ✅ CORRECT - Class with teacher
const classesWithTeacher = await db
  .select({
    id: classes.id,
    name: classes.name,
    grade: classes.grade,
    section: classes.section,
    teacherFirstName: users.firstName,
    teacherLastName: users.lastName,
  })
  .from(classes)
  .leftJoin(users, eq(classes.teacherId, users.id))
  .where(eq(classes.schoolId, schoolId));
```

### Pattern 3: SELECT with MULTIPLE JOINS

```typescript
import { db } from "@/lib/db";
import { homework, classes, subjects, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// ✅ CORRECT - Homework with class, subject, teacher
const homeworkList = await db
  .select({
    id: homework.id,
    title: homework.title,
    className: classes.name,
    subjectName: subjects.name,
    teacherName: users.name,
  })
  .from(homework)
  .leftJoin(classes, eq(homework.classId, classes.id))
  .leftJoin(subjects, eq(homework.subjectId, subjects.id))
  .leftJoin(users, eq(homework.teacherId, users.id))
  .where(eq(homework.schoolId, schoolId));
```

### Pattern 4: INSERT with Returning

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { nanoid } from "nanoid";

// ✅ CORRECT
const userId = `user-${nanoid()}`;
const [newUser] = await db
  .insert(users)
  .values({
    id: userId,
    clerkUserId: user.id,
    type: "student",
    name: `${firstName} ${lastName}`.trim(),
    email,
    createdAt: new Date(),
    updatedAt: new Date(),
  })
  .returning();
```

### Pattern 5: UPDATE

```typescript
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ✅ CORRECT
await db
  .update(users)
  .set({ onboardingStatus: "enrolled" })
  .where(eq(users.clerkUserId, user.id));
```

---

## WRONG Patterns (NEVER DO THESE)

### ❌ db.query.findMany()

```typescript
// WRONG - Causes "referencedTable" error
const classes = await db.query.classes.findMany({
  where: eq(classes.schoolId, schoolId),
  with: { teacher: true },
});
```

### ❌ db.query.findFirst()

```typescript
// WRONG - Same error
const user = await db.query.users.findFirst({
  where: eq(users.id, userId),
});
```

---

## Column Names (CRITICAL)

Always use these exact column names from schema.ts:

| Correct | WRONG | Notes |
|---------|--------|-------|
| `clerkUserId` | `clerkId` | Clerk user lookup field |
| `schoolId` | `school_id` | CamelCase in queries |
| `lastLogin` | `lastLoginAt` | Date field naming |
| `emailVerified` | `isEmailVerified` | Boolean field |
| `onboardingStatus` | `onboarding_status` | Snake_case in DB, camelCase in code |
| `classTeacherId` | `class_teacher_id` | Class teacher reference |
| `homeroomTeacherId` | `homeroom_teacher_id` | Homeroom teacher reference |

---

## JSON Field Handling

Some fields are TEXT but contain JSON - parse before use:

```typescript
import { parseJsonArray } from "@/lib/db/json-helpers";

// Parse JSON array from text field
const subjects = parseJsonArray<string>(user.subjects);
const facilities = parseJsonArray<string>(school.facilities);
```

---

## Working Examples to Copy From

### Get Classes with Teacher
**File:** `src/lib/api/school-admin.ts` line 550+

### Get Subjects List
**File:** `src/lib/api/school-admin.ts` line 648+

### Create Class with Teacher Assignment
**File:** `src/app/school-admin/_actions.ts` line 812+

---

## Quick Verification

After writing database code, verify:

```bash
# Type check
npx tsc --noEmit

# If using VSCode, hover over variables to see types
```

---

**Remember:** When in doubt, find a working example in the codebase and copy the pattern!
