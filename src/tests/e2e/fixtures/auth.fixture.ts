/**
 * Playwright Auth Fixtures for Bhutan EduSkill
 *
 * Provides authenticated page contexts for all 7 user roles.
 * Use these fixtures in tests to start with an already-authenticated session.
 */

import { test as base, Page } from '@playwright/test';
import { authenticateAs, clearBrowserData, TEST_CREDENTIALS, type UserRole } from '../playwright-helpers';

// ============================================================================
// AUTHENTICATED PAGE FIXTURE TYPES
// ============================================================================

interface AuthenticatedPageFixture {
  page: Page;
  role: UserRole;
}

// ============================================================================
// ROLE-SPECIFIC FIXTURES
// ============================================================================

/**
 * Student Portal Fixture
 * Automatically authenticates as a student user
 */
export const test = base.extend<{
  authenticatedStudent: Page;
  authenticatedTeacher: Page;
  authenticatedSchoolAdmin: Page;
  authenticatedParent: Page;
  authenticatedCounselor: Page;
  authenticatedAdmin: Page;
  authenticatedMinistry: Page;
}>({
  // Student fixture
  authenticatedStudent: async ({ page, context }, use) => {
    await authenticateAs(page, 'student');
    await use(page);
    await clearBrowserData(page);
  },

  // Teacher fixture
  authenticatedTeacher: async ({ page, context }, use) => {
    await authenticateAs(page, 'teacher');
    await use(page);
    await clearBrowserData(page);
  },

  // School Admin fixture
  authenticatedSchoolAdmin: async ({ page, context }, use) => {
    await authenticateAs(page, 'school-admin');
    await use(page);
    await clearBrowserData(page);
  },

  // Parent fixture
  authenticatedParent: async ({ page, context }, use) => {
    await authenticateAs(page, 'parent');
    await use(page);
    await clearBrowserData(page);
  },

  // Counselor fixture
  authenticatedCounselor: async ({ page, context }, use) => {
    await authenticateAs(page, 'counselor');
    await use(page);
    await clearBrowserData(page);
  },

  // Admin fixture
  authenticatedAdmin: async ({ page, context }, use) => {
    await authenticateAs(page, 'admin');
    await use(page);
    await clearBrowserData(page);
  },

  // Ministry fixture
  authenticatedMinistry: async ({ page, context }, use) => {
    await authenticateAs(page, 'ministry');
    await use(page);
    await clearBrowserData(page);
  },
});

// ============================================================================
// EXPORT EXPECT FOR ASSERTIONS
// ============================================================================

export { expect } from '@playwright/test';
export default test;
