/**
 * Playwright Database Fixture for Bhutan EduSkill
 *
 * Provides database utilities for E2E testing including:
 * - Test data seeding
 * - Database cleanup
 * - Test data factories
 *
 * Note: This is a lightweight fixture. For direct database access in tests,
 * consider creating a dedicated API endpoint or using server-side test utilities.
 */

import { test as base } from '@playwright/test';

// ============================================================================
// TYPES
// ============================================================================

export interface TestData {
  school?: {
    id: string;
    name: string;
    code: string;
  };
  student?: {
    id: string;
    email: string;
    name: string;
  };
  teacher?: {
    id: string;
    email: string;
    name: string;
  };
}

// ============================================================================
// DATABASE FIXTURE
// ============================================================================

export const dbTest = base.extend<{
  seedTestData: () => Promise<TestData>;
  cleanupTestData: (data: TestData) => Promise<void>;
  createTestSchool: () => Promise<{ id: string; name: string; code: string }>;
  createTestStudent: (schoolId: string) => Promise<{ id: string; email: string; name: string }>;
  createTestTeacher: (schoolId: string) => Promise<{ id: string; email: string; name: string }>;
}>({
  // Seed all test data at once
  seedTestData: async ({ }, use) => {
    const seedTestData = async (): Promise<TestData> => {
      // For now, return mock data
      // In production, this would call a test API endpoint to create real test data
      return {
        school: {
          id: process.env.E2E_SCHOOL_ID || 'test-school-001',
          name: process.env.E2E_SCHOOL_NAME || 'Test Academy',
          code: process.env.E2E_SCHOOL_CODE || 'TEST001',
        },
        student: {
          id: 'test-student-001',
          email: process.env.E2E_STUDENT_EMAIL || 'test-student@bhutaneduskill.bt',
          name: 'Test Student',
        },
        teacher: {
          id: 'test-teacher-001',
          email: process.env.E2E_TEACHER_EMAIL || 'test-teacher@bhutaneduskill.bt',
          name: 'Test Teacher',
        },
      };
    };

    await use(seedTestData);
  },

  // Cleanup test data
  cleanupTestData: async ({ }, use) => {
    const cleanupTestData = async (data: TestData): Promise<void> => {
      // For now, this is a no-op
      // In production, this would call a test API endpoint to clean up test data

      console.log('Cleanup test data (no-op):', data);
    };

    await use(cleanupTestData);
  },

  // Create a test school
  createTestSchool: async ({ }, use) => {
    const createTestSchool = async () => {
      const timestamp = Date.now();
      return {
        id: `test-school-${timestamp}`,
        name: `Test School ${timestamp}`,
        code: `TEST${timestamp.toString().slice(-6)}`,
      };
    };

    await use(createTestSchool);
  },

  // Create a test student
  createTestStudent: async ({ }, use) => {
    const createTestStudent = async (schoolId: string) => {
      const timestamp = Date.now();
      return {
        id: `test-student-${timestamp}`,
        email: `test.student.${timestamp}@bhutaneduskill.bt`,
        name: `Test Student ${timestamp}`,
      };
    };

    await use(createTestStudent);
  },

  // Create a test teacher
  createTestTeacher: async ({ }, use) => {
    const createTestTeacher = async (schoolId: string) => {
      const timestamp = Date.now();
      return {
        id: `test-teacher-${timestamp}`,
        email: `test.teacher.${timestamp}@bhutaneduskill.bt`,
        name: `Test Teacher ${timestamp}`,
      };
    };

    await use(createTestTeacher);
  },
});

// ============================================================================
// EXPORT EXPECT
// ============================================================================

export { expect } from '@playwright/test';
export default dbTest;

// ============================================================================
// ALTERNATIVE: API-BASED DATABASE HELPERS
// ============================================================================

/**
 * For tests that need direct database access, create test API endpoints.
 *
 * Example: Create `src/app/api/test/db/route.ts`:
 *
 * ```ts
 * import { NextRequest, NextResponse } from 'next/server';
 * import { db } from '@/lib/db';
 * import { schools, students, teachers } from '@/lib/db/schema';
 * import { eq } from 'drizzle-orm';
 *
 * // Only allow in test environment
 * if (process.env.NODE_ENV !== 'test') {
 *   return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
 * }
 *
 * export async function POST(request: NextRequest) {
 *   const { action, data } = await request.json();
 *
 *   switch (action) {
 *     case 'createSchool':
 *       const [school] = await db.insert(schools).values(data).returning();
 *       return NextResponse.json(school);
 *
 *     case 'createStudent':
 *       const [student] = await db.insert(students).values(data).returning();
 *       return NextResponse.json(student);
 *
 *     case 'cleanupSchool':
 *       await db.delete(schools).where(eq(schools.id, data.schoolId));
 *       return NextResponse.json({ success: true });
 *
 *     default:
 *       return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
 *   }
 * }
 * ```
 *
 * Then use in tests:
 * ```ts
 * const response = await page.request.post('/api/test/db', {
 *   data: {
 *     action: 'createSchool',
 *     data: { name: 'Test School', code: 'TEST001' }
 *   }
 * });
 * const school = await response.json();
 * ```
 */
