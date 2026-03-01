# Database Schema Sync Issues - Lessons Learned

> **Context:** This document captures the root causes and solutions for database schema synchronization issues encountered during the Bhutan EduSkill project development.

## Problem Summary

We encountered multiple errors when running `npm run db:push`:

1. **JSON Type Casting Errors**: `column "X" cannot be cast automatically to type json`
2. **Foreign Key Violations**: `insert or update on table violates foreign key constraint`
3. **Empty Array Values**: Foreign key columns containing `[]` instead of valid IDs or NULL

---

## Root Cause Analysis

### Problem 1: JSON Type Mismatch

**What happened:**
- Database columns were created as `TEXT` type
- Schema (`schema.ts`) defined them as `JSON` type
- PostgreSQL couldn't auto-convert `TEXT → JSON` without explicit USING clause

**Why it happened:**
1. Database was created before JSON types were properly defined in schema
2. Bad migration created columns as TEXT instead of JSON
3. Manual SQL table creation didn't follow schema definitions

**Example:**
```sql
-- ❌ WRONG - Column created as TEXT
CREATE TABLE assessments (
  recommendations text  -- This causes the problem!
);

-- ✅ CORRECT - Create with JSON from the start
CREATE TABLE assessments (
  recommendations json DEFAULT '[]'::json
);
```

### Problem 2: Orphaned Foreign Keys

**What happened:**
- Child table rows referenced non-existent parent table IDs
- Example: `notification_deliveries` pointing to deleted notifications

**Why it happened:**
1. Deleting parent records without CASCADE delete
2. App code inserting invalid reference IDs
3. Manual data imports without referential integrity checks

### Problem 3: Empty Array as Foreign Key

**What happened:**
- Foreign key columns contained `[]` (empty JSON array) instead of `null` or valid ID
- Example: `role_permissions.permission_id = []`

**Why it happened:**
- App code used `[]` as default instead of `null`
- Missing validation before database inserts

---

## Solutions Applied

### Solution 1: Convert TEXT to JSON Columns

```sql
-- Single column fix
ALTER TABLE "table_name"
ALTER COLUMN "column_name"
SET DATA TYPE json
USING COALESCE("column_name"::json, '[]'::json);
```

### Solution 2: Clean Orphaned Foreign Keys

```sql
-- Delete orphaned rows
DELETE FROM "child_table"
WHERE "foreign_key_col" NOT IN (SELECT "id" FROM "parent_table");
```

### Solution 3: Fix Empty Array Values

```sql
-- Fix FK columns with [] values
DELETE FROM "table_name"
WHERE "fk_column"::text = '[]'
   OR "fk_column" NOT IN (SELECT "id" FROM "referenced_table");
```

---

## Prevention for Future SaaS Projects

### 1. Use Migrations Instead of Push (Production)

```bash
# ❌ AVOID in production
npm run db:push  # Direct changes, no rollback, no history

# ✅ USE in production
npm run db:generate  # Creates migration SQL file
npm run db:migrate    # Applies migration with rollback support
```

**Why:** Migrations provide:
- Version control for schema changes
- Rollback capability
- Team collaboration
- Production safety

### 2. Define Schema Correctly From Day 1

```typescript
// ✅ CORRECT - Full type definition with defaults
export const assessments = pgTable("assessments", {
  id: text("id").primaryKey(),
  recommendations: json("recommendations")
    .$type<string[]>()
    .notNull()
    .default('[]'),  // Default as JSON array
  completedAt: timestamp("completed_at").notNull(),
});

// ❌ WRONG - No default, nullable when it shouldn't be
recommendations: json("recommendations").$type<string[]>(),
```

### 3. Use Foreign Key Actions

```typescript
// ✅ Add onDelete behavior in schema
export const notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id, {
    onDelete: "cascade"  // Auto-delete child records
  }),
});

// Options: "cascade" | "set null" | "restrict" | "no action"
```

### 4. Validate Data Before Insert

```typescript
// ✅ Always validate foreign keys exist before insert
async function createNotificationDelivery(notificationId: string, userId: string) {
  // Check notification exists
  const [notification] = await db
    .select()
    .from(notifications)
    .where(eq(notifications.id, notificationId));

  if (!notification) {
    throw new Error(`Notification ${notificationId} does not exist`);
  }

  // Check user exists
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));

  if (!user) {
    throw new Error(`User ${userId} does not exist`);
  }

  // Now safe to insert
  return db.insert(notificationDeliveries).values({ notificationId, userId });
}
```

### 5. Use NULL for Empty Foreign Keys

```typescript
// ✅ CORRECT - Use null for empty foreign keys
const data = {
  permissionId: permission || null,  // ✅
  reviewedBy: reviewerId || null,     // ✅
};

// ❌ WRONG - Never use [] for foreign keys
const data = {
  permissionId: permission || [],     // ❌ Causes FK violations
  reviewedBy: reviewerId || [],       // ❌ Causes FK violations
};
```

### 6. Database Reset Script (Development Only)

Keep this for clean slate in dev:

```sql
-- Complete database reset
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;

-- Then run: npm run db:push
```

---

## Quick Reference Troubleshooting

### Error: "column X cannot be cast automatically to type json"

**Cause:** Column is TEXT in DB, JSON in schema

**Fix:**
```sql
ALTER TABLE "table" ALTER COLUMN "col" SET DATA TYPE json USING COALESCE("col"::json, '[]'::json);
```

### Error: "violates foreign key constraint"

**Cause:** Child row references non-existent parent ID

**Fix:**
```sql
DELETE FROM "child" WHERE "fk_col" NOT IN (SELECT "id" FROM "parent");
```

### Error: "Key (fk_col)=([]) is not present in table"

**Cause:** Empty array `[]` used as foreign key value

**Fix:**
```sql
DELETE FROM "table" WHERE "fk_col"::text = '[]';
-- Then fix app code to use NULL instead of []
```

---

## Best Practices Checklist

- [ ] Always define JSON columns with proper defaults: `.default('[]')`
- [ ] Use `db:generate` + `db:migrate` instead of `db:push` in production
- [ ] Add `onDelete: "cascade"` to foreign keys where appropriate
- [ ] Validate foreign key existence before inserts
- [ ] Use `null` not `[]` for empty foreign key values
- [ ] Run `npx tsc --noEmit` after schema changes
- [ ] Test migrations on staging before production

---

## Related Files

- Database schema: `src/lib/db/schema.ts`
- Migration folder: `drizzle/`
- Drizzle config: `drizzle.config.ts`

---

**Last Updated:** March 2026
**Project:** Bhutan EduSkill
