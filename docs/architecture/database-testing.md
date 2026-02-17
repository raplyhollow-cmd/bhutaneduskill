# Database Testing Guide

## Overview

This document covers database testing for the Bhutan EduSkill project using Neon PostgreSQL.

## Quick Test Command

```bash
npx tsx scripts/test-database-simple.ts
```

## Test Files

| File | Purpose |
|------|---------|
| [`scripts/test-database-simple.ts`](../scripts/test-database-simple.ts) | Simplified tests using raw SQL (recommended) |
| [`scripts/test-database.ts`](../scripts/test-database.ts) | Full Drizzle ORM tests |
| [`scripts/check-tables.ts`](../scripts/check-tables.ts) | Inspect existing database tables |
| [`scripts/check-homework.ts`](../scripts/check-homework.ts) | Check specific table structure |

## Test Coverage

The test suite validates 11 core database operations:

| # | Test | Description |
|---|------|-------------|
| 1 | Connection | Verifies connection to Neon PostgreSQL |
| 2 | WRITE: School | Creates a school record |
| 3 | WRITE: User | Creates a student user |
| 4 | WRITE: Class | Creates a class record |
| 5 | WRITE: Homework | Creates a homework assignment |
| 6 | PULL: Read School | Retrieves school by ID |
| 7 | PULL: Read User | Retrieves user with JOIN |
| 8 | PULL: Multiple | Retrieves classes and homework |
| 9 | UPDATE: School Name | Updates and verifies changes |
| 10 | COMPLEX: Multi-table JOIN | Joins users, schools, classes |
| 11 | AGGREGATE: Count | Counts and groups records |

## Database Operations Tested

- **CREATE** - Inserting new records
- **READ** - Selecting single and multiple records
- **UPDATE** - Modifying existing data
- **DELETE** - Cleaning up test data
- **JOIN** - Querying related tables
- **AGGREGATE** - Counting and grouping

## Current Database Schema

The database has **90+ tables** including:

### Core Tables
- `users` - Students, teachers, parents, admins
- `schools` - School information
- `classes` - Class/grade sections
- `subjects` - School subjects
- `homework` - Assignments
- `homework_submissions` - Student submissions

### Additional Tables
- `attendance`, `attendance_records`
- `books`, `circulation` (Library)
- `hostel_buildings`, `hostel_rooms`, `hostel_allocations`
- `vehicles`, `vehicle_tracking`, `transport_routes`
- `rub_colleges`, `rub_programs`, `rub_applications`
- `fee_payments`, `student_fees`
- `assessments`, `assessment_results`, `riasec_results`, `mbti_results`
- And 60+ more...

## Known Schema Mismatches

The codebase schema (`src/lib/db/schema.ts`) has some columns that don't exist in the actual database:

| Table | Missing in Database |
|-------|---------------------|
| `schools` | `domain` column |
| `homework` | `author_id`, `author_name`, `author_role` columns |
| `users` | `subjects` is `text` instead of `json` |

**Recommendation:** Use raw SQL queries in tests to work with the actual database structure.

## Example: Writing a New Test

```typescript
import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function testMyFeature() {
  // CREATE
  await sql`
    INSERT INTO my_table (id, name, value)
    VALUES (${`test-${Date.now()}`}, 'Test', 123)
  `;

  // READ
  const result = await sql`
    SELECT * FROM my_table WHERE name = 'Test'
  `;

  console.log("Result:", result);

  // UPDATE
  await sql`
    UPDATE my_table SET value = 456 WHERE name = 'Test'
  `;

  // DELETE
  await sql`DELETE FROM my_table WHERE name = 'Test'`;
}
```

## Running Tests

```bash
# Run all database tests
npx tsx scripts/test-database-simple.ts

# Check table structure
npx tsx scripts/check-tables.ts

# Check specific table
npx tsx scripts/check-homework.ts
```

## Test Results Example

```
╔════════════════════════════════════════════════════════════╗
║         BHUTAN EDUSKILL - DATABASE TEST SUITE            ║
║              Testing Neon PostgreSQL                      ║
╚════════════════════════════════════════════════════════════╝

============================================================
TEST 1: Database Connection
============================================================
✓ Database connected successfully!
  Server time: 2026-02-15T05:11:33.742083+00

============================================================
TEST SUMMARY
============================================================
Total Tests: 11
Passed: 11
Failed: 0
Duration: 8.14s

✓ Database test suite completed!
```

## Connection Details

- **Database:** Neon PostgreSQL
- **ORM:** Drizzle ORM
- **Environment Variable:** `DATABASE_URL`
- **Config:** [`drizzle.config.ts`](../drizzle.config.ts)

## Troubleshooting

### "DATABASE_URL not set"
Ensure your `.env` file contains:
```
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/neondb?sslmode=require
```

### "column does not exist"
The database schema may differ from `schema.ts`. Check actual columns with:
```bash
npx tsx scripts/check-tables.ts
```

### Schema Synchronization
To push schema changes to the database:
```bash
npx drizzle-kit push
```

To open Drizzle Studio (visual database browser):
```bash
npx drizzle-kit studio
```
