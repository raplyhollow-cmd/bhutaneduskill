# Query Optimizations

> **Status:** Active optimizations as of February 25, 2026
> **Purpose:** Document N+1 query fixes and optimization patterns

---

## Overview

N+1 queries occur when you fetch a list of items (1 query), then make an additional query for each item to get related data (N queries). This causes performance issues that scale poorly with data volume.

**Impact:** For 100 students, an N+1 pattern results in 101 database queries instead of 2-3.

---

## Fixed N+1 Issues

### 1. `/api/counselor/students` - Fixed (4N queries → 4 queries)

**Before:** For each student, made 3 separate queries
- `db.query.assessments.findMany()` - Get assessment status
- `db.query.careerPlans.findFirst()` - Get career plan
- `db.query.attendance.findMany()` - Get attendance rate

**After:** Batch fetch all data upfront, create Maps for lookup

```typescript
// Collect IDs
const studentIds = allStudents.map(s => s.id);

// Batch fetch assessments
const allAssessments = await db
  .select({ userId: assessments.userId, status: assessments.status })
  .from(assessments)
  .where(sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

// Create lookup map
const assessmentMap = new Map(studentIds.map(id => [id, { completed: 0, inProgress: false }]));
for (const a of allAssessments) {
  const entry = assessmentMap.get(a.userId);
  if (entry) {
    if (a.status === "completed") entry.completed++;
    if (a.status === "in_progress") entry.inProgress = true;
  }
}

// Use in map() instead of await
const studentsWithData = allStudents.map(student => {
  const assessEntry = assessmentMap.get(student.id);
  // ... use assessEntry
});
```

**Query Reduction:** `1 + 3N` → `4` queries

---

### 2. `/api/teacher/students` - Fixed (3N queries → 4 queries)

**Before:** For each enrollment, made 3 queries
- Attendance lookup by student + class
- Homework submissions count
- Parent user lookup

**After:** Batch fetch with composite key mapping

```typescript
// Batch 1: Fetch all attendance with composite keys
const allAttendance = await db
  .select({ studentId: attendance.studentId, classId: attendance.classId, status: attendance.status })
  .from(attendance)
  .where(sql`${attendance.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

// Create composite key map
const attendanceMap = new Map<string, { present: number; absent: number; total: number }>();
for (const a of allAttendance) {
  const key = `${a.studentId}-${a.classId}`; // Composite key!
  const entry = attendanceMap.get(key) || { present: 0, absent: 0, total: 0 };
  entry.total++;
  if (a.status === "present") entry.present++;
  attendanceMap.set(key, entry);
}

// Batch 2: Parents
const parentMap = new Map();
const parentsData = await db
  .select({ id: users.id, firstName: users.firstName, ... })
  .from(users)
  .where(sql`${users.id} IN ${sql.raw(`('${parentIds.join("','")}')`)}`);
for (const p of parentsData) parentMap.set(p.id, p);
```

**Query Reduction:** `1 + 3N` → `4` queries

---

### 3. `/api/ministry/schools` - Fixed (2N queries → 3 queries)

**Before:** For each school, 2 count queries
```typescript
// N queries for student counts
const studentCount = await db.select({ count: count() }).from(users).where(...);
// N queries for teacher counts
const teacherCount = await db.select({ count: count() }).from(users).where(...);
```

**After:** Single GROUP BY query
```typescript
// One query for all student counts
const studentCounts = await db
  .select({ schoolId: users.schoolId, count: count() })
  .from(users)
  .where(and(
    sql`${users.schoolId} IN ${sql.raw(`('${schoolIds.join("','")}')`)}`,
    eq(users.type, "student"),
    eq(users.isActive, true)
  ))
  .groupBy(users.schoolId);

const studentCountMap = new Map(studentCounts.map(c => [c.schoolId, c.count]));
```

**Query Reduction:** `1 + 2N` → `3` queries

---

### 4. `/api/admin/analytics-data` - Fixed (3N queries → 1 query)

**Before Issue 1:** Top schools fetched, then individual counts
```typescript
const topSchools = await db.select({ schoolId: schools.id, ... }).limit(10);
// Then N queries for student counts
const topSchoolsByStudentCount = await Promise.all(
  topSchools.map(async (school) => {
    const [result] = await db.select({ count: count() }).where(...);
    return { ...school, studentCount: result?.count || 0 };
  })
);
```

**After:** Single JOIN with GROUP BY
```typescript
const topSchoolsByStudentCount = await db
  .select({
    schoolId: schools.id,
    schoolName: schools.name,
    studentCount: count(),
  })
  .from(schools)
  .innerJoin(users, eq(schools.id, users.schoolId))
  .where(eq(users.type, 'student'))
  .groupBy(schools.id, schools.name)
  .orderBy(desc(count()))
  .limit(10);
```

**Before Issue 2:** Interest by grade - individual queries per grade
**Before Issue 3:** Top performing schools - N aggregate queries

**Query Reduction:** Multiple `N` query blocks eliminated

---

## Optimization Pattern

### The N+1 Pattern (Anti-Pattern)

```typescript
// BAD: N+1 queries
const items = await db.select().from(itemsTable);
const enriched = await Promise.all(
  items.map(async (item) => {
    const related = await db.select().from(relatedTable).where(eq(relatedTable.itemId, item.id));
    return { ...item, related };
  })
);
```

### The Batch Pattern (Correct)

```typescript
// GOOD: 2 queries
const items = await db.select().from(itemsTable);
const itemIds = items.map(i => i.id);

// Batch fetch
const allRelated = await db
  .select()
  .from(relatedTable)
  .where(inArray(relatedTable.itemId, itemIds));

// Create map
const relatedMap = new Map(allRelated.map(r => [r.itemId, r]));

// Enrich
const enriched = items.map(item => ({
  ...item,
  related: relatedMap.get(item.id) || null,
}));
```

---

## Key Techniques

### 1. Use `inArray()` for batch filtering

```typescript
import { inArray } from "drizzle-orm";

await db
  .select()
  .from(users)
  .where(inArray(users.id, userIds));
```

### 2. Use `GROUP BY` for aggregations

```typescript
await db
  .select({
    schoolId: users.schoolId,
    count: count(),
  })
  .from(users)
  .groupBy(users.schoolId);
```

### 3. Use Maps for lookups

```typescript
const map = new Map(results.map(r => [r.id, r]));
const item = map.get(someId); // O(1) lookup
```

### 4. Composite keys for multi-column lookups

```typescript
const key = `${studentId}-${classId}`;
const map = new Map();
map.set(key, value);
```

---

## When to Use Each Pattern

| Scenario | Pattern |
|----------|---------|
| Count items per category | `GROUP BY` |
| Fetch related entities | `inArray()` + Map |
| One-to-many relationships | Batch fetch + composite keys |
| Aggregations (sum, avg) | Single query with `JOIN` + `GROUP BY` |

---

## Ongoing Work

- More routes may have N+1 issues
- Prioritize high-traffic routes
- Use query logging to identify slow endpoints

---

## Related Documentation

- [docs/memory/database-patterns.md](database-patterns.md) - Database query rules
- [docs/memory/api-patterns.md](api-patterns.md) - API route templates
