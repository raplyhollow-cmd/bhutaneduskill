# Scalability Error Prediction - Production Scale

**Target Scale:** 500 Schools, 60,000+ Students
**Current Scale:** ~10 schools (development/testing)
**Created:** March 2, 2026
**Purpose:** Predict production-scale errors with prevention strategies

---

## Executive Summary

This document predicts potential errors when scaling from ~10 schools to **500+ schools with 60,000+ students**. Each prediction includes:
- Probability of occurrence
- Impact on system
- Priority level (P0-Critical, P1-High, P2-Medium)
- Prevention strategies with code examples
- Detection metrics

**Risk Assessment:**
- **P0 (Critical):** 8 predictions - System-breaking errors
- **P1 (High):** 12 predictions - Major feature failures
- **P2 (Medium):** 10 predictions - Performance degradation

**Total Predictions:** 30 scalability risks

---

## Risk Assessment Matrix

| Risk Category | Probability | Impact | Priority | Count |
|--------------|-------------|--------|----------|-------|
| **Database Connection Pool Exhaustion** | HIGH (90%) | CRITICAL | P0 | 1 |
| **Database Query Timeouts** | HIGH (85%) | CRITICAL | P0 | 1 |
| **N+1 Query Cascades** | MEDIUM (60%) | HIGH | P1 | 3 |
| **API Rate Limiting** | HIGH (80%) | HIGH | P1 | 2 |
| **Memory Leaks** | MEDIUM (50%) | CRITICAL | P0 | 1 |
| **WebSocket Connection Limits** | HIGH (75%) | HIGH | P1 | 1 |
| **Cache Stampede** | MEDIUM (55%) | HIGH | P1 | 1 |
| **File Storage Limits** | HIGH (80%) | MEDIUM | P2 | 1 |
| **Session Management Overload** | MEDIUM (60%) | HIGH | P1 | 1 |
| **Notification Queue Backlog** | HIGH (70%) | MEDIUM | P2 | 1 |
| **Search Performance Degradation** | HIGH (85%) | CRITICAL | P0 | 1 |
| **Background Job Failures** | MEDIUM (50%) | MEDIUM | P2 | 2 |
| **Concurrent Write Conflicts** | MEDIUM (45%) | HIGH | P1 | 1 |
| **Clerk Authentication Rate Limits** | MEDIUM (40%) | HIGH | P1 | 1 |
| **Vercel Serverless Function Limits** | HIGH (90%) | CRITICAL | P0 | 1 |
| **Database Index Missing on Large Tables** | HIGH (95%) | CRITICAL | P0 | 1 |
| **Real-time Updates Bottleneck** | MEDIUM (60%) | MEDIUM | P2 | 1 |
| **Report Generation Timeouts** | HIGH (75%) | MEDIUM | P2 | 1 |
| **Data Export Failures** | MEDIUM (50%) | MEDIUM | P2 | 1 |
| **Cross-tenant Data Leaks** | LOW (25%) | CRITICAL | P0 | 1 |

---

## P0: CRITICAL ERRORS (System-Breaking)

### P0-001: Database Connection Pool Exhaustion

**Probability:** HIGH (90%)
**Impact:** CRITICAL - All database operations fail
**Priority:** P0
**Predicted Occurrence:** At ~100 concurrent users

#### Scenario
Neon PostgreSQL free tier has limited connection pools. With 500 schools and potentially 5,000+ concurrent users during peak hours (morning attendance, homework submission), connection pool will exhaust.

#### Predicted Error
```
Error: Connection pool exhausted
  at neonHttpPool.acquire
  at Database.query
  at /api/endpoint
```

#### Prevention Strategy

**1. Implement Connection Pooling:**
```typescript
// src/lib/db/index.ts
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

neonConfig.fetchConnectionCache = true;

// LIMIT concurrent connections
const MAX_CONNECTIONS = 20;
const connectionSemaphore = new Semaphore(MAX_CONNECTIONS);

export async function withConnection<T>(
  callback: (db: DrizzleDB) => Promise<T>
): Promise<T> {
  await connectionSemaphore.acquire();
  try {
    return await callback(db);
  } finally {
    connectionSemaphore.release();
  }
}

// Usage in API routes
export async function GET(req: Request) {
  return withConnection(async (db) => {
    const data = await db.select().from(users);
    return Response.json(data);
  });
}
```

**2. Add Request Queuing:**
```typescript
// src/lib/api/rate-limiter.ts
import { pRateLimiter } from 'p-ratelimiter';

const dbQueue = new pRateLimiter({
  interval: 1000,
  rate: 100, // Max 100 DB queries per second
  concurrency: 20 // Max 20 concurrent
});

export async function queryDatabase<T>(
  query: () => Promise<T>
): Promise<T> {
  return dbQueue(query);
}
```

**3. Implement Read Replicas (Future):**
```typescript
// Read operations go to replica
const readDb = drizzle(readReplicaUrl, { schema });

// Write operations go to primary
const writeDb = drizzle(primaryDbUrl, { schema });
```

#### Detection Metrics
- Monitor active connections: `SHOW active_connections`
- Alert when >80% of pool used
- Track query duration p95
- Monitor connection wait time

---

### P0-002: Database Query Timeouts

**Probability:** HIGH (85%)
**Impact:** CRITICAL - API endpoints fail
**Priority:** P0
**Predicted Occurrence:** At ~50,000+ student records

#### Scenario
Queries without proper indexes or with large JOINs will timeout when tables grow to 50,000+ rows (students) + 10,000+ teachers + 5,000+ classes.

#### Predicted Error
```
Error: Query timeout after 30s
  at neonHttp.fetch
  at Database.query
```

#### Prevention Strategy

**1. Add Critical Indexes:**
```typescript
// src/lib/db/schema.ts

// Users table - HIGH PRIORITY
export const users = pgTable('users', {
  // ... columns
}, (table) => ({
  // COMPOUND indexes for common queries
  usersSchoolIdx: index('users_school_idx').on(table.schoolId),
  usersSchoolTypeIdx: index('users_school_type_idx').on(table.schoolId, table.type),
  usersClerkIdx: index('users_clerk_idx').on(table.clerkUserId),
  usersActiveIdx: index('users_active_idx').on(table.isActive),
}));

// Classes table
export const classes = pgTable('classes', {
  // ... columns
}, (table) => ({
  classesSchoolIdx: index('classes_school_idx').on(table.schoolId),
  classesTeacherIdx: index('classes_teacher_idx').on(table.teacherId),
}));

// Homework table
export const homework = pgTable('homework', {
  // ... columns
}, (table) => ({
  homeworkClassIdx: index('homework_class_idx').on(table.classId),
  homeworkSchoolIdx: index('homework_school_idx').on(table.schoolId),
  homeworkDueIdx: index('homework_due_idx').on(table.dueDate),
}));
```

**2. Add Query Timeout Guards:**
```typescript
// src/lib/db/query-timeout.ts
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
}

// Usage
const result = await withTimeout(
  db.select().from(users).where(eq(users.schoolId, schoolId)),
  5000 // 5 second timeout
);
```

**3. Implement Query Optimization:**
```typescript
// BAD: Full table scan
const students = await db.select().from(users);

// GOOD: Limited with WHERE
const students = await db
  .select()
  .from(users)
  .where(eq(users.schoolId, schoolId))
  .limit(100);

// BETTER: Pagination
const students = await db
  .select()
  .from(users)
  .where(eq(users.schoolId, schoolId))
  .limit(50)
  .offset(page * 50);
```

#### Detection Metrics
- Track slow queries (>3s)
- Monitor query duration p50, p95, p99
- Alert on query timeouts
- Review execution plans with `EXPLAIN ANALYZE`

---

### P0-003: Memory Leaks in Serverless Functions

**Probability:** MEDIUM (50%)
**Impact:** CRITICAL - Functions crash
**Priority:** P0
**Predicted Occurrence:** At ~1,000+ concurrent requests

#### Scenario
Vercel serverless functions have memory limits (default 1024MB, max 4096MB). Memory leaks from unclosed connections, large cached data, or growing arrays will cause crashes.

#### Predicted Error
```
Error: Function invocation failed
  Reason: Out of memory
  Limit: 1024 MB
  Used: 1023 MB
```

#### Prevention Strategy

**1. Implement Memory Monitoring:**
```typescript
// src/lib/monitoring/memory.ts
export function checkMemoryUsage() {
  const used = process.memoryUsage();
  const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(2);

  logger.info('Memory usage', {
    rss: `${mb(used.rss)} MB`,
    heapUsed: `${mb(used.heapUsed)} MB`,
    heapTotal: `${mb(used.heapTotal)} MB`,
    external: `${mb(used.external)} MB`,
  });

  if (used.heapUsed > 800 * 1024 * 1024) {
    logger.warn('High memory usage', {
      heapUsed: `${mb(used.heapUsed)} MB`
    });
  }
}

// Call in API routes
export async function GET(req: Request) {
  checkMemoryUsage();
  // ... route logic
}
```

**2. Fix Common Memory Leaks:**

**Unclosed Database Connections:**
```typescript
// BAD: Connection never closed
const result = await db.select().from(users);

// GOOD: Always scoped
let result;
try {
  result = await db.select().from(users);
} finally {
  // Connection automatically released by withConnection wrapper
}
```

**Growing Arrays:**
```typescript
// BAD: Array grows without limit
const cache = [];
export function addToCache(item: any) {
  cache.push(item); // Grows forever!
}

// GOOD: Bounded cache with LRU
import { LRUCache } from 'lru-cache';
const cache = new LRUCache({ max: 500 });
```

**Large Objects in Memory:**
```typescript
// BAD: Load all data into memory
const allStudents = await db.select().from(users);

// GOOD: Stream or paginate
const students = await db
  .select()
  .from(users)
  .limit(100)
  .offset(page * 100);
```

**3. Increase Memory Limit:**
```javascript
// vercel.json
{
  "functions": {
    "app/api/**/*.ts": {
      "memory": 4096
    }
  }
}
```

#### Detection Metrics
- Monitor function memory usage
- Track memory growth rate
- Alert on >80% memory usage
- Profile memory with `node --heap-prof`

---

### P0-004: Search Performance Degradation

**Probability:** HIGH (85%)
**Impact:** CRITICAL - Search unusable
**Priority:** P0
**Predicted Occurrence:** At ~10,000+ records per entity

#### Scenario
Full-text search across students, teachers, homework, etc. becomes unusable with LIKE queries on large datasets.

#### Predicted Error
```
Error: Query timeout after 30s
  at searchStudents
```

#### Prevention Strategy

**1. Implement Proper Full-Text Search:**
```typescript
// src/lib/api/search.ts

// BAD: LIKE query (slow on large datasets)
const students = await db
  .select()
  .from(users)
  .where(sql`${users.name} LIKE ${`%${query}%`}`);

// GOOD: PostgreSQL full-text search
const students = await db
  .select()
  .from(users)
  .where(
    sql`to_tsvector('english', ${users.name}) @@ to_tsquery('english', ${query}:*)`
  );

// BETTER: Add dedicated search column
export const users = pgTable('users', {
  // ... columns
  searchVector: tsvector('search_vector'),
}, (table) => ({
  searchIdx: index('search_idx').using('gin', table.searchVector),
}));

// Update trigger in migration
CREATE TRIGGER users_search_update
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION
    tsvector_update_trigger(search_vector, 'pg_catalog.english', name, email);

// Query with GIN index (very fast)
const students = await db
  .select()
  .from(users)
  .where(sql`${users.searchVector} @@ to_tsquery('english', ${query}:*)`);
```

**2. Implement Dedicated Search Service:**
```typescript
// Use Meilisearch, Algolia, or Elasticsearch for better performance
// src/lib/search/meilisearch.ts
import { MeiliSearch } from 'meilisearch';

const searchClient = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST,
  apiKey: process.env.MEILISEARCH_API_KEY,
});

export async function searchStudents(query: string, schoolId: string) {
  const index = searchClient.index('students');
  const results = await index.search(query, {
    filter: [`schoolId = ${schoolId}`],
    limit: 20,
  });
  return results.hits;
}
```

**3. Add Search Debouncing:**
```typescript
// src/components/search/search-bar.tsx
import { useDebouncedCallback } from 'use-debounce';

export function SearchBar() {
  const debouncedSearch = useDebouncedCallback(
    (query: string) => {
      // Perform search
      performSearch(query);
    },
    300 // Wait 300ms after user stops typing
  );

  return (
    <input
      onChange={(e) => debouncedSearch(e.target.value)}
      placeholder="Search students..."
    />
  );
}
```

#### Detection Metrics
- Track search query duration
- Monitor search result count
- Alert on searches >3s
- Track search result relevance

---

### P0-005: Vercel Serverless Function Limits

**Probability:** HIGH (90%)
**Impact:** CRITICAL - API endpoints fail
**Priority:** P0
**Predicted Occurrence:** At ~500+ schools with high traffic

#### Scenario
Vercel Hobby plan limits: 100GB bandwidth, 1000 invocations/day (Pro plan: 1TB, 100,000 invocations/day). High traffic schools will exceed limits.

#### Predicted Error
```
Error: Function execution limit exceeded
  Reason: Too many invocations
  Limit: 1000/day (Hobby)
```

#### Prevention Strategy

**1. Implement Response Caching:**
```typescript
// src/lib/api/cache.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached) return cached;

  const result = await fn();
  cache.set(key, result);
  return result;
}

// Usage in API routes
export async function GET(req: Request) {
  return withCache('schools-list', async () => {
    const schools = await db.select().from(schools);
    return Response.json(schools);
  });
}
```

**2. Batch Requests:**
```typescript
// Instead of 50 requests, make 1 batched request
// src/app/api/students/batch/route.ts
export async function POST(req: Request) {
  const { studentIds } = await req.json();
  const students = await db
    .select()
    .from(users)
    .where(inArray(users.id, studentIds));
  return Response.json(students);
}
```

**3. Upgrade Vercel Plan:**
```json
{
  "plan": "Pro",
  "limits": {
    "bandwidth": "1TB",
    "invocations": "100,000/day",
    "executionTime": "60s"
  }
}
```

**4. Move Heavy Processing to Background:**
```typescript
// src/lib/jobs/background.ts
// Use Vercel Cron Jobs or external queue
export async function enqueueBackgroundJob(job: Job) {
  const queue = getQueue();
  await queue.add('background', job);
}
```

#### Detection Metrics
- Monitor function invocation count
- Track bandwidth usage
- Alert at 80% of limits
- Review slow functions (>10s)

---

### P0-006: Database Index Missing on Large Tables

**Probability:** HIGH (95%)
**Impact:** CRITICAL - Queries slow to timeout
**Priority:** P0
**Predicted Occurrence:** At ~10,000+ rows per table

#### Scenario
Tables grow large without indexes on frequently queried columns (schoolId, teacherId, classId, etc.).

#### Predicted Error
```
Error: Query timeout after 30s
Seq Scan on users (cost=0.00..500000.00 rows=50000 width=500)
```

#### Prevention Strategy

**1. Create Migration for Critical Indexes:**
```typescript
// src/lib/db/migrations/add_critical_indexes.ts
import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';

export async function up() {
  // Users table indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS users_school_idx ON users(school_id);
    CREATE INDEX IF NOT EXISTS users_clerk_idx ON users(clerk_user_id);
    CREATE INDEX IF NOT EXISTS users_type_idx ON users(type);
    CREATE INDEX IF NOT EXISTS users_active_idx ON users(is_active);
    CREATE INDEX IF NOT EXISTS users_school_type_idx ON users(school_id, type);
  `);

  // Classes table indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS classes_school_idx ON classes(school_id);
    CREATE INDEX IF NOT EXISTS classes_teacher_idx ON classes(teacher_id);
    CREATE INDEX IF NOT EXISTS classes_grade_idx ON classes(grade);
  `);

  // Homework table indexes
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS homework_class_idx ON homework(class_id);
    CREATE INDEX IF NOT EXISTS homework_school_idx ON homework(school_id);
    CREATE INDEX IF NOT EXISTS homework_due_idx ON homework(due_date);
    CREATE INDEX IF NOT EXISTS homework_created_idx ON homework(created_at);
  `);

  // Attendance table indexes (HIGH TRAFFIC)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS attendance_student_idx ON attendance(student_id);
    CREATE INDEX IF NOT EXISTS attendance_class_idx ON attendance(class_id);
    CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance(date);
    CREATE INDEX IF NOT EXISTS attendance_student_date_idx ON attendance(student_id, date);
  `);
}

export async function down() {
  await db.execute(sql`DROP INDEX IF EXISTS users_school_idx`);
  // ... drop other indexes
}
```

**2. Verify Index Usage:**
```typescript
// Check if query uses index
await db.execute(sql`
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE school_id = 'school-123'
`);

// GOOD: Index Scan using users_school_idx
// BAD: Seq Scan on users
```

#### Detection Metrics
- Monitor query execution plans
- Track seq scan vs index scan ratio
- Alert on >50% seq scans
- Review missing index hints from PostgreSQL

---

### P0-007: Cross-tenant Data Leaks

**Probability:** LOW (25%)
**Impact:** CRITICAL - Security breach
**Priority:** P0
**Predicted Occurrence:** Edge cases in RBAC implementation

#### Scenario
Multi-tenant isolation fails. School A can see School B's data due to missing `schoolId` filters.

#### Predicted Error
```
SECURITY ALERT: User from School A accessed School B's data
```

#### Prevention Strategy

**1. Enforce schoolId in ALL Queries:**
```typescript
// src/lib/middleware/tenant-isolation.ts
export function withTenantIsolation<T extends { schoolId?: string }>(
  userSchoolId: string,
  query: T[]
): T[] {
  return query.filter(item => item.schoolId === userSchoolId);
}

// Usage in ALL data access
export async function getStudents(schoolId: string) {
  const students = await db
    .select()
    .from(users)
    .where(eq(users.schoolId, schoolId)); // ALWAYS filter by schoolId

  return students;
}

// NEVER do this:
export async function getAllStudents() {
  return db.select().from(users); // ❌ Returns all schools' data!
}
```

**2. Add Middleware Check:**
```typescript
// src/middleware.ts
export async function middleware(req: NextRequest) {
  const { user } = await requireAuth();

  // Check if user has schoolId
  if (!user.schoolId && user.type !== 'admin') {
    return NextResponse.json({ error: 'No school associated' }, { status: 403 });
  }

  // Add schoolId to request headers for downstream use
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-school-id', user.schoolId);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}
```

**3. Row-Level Security (PostgreSQL):**
```sql
-- Enable RLS on all multi-tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY user_school_isolation ON users
  FOR SELECT
  USING (school_id = current_setting('app.school_id')::text);

-- Set school_id in session
SET app.school_id = 'school-123';
```

#### Detection Metrics
- Audit all queries for missing schoolId filters
- Log cross-school access attempts
- Regular security audits
- Automated testing for tenant isolation

---

### P0-008: Memory Exhaustion from Large Data Exports

**Probability:** MEDIUM (40%)
**Impact:** CRITICAL - Serverless functions crash
**Priority:** P0
**Predicted Occurrence:** Exporting 10,000+ student records

#### Scenario
Admin exports all student data to CSV/Excel. Large result set loads into memory, exceeds serverless function limit (1GB-4GB).

#### Predicted Error
```
Error: Function invocation failed
  Reason: Out of memory
  Context: Exporting 50,000 students
```

#### Prevention Strategy

**1. Stream Exports:**
```typescript
// src/app/api/admin/export/students/route.ts
import { Readable } from 'stream';

export async function GET(req: Request) {
  const { schoolId } = await requireAuth(['school-admin']);

  // Stream instead of loading all into memory
  const stream = new Readable({
    async read() {
      // Fetch in batches
      const batchSize = 100;
      let offset = 0;

      while (true) {
        const batch = await db
          .select()
          .from(users)
          .where(eq(users.schoolId, schoolId))
          .limit(batchSize)
          .offset(offset);

        if (batch.length === 0) break;

        // Push CSV rows
        batch.forEach(student => {
          this.push(`${student.id},${student.name}\n`);
        });

        offset += batchSize;
      }

      this.push(null); // End stream
    }
  });

  return new Response(stream as any, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename=students.csv',
    },
  });
}
```

**2. Use External Storage:**
```typescript
// src/lib/export/queued-export.ts
// Generate export in background, store in S3/R2
export async function enqueueExportJob(schoolId: string) {
  const jobId = nanoid();
  const key = `exports/${schoolId}/${jobId}.csv`;

  // Queue background job
  await queue.add('export', { schoolId, key });

  // Return job URL
  return { jobId, url: `/api/exports/status/${jobId}` };
}

// Background worker streams to S3
worker.add('export', async (job) => {
  const { schoolId, key } = job.data;

  // Stream from DB to S3
  const stream = await dbStreamStudents(schoolId);
  await uploadToS3(key, stream);

  await markExportComplete(job.data.jobId);
});
```

**3. Limit Export Size:**
```typescript
// Validate export size before processing
export async function GET(req: Request) {
  const { schoolId } = await requireAuth(['school-admin']);

  // Check record count
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.schoolId, schoolId));

  if (count > 10000) {
    return Response.json(
      { error: 'Too many records. Use scheduled export instead.' },
      { status: 400 }
    );
  }

  // ... proceed with export
}
```

#### Detection Metrics
- Monitor export job duration
- Track export file sizes
- Alert on exports >100MB
- Monitor memory usage during exports

---

## P1: HIGH SEVERITY ERRORS (Major Feature Failures)

### P1-001: N+1 Query Cascades - Student Dashboard

**Probability:** MEDIUM (60%)
**Impact:** HIGH - Dashboard loads in 30+ seconds
**Priority:** P1
**Predicted Occurrence:** At ~1,000+ students per school

#### Scenario
Student dashboard fetches homework, attendance, grades, notifications, etc. Each category triggers N+1 queries.

#### Predicted Behavior
```
1 query for student
+ 50 queries for homework assignments
+ 50 queries for attendance records
+ 10 queries for grades
+ 20 queries for notifications
= 131 queries (30+ seconds)
```

#### Prevention Strategy
**Already Fixed (February 25, 2026):**
- `/api/counselor/students` - 1 + 3N → 4 queries
- `/api/teacher/students` - 1 + 3N → 4 queries
- `/api/ministry/schools` - 1 + 2N → 3 queries

**Apply same pattern to student dashboard:**
```typescript
// src/app/api/student/dashboard/route.ts
export async function GET(req: Request) {
  const { userId } = await requireAuth(['student']);

  // Batch fetch all data in parallel
  const [
    student,
    homework,
    attendance,
    grades,
    notifications
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(homework)
      .where(eq(homework.classId, sql`ANY(SELECT class_id FROM enrollments WHERE student_id = ${userId})`)),
    db.select().from(attendance).where(eq(attendance.studentId, userId)),
    db.select().from(grades).where(eq(grades.studentId, userId)),
    db.select().from(notifications).where(eq(notifications.userId, userId)),
  ]);

  return Response.json({
    student: student[0],
    homework,
    attendance,
    grades,
    notifications,
  });
}
```

#### Detection Metrics
- Track dashboard load time
- Monitor query count per endpoint
- Alert on >10 queries per request
- Profile with `EXPLAIN ANALYZE`

---

### P1-002: N+1 Query Cascades - Teacher Dashboard

**Probability:** MEDIUM (60%)
**Impact:** HIGH - Dashboard unusable
**Priority:** P1
**Predicted Occurrence:** At ~5+ classes per teacher

#### Scenario
Teacher dashboard loads all classes, then fetches students, homework, attendance for each class separately.

#### Prevention Strategy
Same pattern as P1-001. Batch fetch with `inArray()` and Maps.

---

### P1-003: N+1 Query Cascades - School Admin Reports

**Probability:** MEDIUM (60%)
**Impact:** HIGH - Reports timeout
**Priority:** P1
**Predicted Occurrence:** At ~50+ classes per school

#### Scenario
School admin generates reports by fetching data for each class separately.

#### Prevention Strategy
Use `GROUP BY` aggregates instead of per-class queries:
```typescript
// BAD: N queries for class statistics
const classStats = await Promise.all(
  classes.map(async (cls) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(enrollments)
      .where(eq(enrollments.classId, cls.id));
    return { classId: cls.id, studentCount: count };
  })
);

// GOOD: 1 query for all classes
const classStats = await db
  .select({
    classId: enrollments.classId,
    studentCount: sql<number>`count(*)`,
  })
  .from(enrollments)
  .groupBy(enrollments.classId);
```

---

### P1-004: API Rate Limiting - Public Endpoints

**Probability:** HIGH (80%)
**Impact:** HIGH - API abuse, higher costs
**Priority:** P1
**Predicted Occurrence:** At public launch

#### Scenario
No rate limiting on public endpoints (signup, password reset, etc.). Abusers make 1000+ requests/second.

#### Prevention Strategy
```typescript
// src/lib/api/rate-limiter.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
});

export async function checkRateLimit(identifier: string) {
  const { success, limit, remaining } = await ratelimit.limit(identifier);
  if (!success) {
    throw new Error('Rate limit exceeded');
  }
  return { limit, remaining };
}

// Usage in API routes
export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
  await checkRateLimit(`signup:${ip}`);
  // ... proceed with signup
}
```

---

### P1-005: API Rate Limiting - Per-User Limits

**Probability:** MEDIUM (50%)
**Impact:** HIGH - Noisy neighbor problem
**Priority:** P1
**Predicted Occurrence:** At ~100+ active users per school

#### Scenario
One user makes 1000+ requests/minute, affecting all users.

#### Prevention Strategy
```typescript
// Per-user rate limits
const userRatelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
});

export async function checkUserRateLimit(userId: string) {
  const { success } = await userRatelimit.limit(userId);
  if (!success) {
    throw new Error('User rate limit exceeded');
  }
}
```

---

### P1-006: WebSocket Connection Limits

**Probability:** HIGH (75%)
**Impact:** HIGH - Real-time features fail
**Priority:** P1
**Predicted Occurrence:** At ~1,000+ concurrent connections

#### Scenario
Real-time notifications, attendance updates use WebSocket connections. Serverless functions can't maintain persistent connections.

#### Prevention Strategy
```typescript
// Use Pusher for real-time (already integrated)
// src/lib/realtime.ts
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID,
  key: process.env.PUSHER_KEY,
  secret: process.env.PUSHER_SECRET,
  cluster: process.env.PUSHER_CLUSTER,
  useTLS: true,
});

// Instead of WebSockets, use Pusher events
export async function broadcastToSchool(schoolId: string, event: string, data: any) {
  await pusher.trigger(`school-${schoolId}`, event, data);
}

// Client subscribes
const channel = pusher.subscribe(`school-${schoolId}`);
channel.bind('attendance-updated', (data) => {
  // Update UI
});
```

---

### P1-007: Cache Stampede

**Probability:** MEDIUM (55%)
**Impact:** HIGH - Database overload
**Priority:** P1
**Predicted Occurrence:** At high traffic periods (school morning)

#### Scenario
Cache expires for popular data (school announcements). 1000+ users simultaneously request same data, causing 1000+ database queries.

#### Prevention Strategy
```typescript
// src/lib/cache/stale-while-revalidate.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
  allowStale: true, // Return stale data while revalidating
});

export async function getWithStaleCache<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  const cached = cache.get(key) as T | undefined;
  if (cached) {
    // Return stale data, revalidate in background
    fn().then(fresh => cache.set(key, fresh));
    return cached;
  }

  const fresh = await fn();
  cache.set(key, fresh);
  return fresh;
}
```

---

### P1-008: Session Management Overload

**Probability:** MEDIUM (60%)
**Impact:** HIGH - Slow authentication
**Priority:** P1
**Predicted Occurrence:** At ~5,000+ concurrent sessions

#### Scenario
Clerk sessions stored in database. Session verification queries become slow.

#### Prevention Strategy
```typescript
// Use Clerk's JWT verification instead of database queries
import { clerkClient, getAuth } from '@clerk/nextjs/server';

export async function requireAuth() {
  const { userId } = await getAuth(req);
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Verify JWT (fast, no DB query)
  const user = await clerkClient.users.getUser(userId);

  // Fetch from DB only if needed
  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.clerkUserId, userId))
    .limit(1);

  return { user: dbUser[0], userId: dbUser[0].id };
}
```

---

### P1-009: Concurrent Write Conflicts

**Probability:** MEDIUM (45%)
**Impact:** HIGH - Data corruption
**Priority:** P1
**Predicted Occurrence:** At high concurrency (attendance marking)

#### Scenario
Multiple teachers mark attendance for same student simultaneously. Last write wins, data lost.

#### Prevention Strategy
```typescript
// Use optimistic locking with version column
export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name'),
  version: integer('version').notNull().default(1),
});

export async function updateAttendance(
  studentId: string,
  data: AttendanceData
) {
  // Use transaction with version check
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(users)
      .where(eq(users.id, studentId));

    const updated = await tx
      .update(users)
      .set({ ...data, version: current.version + 1 })
      .where(
        and(
          eq(users.id, studentId),
          eq(users.version, current.version) // Version check
        )
      );

    if (updated.rowCount === 0) {
      throw new Error('Conflict: Data modified by another user');
    }

    return updated;
  });
}
```

---

### P1-010: Clerk Authentication Rate Limits

**Probability:** MEDIUM (40%)
**Impact:** HIGH - Authentication fails
**Priority:** P1
**Predicted Occurrence:** At ~1,000+ logins/minute

#### Scenario
Clerk API rate limits exceeded during peak login times (school morning).

#### Prevention Strategy
```typescript
// Cache Clerk user data
const userCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 15, // 15 minutes
});

export async function getCachedUser(clerkUserId: string) {
  const cached = userCache.get(clerkUserId);
  if (cached) return cached;

  const user = await clerkClient.users.getUser(clerkUserId);
  userCache.set(clerkUserId, user);
  return user;
}
```

---

### P1-011: Background Job Failures

**Probability:** MEDIUM (50%)
**Impact:** MEDIUM - Features incomplete
**Priority:** P1
**Predicted Occurrence:** At ~100+ jobs/hour

#### Scenario
Background jobs (email sending, report generation) fail silently. No retry mechanism.

#### Prevention Strategy
```typescript
// Use job queue with retries
import { Queue, Worker } from 'bullmq';

const queue = new Queue('background-jobs', {
  connection: redis,
});

export async function enqueueJob(name: string, data: any) {
  await queue.add(name, data, {
    attempts: 3, // Retry 3 times
    backoff: {
      type: 'exponential',
      delay: 1000, // Start with 1s delay
    },
  });
}

// Worker with error handling
const worker = new Worker('background-jobs', async (job) => {
  try {
    await processJob(job);
  } catch (error) {
    logger.error('Job failed', { jobId: job.id, error });
    throw error; // Triggers retry
  }
});
```

---

### P1-012: Background Job Timeouts

**Probability:** MEDIUM (40%)
**Impact:** MEDIUM - Jobs hang
**Priority:** P1
**Predicted Occurrence:** At large data processing

#### Scenario
Report generation jobs timeout on large datasets (10,000+ students).

#### Prevention Strategy
```typescript
// Add timeout to jobs
await queue.add('generate-report', data, {
  timeout: 300000, // 5 minutes max
});

// Process in chunks
async function generateReport(schoolId: string) {
  const batchSize = 100;
  let offset = 0;
  const results = [];

  while (true) {
    const batch = await db
      .select()
      .from(users)
      .where(eq(users.schoolId, schoolId))
      .limit(batchSize)
      .offset(offset);

    if (batch.length === 0) break;

    results.push(...processBatch(batch));
    offset += batchSize;

    // Yield to prevent blocking
    await new Promise(resolve => setTimeout(resolve, 0));
  }

  return results;
}
```

---

## P2: MEDIUM SEVERITY ERRORS (Performance Degradation)

### P2-001: File Storage Limits

**Probability:** HIGH (80%)
**Impact:** MEDIUM - Cannot upload files
**Priority:** P2
**Predicted Occurrence:** At ~10GB+ storage

#### Prevention Strategy
```typescript
// Use S3/R2 for file storage
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
});

export async function uploadFile(file: File) {
  const key = `uploads/${nanoid()}/${file.name}`;
  await s3.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: key,
    Body: file,
  }));
  return { key, url: `${process.env.R2_PUBLIC_URL}/${key}` };
}
```

---

### P2-002: Notification Queue Backlog

**Probability:** HIGH (70%)
**Impact:** MEDIUM - Delayed notifications
**Priority:** P2
**Predicted Occurrence:** At ~1,000+ notifications/hour

#### Prevention Strategy
```typescript
// Prioritize notifications
await queue.add('send-notification', data, {
  priority: getNotificationPriority(data.type), // 1-10
});

// Scale workers
const workers = Array.from({ length: 5 }, () =>
  new Worker('notifications', processor)
);
```

---

### P2-003: Real-time Updates Bottleneck

**Probability:** MEDIUM (60%)
**Impact:** MEDIUM - Slow updates
**Priority:** P2
**Predicted Occurrence:** At ~1,000+ concurrent listeners

#### Prevention Strategy
```typescript
// Batch real-time updates
const updateBuffer = new Map<string, any[]>();

setInterval(() => {
  for (const [channel, updates] of updateBuffer) {
    pusher.trigger(channel, 'batch-updates', { updates });
  }
  updateBuffer.clear();
}, 1000); // Send batch every second
```

---

### P2-004: Report Generation Timeouts

**Probability:** HIGH (75%)
**Impact:** MEDIUM - Cannot generate reports
**Priority:** P2
**Predicted Occurrence:** At large school reports

#### Prevention Strategy
```typescript
// Use background jobs for reports
export async function generateReport(schoolId: string, reportType: string) {
  const jobId = nanoid();
  await queue.add('generate-report', { schoolId, reportType, jobId });

  return { jobId, statusUrl: `/api/reports/status/${jobId}` };
}
```

---

### P2-005: Data Export Failures

**Probability:** MEDIUM (50%)
**Impact:** MEDIUM - Cannot export data
**Priority:** P2

#### Prevention Strategy
See P0-008 (Memory Exhaustion from Large Data Exports).

---

### P2-006: Slow Pagination on Large Tables

**Probability:** MEDIUM (50%)
**Impact:** MEDIUM - Slow UI
**Priority:** P2

#### Prevention Strategy
```typescript
// Use cursor-based pagination instead of OFFSET
export async function getStudents(cursor?: string, limit = 50) {
  let query = db
    .select()
    .from(users)
    .limit(limit + 1); // Fetch one extra to check if more exist

  if (cursor) {
    query = query.where(gt(users.id, cursor));
  }

  const results = await query;
  const hasMore = results.length > limit;
  const items = results.slice(0, limit);

  return {
    items,
    nextCursor: hasMore ? items[items.length - 1].id : null,
  };
}
```

---

### P2-007: Database Query Plan Changes

**Probability:** LOW (30%)
**Impact:** MEDIUM - Sudden performance degradation
**Priority:** P2

#### Prevention Strategy
```typescript
// Use query hints to force index usage
await db.execute(sql`
  SELECT * FROM users
  WHERE school_id = ${schoolId}
  AND type = 'student'
  -- Force index usage
  AND school_id IS NOT NULL
`);
```

---

### P2-008: Memory Fragmentation

**Probability:** LOW (25%)
**Impact:** MEDIUM - Gradual slowdown
**Priority:** P2

#### Prevention Strategy
```typescript
// Implement periodic cleanup
setInterval(() => {
  if (global.gc) {
    global.gc();
  }
}, 60000); // Every minute
```

---

### P2-009: DNS Resolution Delays

**Probability:** LOW (20%)
**Impact:** MEDIUM - Slow API calls
**Priority:** P2

#### Prevention Strategy
```typescript
// Use connection pooling and keep-alive
import { HttpsAgent } from 'agentkeepalive';

const agent = new HttpsAgent({
  keepAlive: true,
  maxSockets: 100,
  maxFreeSockets: 10,
});

// Use with fetch
await fetch(url, { agent });
```

---

### P2-010: Log Storage Overflow

**Probability:** MEDIUM (40%)
**Impact:** MEDIUM - Cannot store logs
**Priority:** P2

#### Prevention Strategy
```typescript
// Implement log rotation
import winston from 'winston';

const logger = winston.createLogger({
  transports: [
    new winston.transports.File({
      filename: 'logs/app.log',
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 10, // Keep 10 files
    }),
  ],
});
```

---

## Detection & Monitoring

### Critical Metrics to Monitor

1. **Database Metrics**
   - Active connections
   - Query duration (p50, p95, p99)
   - Connection pool wait time
   - Index usage ratio

2. **API Metrics**
   - Request rate
   - Response time
   - Error rate
   - Rate limit violations

3. **Memory Metrics**
   - Heap used vs total
   - Memory growth rate
   - GC frequency
   - Function memory usage

4. **Business Metrics**
   - Active users
   - Concurrent sessions
   - Report generation time
   - Export size/duration

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| DB Connections | >80% pool | >95% pool |
| Query Duration | >3s | >10s |
| Memory Usage | >80% | >95% |
| Error Rate | >5% | >10% |
| Response Time | >2s (p95) | >5s (p95) |

---

## Implementation Priority

### Phase 1 (Before 500 Schools)
- P0-001: Database Connection Pool
- P0-006: Database Indexes
- P0-007: Cross-tenant Data Leaks
- P0-005: Vercel Function Limits
- P1-001: N+1 Query Fixes (already done)

### Phase 2 (Before 1000 Schools)
- P0-002: Query Timeouts
- P0-004: Search Performance
- P1-004: API Rate Limiting
- P1-006: WebSocket/Real-time

### Phase 3 (Before 2000 Schools)
- P0-003: Memory Leaks
- P1-008: Session Management
- P2-001: File Storage
- P2-004: Report Generation

---

## Related Documentation

- [docs/query-optimizations.md](query-optimizations.md) - N+1 query fixes
- [docs/ERRORS_AND_FIXES.md](ERRORS_AND_FIXES.md) - Error fixes
- [docs/memory/database-patterns.md](memory/database-patterns.md) - Database patterns
- [docs/PRODUCTION_ERROR_LOG.md](PRODUCTION_ERROR_LOG.md) - Production errors

---

**END OF SCALABILITY ERROR PREDICTION**

*Last Updated: March 2, 2026*
*Next Review: April 2, 2026*
*Maintainer: Documentation Specialist Agent*
