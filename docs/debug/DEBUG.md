# Debug Notes

## "referencedTable" Error - Self-Referential Relations (Feb 23, 2026)

### Issue: `Cannot read properties of undefined (reading 'referencedTable')`

**Root Cause:** Drizzle ORM's `relations()` API with self-referential foreign keys causes circular reference issues when the schema is loaded. The `users` table has `parentId` which references `users.id`, and the `usersRelations` defined a `parent: one(users)` relation, creating a circular dependency that Drizzle cannot resolve.

**Fix:** Removed the self-referential `parent` relation from `usersRelations` in `src/lib/db/schema.ts`:

```typescript
// BEFORE (BROKEN):
export const usersRelations = relations(users, ({ one, many }) => ({
  parent: one(users, {  // ❌ Self-referential - causes referencedTable error
    fields: [users.parentId],
    references: [users.id],
  }),
  // ...
}));

// AFTER (FIXED):
export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, { ... }),
  // parent relation removed - use explicit joins instead
  // ...
}));
```

---

## Subjects Management CRUD Implementation (Feb 23, 2026)

### Status: ✅ FULLY IMPLEMENTED

School Admin can now create, read, update, and delete subjects via the UI.

**Files Created/Modified:**

1. **Server Actions** (`src/app/school-admin/_actions.ts`)
   - `createSubject(data)` - Create new subject
   - `updateSubject(id, data)` - Update existing subject
   - `deleteSubject(id)` - Soft delete (sets isActive: false)
   - `fetchSubjectById(id)` - Get single subject

2. **UI Page** (`src/app/school-admin/subjects/page.tsx`)
   - Converted to client component with full state management
   - Grid view of all subjects with stats cards
   - Add Subject modal with form validation
   - Edit Subject modal (inline update)
   - Delete confirmation dialog
   - Search/filter functionality

**Subject Form Fields:**
- Name (required)
- Code (required, auto-converted to uppercase)
- Type: Core | Elective | Optional
- Grade Level: 6-12
- Description (optional)

**Navigation:**
- Menu item already exists: `/school-admin/subjects`

---

## Teacher Approval Flow Status (Feb 23, 2026)

### Status: ✅ FULLY IMPLEMENTED AND WORKING

The teacher approval flow is complete and working. All components have been built:

1. **Teacher Signup API** (`src/app/api/setup/teacher/route.ts`)
   - Creates user with `type: "teacher"`
   - Links to school via school code verification
   - Creates `teacher_applications` entry with status="pending"
   - Sends notification to school admins
   - Sets `onboardingStatus: "pending_enrollment"`

2. **Pending Teachers API** (`src/app/api/school-admin/teachers/pending/route.ts`)
   - GET: Fetches all pending teacher applications
   - POST: Approves (status → "approved", onboarding → "enrolled")
   - POST: Rejects (status → "rejected", onboarding → "pending_approval")

3. **Pending Teachers UI** (`src/app/school-admin/teachers/pending/page.tsx`)
   - Lists pending applications with teacher details
   - Approve/Reject buttons with confirmation
   - Real-time updates after actions
   - Empty state handling

4. **Navigation** (`src/config/portal-config.ts`)
   - "Pending Teachers" menu item added
   - Icon: UserCheck
   - Href: /school-admin/teachers/pending

### Current Database State:
- Teacher Applications: 0 (all processed)
- Teacher Users: 1 (booksilverpine@gmail.com - status: enrolled)

The flow works - new teacher signups will go through the proper approval process.

---

## School-Admin Classes Page Issues (Feb 23, 2026)

### Issue 1: "Cannot read properties of undefined (reading 'referencedTable')"

**Error Location:** `src/lib/api/school-admin.ts:552`

**Root Cause:** Using `db.query.classes.findMany({ with: { teacher: true } })` which requires Drizzle ORM relation definitions that weren't properly set up in the schema.

**Fix:** Changed from `db.query` syntax to standard `db.select().from().leftJoin()` pattern:

```typescript
// BEFORE (BROKEN):
const classesList = await db.query.classes.findMany({
  where: and(...conditions),
  with: { teacher: true },
  limit,
  offset,
  orderBy: [desc(classes.createdAt)],
});

// AFTER (FIXED):
const classesList = await db
  .select({
    id: classes.id,
    name: classes.name,
    grade: classes.grade,
    section: classes.section,
    teacherId: classes.teacherId,
    // ... other fields
    teacherFirstName: users.firstName,
    teacherLastName: users.lastName,
  })
  .from(classes)
  .leftJoin(users, eq(classes.teacherId, users.id))
  .where(and(...conditions))
  .orderBy(desc(classes.createdAt))
  .limit(limit)
  .offset(offset);
```

---

### Issue 2: Column "students" does not exist

**Error:** `Failed query: insert into "classes" (...) values (..., $14, ...)`
**Error Message:** Column "students" doesn't exist in the database

**Root Cause:** The Drizzle schema defined a `students` column (json type) that doesn't exist in the actual database table.

**Database Check:**
```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'classes'
ORDER BY ordinal_position;

-- Result: NO 'students' column in database
```

**Fixes Applied:**

1. **Removed from schema** (`src/lib/db/schema.ts`):
   - Removed `students: json("students").$type<Array<{...}>>()` line

2. **Removed from INSERT** (`src/app/school-admin/_actions.ts`):
   - Removed `students: []` from `createClass` function

3. **Removed from SELECT** (`src/lib/api/school-admin.ts`):
   - Removed `students: classes.students` from select query
   - Changed enrollment count to use `enrollments` table instead

4. **Fixed homework list query** (`src/lib/api/school-admin.ts`):
   - Changed from `parseJsonArray(classRelation.students).length` to enrollment count from `enrollments` table

---

### Issue 3: Multiple `db.query.*` calls causing potential errors

**Locations:** Multiple files in `src/lib/api/school-admin.ts`

**Root Cause:** `db.query.*` syntax requires proper relation definitions in Drizzle schema. When relations aren't properly defined, it causes "referencedTable" errors.

**Fix:** Converted all `db.query.*` calls to standard `db.select().from().leftJoin()` pattern:

| Before | After |
|--------|-------|
| `db.query.classes.findMany()` | `db.select().from(classes).leftJoin(users, ...)` |
| `db.query.homework.findMany({ with: { class, subject } })` | `db.select({...}).from(homework).leftJoin(classes, ...).leftJoin(subjects, ...)` |

---

## Summary of Changes

### Files Modified:

1. **`src/lib/db/schema.ts`**
   - Removed `students` column from `classes` table definition

2. **`src/lib/api/school-admin.ts`**
   - Changed `getClasses()` to use `leftJoin` instead of `db.query`
   - Changed `getHomeworkList()` to use `leftJoin` instead of `db.query`
   - Fixed enrollment count to use `enrollments` table

3. **`src/app/school-admin/_actions.ts`**
   - Removed `students: []` from `createClass()` INSERT query

---

## Lessons Learned

1. **Always verify database schema matches Drizzle schema**
   - Use `SELECT * FROM information_schema.columns WHERE table_name = 'xyz'` to check actual DB columns

2. **Avoid `db.query.*` for complex queries**
   - Use standard `db.select().from().leftJoin()` for more control
   - Only use `db.query.*` for simple queries without relations

3. **Use `enrollments` table for student counts**
   - The `classes.students` JSON field doesn't exist in DB
   - Always count from `enrollments` table with `status = 'active'`

---

## Related Commands

```bash
# Check database table columns
node -e "
const { neon } = require('@neondatabase/serverless');
require('dotenv').config({ path: '.env' });
const sql = neon(process.env.DATABASE_URL);
sql\`
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'classes'
  ORDER BY ordinal_position
\`.then(console.log).catch(console.error);
"

# Push schema changes (use with caution)
npx drizzle-kit push

# Type check
npx tsc --noEmit
```

---

## Teacher Dashboard "homework homework" SQL Error (Feb 24, 2026)

### Issue: Failed query with duplicated table name `"homework" "homework"`

**Error Message:**
```
[BhutanEduSkill] [ERROR] "Failed query: select ... from "homework" "homework" where ..."
```

**Root Cause:** `src/app/teacher/dashboard/_actions.ts` used `db.query.*` API which is **NOT SUPPORTED** by the `neon-http` driver. The `neon-http` driver (used in this project) doesn't support Drizzle's query API - it generates malformed SQL with duplicated table names.

**Affected Files:**
1. `src/app/teacher/dashboard/_actions.ts` - Server actions for teacher dashboard
2. `src/app/api/classes/route.ts` - Classes API endpoint
3. `src/app/api/teacher/students/route.ts` - Teacher students endpoint

### The Fix Pattern

**FORBIDDEN** (causes errors with neon-http):
```typescript
// ❌ DON'T USE - neon-http doesn't support query API
const data = await db.query.classes.findMany({
  where: eq(classes.teacherId, userId),
  with: { teacher: true },
});
```

**CORRECT** (works with neon-http):
```typescript
// ✅ USE THIS PATTERN
const data = await db
  .select()
  .from(classes)
  .where(eq(classes.teacherId, userId));
```

### Complete Conversion Table

| Forbidden (db.query) | Correct (db.select) |
|---------------------|---------------------|
| `db.query.classes.findMany()` | `db.select().from(classes).where()` |
| `db.query.users.findFirst()` | `db.select().from(users).where().limit(1)` |
| `db.query.enrollments.findMany()` | `db.select().from(enrollments).where()` |
| `db.query.attendance.findMany()` | `db.select().from(attendance).where()` |
| `db.query.homework.findMany()` | `db.select().from(homework).where()` |
| `db.query.homeworkSubmissions.findMany()` | `db.select().from(homeworkSubmissions).where()` |
| `db.query.teacherBehaviorLogs.findMany()` | `db.select().from(teacherBehaviorLogs).where()` |

### Key Changes in _actions.ts

**Before (lines 93-96):**
```typescript
const teacherClasses = await db.query.classes.findMany({
  where: eq(classes.teacherId, user.id),
  orderBy: [desc(classes.createdAt)],
});
```

**After:**
```typescript
const teacherClasses = await db
  .select()
  .from(classes)
  .where(eq(classes.teacherId, userId))
  .orderBy(desc(classes.createdAt));
```

**Before (lines 181-184) - findFirst pattern:**
```typescript
const student = await db.query.users.findFirst({
  where: eq(users.id, submission.studentId),
  columns: { id: true, firstName: true, lastName: true },
});
```

**After:**
```typescript
const studentData = await db
  .select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
  })
  .from(users)
  .where(eq(users.id, submission.studentId))
  .limit(1);

if (studentData.length > 0) {
  const student = studentData[0];
  // use student
}
```

### Related Files Already Fixed (Feb 24, 2026)
- `/api/classes/route.ts` - Converted to db.select()
- `/api/teacher/students/route.ts` - Converted to db.select()
- `/api/teacher/dashboard/route.ts` - Already using db.select()

### Why This Happens

The `neon-http` driver uses HTTP requests to PostgreSQL instead of a native connection. It's designed for serverless environments but has limitations:
- **No `db.query` API support** - Must use `db.select().from()`
- **No relation loading** - Must manually join or fetch related data
- **No transaction support** - Must use single queries

### Reference
- See QUICKREF.md line 24-28 for the primary rule
- See CLAUDE.md "CRITICAL: Database Query Rules" section
