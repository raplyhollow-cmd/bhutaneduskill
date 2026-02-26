# Database Schema Audit - February 2026

> **Date:** 2026-02-25
> **Auditor:** System Audit
> **Database:** PostgreSQL (Neon)
> **ORM:** Drizzle ORM
> **Total Tables:** **~180 tables** across 19 schema files

---

## Executive Summary

**Verdict:** ✅ **EVOLVE** - Do NOT redo

The schema is well-organized with proper modularization. While large, it follows good practices with:
- Clear separation of concerns (19 domain-specific schema files)
- Proper indexing on frequently queried columns
- Good use of foreign keys with cascade deletes
- Consistent naming conventions

**Recommendation:** Evolution over rewrite. Fix issues incrementally.

---

## Schema Structure Analysis

### Schema Files Breakdown

| Schema File | Tables | Purpose | Status |
|-------------|--------|---------|--------|
| `schema.ts` | ~95 | Core tables (users, schools, classes, subjects, etc.) | ✅ Well-organized |
| `rub-schema.ts` | 8 | Royal University of Bhutan integration | ✅ Domain-isolated |
| `bcse-schema.ts` | 8 | BCSE exam integration | ✅ Domain-isolated |
| `transport-schema.ts` | 8 | Transport management | ✅ Domain-isolated |
| `hostel-schema.ts` | 15 | Hostel management | ✅ Domain-isolated |
| `library-schema.ts` | 12 | Library management | ✅ Domain-isolated |
| `inventory-schema.ts` | 12 | Inventory management | ✅ Domain-isolated |
| `billing-schema.ts` | 8 | Subscription/billing | ✅ Domain-isolated |
| `subscription-schema.ts` | 12 | Marketplace subscriptions | ⚠️ Duplicate with billing |
| `payroll-schema.ts` | 9 | Payroll management | ✅ Domain-isolated |
| `rbac-schema.ts` | 6 | Role-based access control | ✅ Domain-isolated |
| `notifications-schema.ts` | 3 | Notification system | ✅ Domain-isolated |
| `tenancy-schema.ts` | 5 | Multi-tenant architecture | ✅ Domain-isolated |
| `timetable-schema.ts` | 6 | Timetable management | ✅ Domain-isolated |
| `messaging-schema.ts` | 6 | Messaging/announcements | ✅ Domain-isolated |
| `parent-teacher-chat-schema.ts` | 2 | Parent-teacher chat | ⚠️ Duplicate with messaging |
| `lesson-plan-schema.ts` | 2 | Lesson planning | ✅ Domain-isolated |
| `teacher-logs-schema.ts` | 1 | Teacher behavior logs | ✅ Domain-isolated |
| `reports-schema.ts` | 10 | Report generation | ✅ Domain-isolated |
| **TOTAL** | **~180** | | |

---

## Issues Found

### 🔴 Critical Issues

#### 1. Duplicate Tables (Name Conflicts)

| Table | Locations | Impact |
|-------|-----------|--------|
| `invoices` | `schema.ts:490`, `billing-schema.ts:144`, `subscription-schema.ts:311` | **Export conflict** |
| `subscriptionPlans` | `billing-schema.ts:18`, `subscription-schema.ts:15` | **Export conflict** |
| `discountCodes` | `billing-schema.ts:269`, `subscription-schema.ts:277` | **Export conflict** |
| `announcements` | `schema.ts:1291`, `messaging-schema.ts:87` | **Export conflict** |
| `timePeriods` | `schema.ts:1520`, `timetable-schema.ts:16` | **Export conflict** |
| `rooms` | `schema.ts:1541`, `timetable-schema.ts:92` | **Export conflict** |
| `timetableEntries` | `schema.ts:1586`, `timetable-schema.ts:47` | **Export conflict** |
| `circulation` | `schema.ts:2388`, `library-schema.ts:130` | **Export conflict** |
| `digitalResources` | `schema.ts:2456`, `library-schema.ts:218` | **Export conflict** |
| `libraryMembers` | `schema.ts:780`, `library-schema.ts:304` | **Export conflict** |

**Fix Required:** These duplicate exports will cause build errors. Need to consolidate or rename.

#### 2. `users` Table - Overloaded with Concerns

The `users` table has **40+ columns** mixing multiple concerns:

```typescript
// Current: ALL user types in one table
export const users = pgTable("users", {
  // Auth fields
  id, clerkUserId, email, emailVerified,

  // Profile fields
  firstName, lastName, name, phone, profileImage, dateOfBirth, gender,

  // Student-specific
  grade, section, rollNumber, classGrade, parentId,

  // Teacher-specific
  employeeId, department, subjects (JSON),

  // Location fields
  address, city, state, postalCode, country,

  // Settings
  settings, interests, goals (JSON),

  // ... 20+ more columns
});
```

**Problem:**
- Students don't need `employeeId` or `department`
- Teachers don't need `grade` or `rollNumber`
- JSON fields (`subjects`, `settings`) can't be queried efficiently

**Evolutionary Fix:** Keep the table, but add views for specific user types:

```typescript
// Add these views (no migration needed)
// db.select().from(studentProfiles).where(eq(studentProfiles.id, id))
// db.select().from(teacherProfiles).where(eq(teacherProfiles.id, id))
```

---

### 🟡 Medium Priority Issues

#### 3. JSON Columns Overuse

| Column | Table | Issue |
|--------|-------|-------|
| `subjects` | users | Can't query "who teaches Math?" efficiently |
| `settings` | users | Can't query "users with dark mode" efficiently |
| `interests` | users | Can't query "students interested in CS" efficiently |
| `parentContact` | users | Structured data in JSON |
| `section` | users | Should be text, not JSON |

**Evolutionary Fix:** Gradually migrate hot fields to proper columns:

```typescript
// Phase 1: Add new columns (non-breaking)
export const users = pgTable("users", {
  // ... existing
  subjectsJson: json("subjects"), // Keep old data
  subjects: text("subjects_array"), // New: comma-separated or array
});

// Phase 2: Migration script to populate new columns
// Phase 3: Update queries to use new columns
// Phase 4: Remove old columns (future)
```

#### 4. Inconsistent Naming

| Pattern | Issue | Example |
|---------|-------|---------|
| Snake_case in DB vs camelCase in code | Confusing | `clerk_user_id` vs `clerkUserId` |
| Table name prefixes | Inconsistent | `time_periods` vs `class_subjects` |

**This is actually fine** - Drizzle handles this well. Just document the pattern.

#### 5. Missing Composite Indexes

Some common query patterns are missing indexes:

```typescript
// Common query: Get students by school AND grade
// Current: Only has idx_users_school_type
// Missing: index on (schoolId, classGrade)

// Common query: Get homework by class AND subject
// Missing: index on (classId, subjectId)

// Common query: Get attendance by student AND date range
// Missing: index on (studentId, date)
```

---

### 🟢 Low Priority Issues

#### 6. Redundant Tables in `schema.ts`

These tables exist both in `schema.ts` AND specialized schema files:

| Table | In `schema.ts` | Should be in |
|-------|----------------|--------------|
| `libraryBooks` | Line 729 | `library-schema.ts` |
| `libraryMembers` | Line 780 | `library-schema.ts` |
| `libraryCirculation` | Line 828 | `library-schema.ts` |
| `circulation` | Line 2388 | `library-schema.ts` |
| `digitalResources` | Line 2456 | `library-schema.ts` |

**Fix:** Remove from `schema.ts`, only import from specialized schemas.

---

## Schema Quality Metrics

| Metric | Score | Notes |
|--------|-------|-------|
| **Modularity** | 9/10 | Well-separated into domain files |
| **Indexing** | 7/10 | Good basic indexes, missing some composite |
| **Naming Consistency** | 8/10 | Mostly consistent, documented patterns |
| **Relation Clarity** | 8/10 | Good FK usage, relations disabled but documented |
| **Scalability** | 7/10 | Some concerns (JSON columns, overloaded users table) |
| **Duplication** | 5/10 | Several duplicate table definitions |
| **Overall** | **7.5/10** | Solid foundation, needs evolution |

---

## Recommendations: Evolution Path

### Phase 1: Fix Critical Duplicates (Week 1)

1. **Consolidate duplicate table exports**
   - Keep ONE definition per table
   - For splits (core vs domain), use selective exports
   - Update all imports

2. **Add missing composite indexes**
   ```typescript
   // In schema.ts, add to existing tables
   }, (table) => ({
     // ... existing indexes
     schoolGradeIdx: index("idx_users_school_grade").on(table.schoolId, table.classGrade),
     studentDateIdx: index("idx_attendance_student_date").on(table.studentId, table.date),
   }));
   ```

### Phase 2: Gradual JSON Migration (Week 2-4)

1. **Add typed columns alongside JSON**
2. **Create migration scripts**
3. **Update hot queries**
4. **Deprecate old JSON fields**

### Phase 3: User Table Optimization (Month 2)

1. **Create domain-specific views**
2. **Migrate queries to use views**
3. **Consider user profile extension tables** (future)

### Phase 4: Schema Cleanup (Ongoing)

1. **Remove redundant tables from `schema.ts`**
2. **Consolidate billing/subscription schemas**
3. **Consolidate messaging schemas**

---

## Tables That Can Be Simplified

### 1. Assessment Result Tables

**Current:** 5 separate tables
```typescript
riasecResults, mbtiResults, discResults,
workValuesResults, learningStylesResults
```

**Evolution:** Single generic table
```typescript
export const assessmentResults = pgTable("assessment_results", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => users.id),
  assessmentType: text("assessment_type"), // "riasec", "mbti", etc.
  resultData: jsonb("result_data"), // Flexible storage
  completedAt: timestamp("completed_at"),
});
```

### 2. Duplicate Library Tables

**Current:** 10 tables across 2 files

**Evolution:** Use only `library-schema.ts`, import into `schema.ts`

### 3. Billing vs Subscription

**Current:** 8 tables in billing, 12 in subscription (overlap)

**Evolution:** Merge into unified `billing-schema.ts`

---

## Migration Strategy

### DO NOT:

❌ Delete all tables and start over
❌ Run large breaking migrations
❌ Change table names (requires app-wide updates)
❌ Remove columns before verifying usage

### DO:

✅ Add new columns alongside old ones
✅ Create views for simplified access
✅ Add indexes for slow queries
✅ Consolidate duplicate definitions
✅ Document schema decisions
✅ Use feature flags for new schemas

---

## Performance Considerations

### Query Patterns Analyzed

| Query Pattern | Current Performance | Improvement |
|---------------|-------------------|-------------|
| Get students by school | Good (indexed) | None needed |
| Get teachers by subject | Poor (JSON column) | Add junction table |
| Get homework by class | Good | None needed |
| Get attendance by date | Missing index | Add composite index |
| Get notifications | Good (indexed) | None needed |

---

## Conclusion

**The schema is fundamentally sound.** The modular structure with domain-specific schema files is a good architectural decision.

**Key Actions:**
1. Fix duplicate table exports (blocking issue)
2. Add missing composite indexes (performance)
3. Document the schema more thoroughly
4. Gradually migrate hot JSON paths to proper columns

**Estimated Effort:**
- Critical fixes: 1-2 days
- Index optimization: 1 day
- Documentation: 1 day
- JSON migration: 1-2 weeks (phased)

**Total:** ~3 weeks to optimal state (no redo needed)

---

## Related Documentation

- [Database Schema Reference](database-schema-reference.md) - Developer quick reference
- [Database Patterns](../memory/database-patterns.md) - Query patterns
- [API & Schema Optimization Plan](../plans/api-schema-optimization.md) - Performance roadmap

---

**Last Updated:** 2026-02-25
**Next Review:** After Phase 1 completion
