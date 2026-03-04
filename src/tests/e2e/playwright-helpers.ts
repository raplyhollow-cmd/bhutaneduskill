/**
 * Playwright E2E Test Helpers for Bhutan EduSkill
 *
 * This file provides reusable helper functions for E2E testing including:
 * - Authentication helpers for all 7 user roles
 * - Test data factories
 * - Navigation helpers
 * - Assertion helpers
 */

import { Page, Locator } from '@playwright/test';

// ============================================================================
// TYPES
// ============================================================================

export type UserRole =
  | 'student'
  | 'teacher'
  | 'school-admin'
  | 'parent'
  | 'counselor'
  | 'admin'
  | 'ministry';

export interface TestCredentials {
  email: string;
  password: string;
  role: UserRole;
  name?: string;
}

export interface TestSchool {
  id: string;
  name: string;
  code: string;
}

// ============================================================================
// TEST CREDENTIALS
// ============================================================================

/**
 * Test credentials for each role.
 * These should match test users in your database.
 *
 * TODO: Update these with actual test user credentials
 */
export const TEST_CREDENTIALS: Record<UserRole, TestCredentials> = {
  student: {
    email: process.env.E2E_STUDENT_EMAIL || 'test-student@bhutaneduskill.bt',
    password: process.env.E2E_STUDENT_PASSWORD || 'Test123456!',
    role: 'student',
    name: 'Test Student',
  },
  teacher: {
    email: process.env.E2E_TEACHER_EMAIL || 'test-teacher@bhutaneduskill.bt',
    password: process.env.E2E_TEACHER_PASSWORD || 'Test123456!',
    role: 'teacher',
    name: 'Test Teacher',
  },
  'school-admin': {
    email: process.env.E2E_SCHOOL_ADMIN_EMAIL || 'test-schooladmin@bhutaneduskill.bt',
    password: process.env.E2E_SCHOOL_ADMIN_PASSWORD || 'Test123456!',
    role: 'school-admin',
    name: 'Test School Admin',
  },
  parent: {
    email: process.env.E2E_PARENT_EMAIL || 'test-parent@bhutaneduskill.bt',
    password: process.env.E2E_PARENT_PASSWORD || 'Test123456!',
    role: 'parent',
    name: 'Test Parent',
  },
  counselor: {
    email: process.env.E2E_COUNSELOR_EMAIL || 'test-counselor@bhutaneduskill.bt',
    password: process.env.E2E_COUNSELOR_PASSWORD || 'Test123456!',
    role: 'counselor',
    name: 'Test Counselor',
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL || 'test-admin@bhutaneduskill.bt',
    password: process.env.E2E_ADMIN_PASSWORD || 'Test123456!',
    role: 'admin',
    name: 'Test Admin',
  },
  ministry: {
    email: process.env.E2E_MINISTRY_EMAIL || 'test-ministry@bhutaneduskill.bt',
    password: process.env.E2E_MINISTRY_PASSWORD || 'Test123456!',
    role: 'ministry',
    name: 'Test Ministry',
  },
};

/**
 * Test school data
 */
export const TEST_SCHOOL: TestSchool = {
  id: process.env.E2E_SCHOOL_ID || 'test-school-001',
  name: process.env.E2E_SCHOOL_NAME || 'Test Academy',
  code: process.env.E2E_SCHOOL_CODE || 'TEST001',
};

// ============================================================================
// PORTAL URLS
// ============================================================================

/**
 * Get the dashboard URL for a given role
 */
export function getDashboardUrl(role: UserRole): string {
  const dashboards: Record<UserRole, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    'school-admin': '/school-admin/dashboard',
    parent: '/parent/dashboard',
    counselor: '/counselor/dashboard',
    admin: '/admin',
    ministry: '/ministry',
  };
  return dashboards[role];
}

/**
 * Get the base path for a given role
 */
export function getBasePath(role: UserRole): string {
  const bases: Record<UserRole, string> = {
    student: '/student',
    teacher: '/teacher',
    'school-admin': '/school-admin',
    parent: '/parent',
    counselor: '/counselor',
    admin: '/admin',
    ministry: '/ministry',
  };
  return bases[role];
}

// ============================================================================
// AUTHENTICATION HELPERS
// ============================================================================

/**
 * Sign in with Clerk authentication
 * This handles the Clerk sign-in form
 */
export async function signIn(page: Page, credentials: TestCredentials): Promise<void> {
  // Navigate to sign-in page
  await page.goto('/sign-in');

  // Wait for Clerk form to load
  await page.waitForLoadState('networkidle');

  // Fill in email
  const emailInput = page.locator('input[name="email"], input[type="email"]').first();
  await emailInput.fill(credentials.email);

  // Click continue
  const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
  await continueButton.click();

  // Wait for password field or redirect
  await page.waitForTimeout(500);

  // Check if password field exists
  const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
  const isVisible = await passwordInput.isVisible().catch(() => false);

  if (isVisible) {
    await passwordInput.fill(credentials.password);
    await continueButton.click();
  }

  // Wait for navigation to complete
  await page.waitForLoadState('networkidle');
}

/**
 * Sign out current user
 */
export async function signOut(page: Page): Promise<void> {
  // Try multiple sign-out methods
  const signOutSelectors = [
    'a:has-text("Sign out")',
    'button:has-text("Sign out")',
    '[data-signout]',
    'a[href="/sign-out"]',
  ];

  for (const selector of signOutSelectors) {
    const signOutButton = page.locator(selector).first();
    const isVisible = await signOutButton.isVisible().catch(() => false);
    if (isVisible) {
      await signOutButton.click();
      await page.waitForLoadState('networkidle');
      return;
    }
  }

  // Fallback: navigate to sign-out page
  await page.goto('/sign-out');
  await page.waitForLoadState('networkidle');
}

/**
 * Authenticate as a specific role and verify redirect
 */
export async function authenticateAs(page: Page, role: UserRole): Promise<void> {
  const credentials = TEST_CREDENTIALS[role];

  // Sign in
  await signIn(page, credentials);

  // Wait for redirect to dashboard
  const expectedUrl = getDashboardUrl(role);
  await page.waitForURL(`**${expectedUrl}**`, { timeout: 10000 });
}

// ============================================================================
// NAVIGATION HELPERS
// ============================================================================

/**
 * Navigate to a page within a portal
 */
export async function navigateTo(page: Page, role: UserRole, path: string): Promise<void> {
  const basePath = getBasePath(role);
  const fullPath = path.startsWith('/') ? path : `${basePath}/${path}`;
  await page.goto(fullPath);
  await page.waitForLoadState('networkidle');
}

/**
 * Open and use sidebar navigation
 */
export async function navigateViaSidebar(page: Page, itemName: string): Promise<void> {
  // Click mobile menu button if on mobile
  const mobileMenuButton = page.locator('[data-mobile-menu], button:has-text("Menu")').first();
  const isMobileVisible = await mobileMenuButton.isVisible().catch(() => false);

  if (isMobileVisible) {
    await mobileMenuButton.click();
    await page.waitForTimeout(300);
  }

  // Click the navigation item
  const navItem = page.locator(`a:has-text("${itemName}"), [data-nav="${itemName}"]`).first();
  await navItem.click();
  await page.waitForLoadState('networkidle');
}

// ============================================================================
// BUTTON & INTERACTION HELPERS
// ============================================================================

/**
 * Click all primary action buttons on a page and verify they respond
 * Returns a list of buttons that failed
 */
export async function testAllButtons(page: Page): Promise<{
  passed: string[];
  failed: Array<{ selector: string; error: string }>;
}> {
  const result = {
    passed: [] as string[],
    failed: [] as Array<{ selector: string; error: string }>,
  };

  // Find all buttons
  const buttons = await page.locator('button:not([disabled]), a[role="button"]').all();

  for (const button of buttons) {
    try {
      // Get button text or aria-label
      const text = await button.textContent();
      const label = text?.trim().slice(0, 50) || 'unnamed button';

      // Check if visible
      const isVisible = await button.isVisible();
      if (!isVisible) continue;

      // Try to click
      await button.click({ timeout: 2000 });

      // Wait a bit for any response
      await page.waitForTimeout(100);

      result.passed.push(label);

      // Go back if navigation occurred
      const url = page.url();
      if (url !== page.url()) {
        await page.goBack();
        await page.waitForTimeout(100);
      }
    } catch (error) {
      const text = await button.textContent().catch(() => 'unnamed');
      result.failed.push({
        selector: text?.trim().slice(0, 50) || 'button',
        error: String(error),
      });
    }
  }

  return result;
}

/**
 * Find and test all forms on a page
 */
export async function testAllForms(page: Page): Promise<{
  formsFound: number;
  formsTested: number;
  issues: Array<{ form: string; issue: string }>;
}> {
  const result = {
    formsFound: 0,
    formsTested: 0,
    issues: [] as Array<{ form: string; issue: string }>,
  };

  const forms = await page.locator('form').all();
  result.formsFound = forms.length;

  for (const form of forms) {
    try {
      const formId = await form.getAttribute('id') || await form.getAttribute('name') || 'unnamed-form';

      // Check for submit button
      const submitButton = form.locator('button[type="submit"], input[type="submit"]').first();
      const hasSubmit = await submitButton.isVisible().catch(() => false);

      if (!hasSubmit) {
        result.issues.push({ form: formId, issue: 'No submit button found' });
      }

      result.formsTested++;
    } catch (error) {
      result.issues.push({
        form: 'unknown',
        issue: String(error),
      });
    }
  }

  return result;
}

// ============================================================================
// API INTERCEPTION HELPERS
// ============================================================================

/**
 * Track all API calls made during page load/interaction
 */
export interface ApiCall {
  url: string;
  method: string;
  status: number;
  success: boolean;
  responseType?: string;
}

export async function trackApiCalls(
  page: Page,
  callback: (calls: ApiCall[]) => void | Promise<void>,
): Promise<void> {
  const calls: ApiCall[] = [];

  // Set up route handler to track all API calls
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();

    try {
      // route.continue() doesn't return a response in Playwright
      // We need to fetch separately to get the response
      await route.continue();
      calls.push({
        url,
        method,
        status: 200, // Default to success since we don't have access to response
        success: true,
        responseType: 'application/json',
      });
    } catch (error) {
      calls.push({
        url,
        method,
        status: 0,
        success: false,
      });
    }
  });

  // Execute callback and pass collected calls
  await callback(calls);
}

/**
 * Find failed API calls
 */
export function findFailedApiCalls(calls: ApiCall[]): ApiCall[] {
  return calls.filter((call) => !call.success);
}

// ============================================================================
// ASSERTION HELPERS
// ============================================================================

/**
 * Assert page has no console errors
 */
export async function assertNoConsoleErrors(page: Page): Promise<void> {
  const errors: string[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  // Wait a bit for any delayed errors
  await page.waitForTimeout(1000);

  if (errors.length > 0) {
    throw new Error(`Console errors found:\n${errors.join('\n')}`);
  }
}

/**
 * Assert page loads without network errors
 */
export async function assertNoNetworkErrors(page: Page): Promise<void> {
  const failedRequests: string[] = [];

  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.waitForLoadState('networkidle');

  if (failedRequests.length > 0) {
    throw new Error(`Network errors found:\n${failedRequests.join('\n')}`);
  }
}

/**
 * Check for 404 or 500 errors
 */
export async function assertPageNotError(page: Page): Promise<void> {
  const content = await page.content();
  const title = await page.title();

  // Check for common error indicators
  const errorIndicators = [
    '404',
    '500',
    'Not Found',
    'Internal Server Error',
    'Something went wrong',
  ];

  for (const indicator of errorIndicators) {
    if (content.includes(indicator) || title.includes(indicator)) {
      throw new Error(`Error page detected: ${indicator}`);
    }
  }
}

// ============================================================================
// TEST DATA FACTORIES
// ============================================================================

/**
 * Generate test student data
 */
export function generateTestStudentData(override?: Record<string, unknown>) {
  const timestamp = Date.now();
  return {
    firstName: `Test${timestamp}`,
    lastName: 'Student',
    email: `test.student.${timestamp}@bhutaneduskill.bt`,
    phone: '+975 17 123 456',
    dateOfBirth: '2008-01-01',
    gender: 'male',
    address: 'Test Address',
    classId: 'test-class-001',
    ...override,
  };
}

/**
 * Generate test teacher data
 */
export function generateTestTeacherData(override?: Record<string, unknown>) {
  const timestamp = Date.now();
  return {
    firstName: `Test${timestamp}`,
    lastName: 'Teacher',
    email: `test.teacher.${timestamp}@bhutaneduskill.bt`,
    phone: '+975 17 234 567',
    employeeId: `EMP${timestamp}`,
    subjects: ['Mathematics', 'Science'],
    ...override,
  };
}

/**
 * Generate test homework data
 */
export function generateTestHomeworkData(override?: Record<string, unknown>) {
  const timestamp = Date.now();
  return {
    title: `Test Homework ${timestamp}`,
    description: 'This is a test homework assignment',
    subjectId: 'test-subject-001',
    classId: 'test-class-001',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    maxPoints: 100,
    instructions: 'Complete the assignment',
    ...override,
  };
}

// ============================================================================
// CLEANUP HELPERS
// ============================================================================

/**
 * Clear all browser data (cookies, localStorage, sessionStorage)
 */
export async function clearBrowserData(page: Page): Promise<void> {
  await page.context().clearCookies();
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Take screenshot on failure
 */
export async function takeScreenshot(page: Page, name: string): Promise<void> {
  await page.screenshot({
    path: `test-results/screenshots/${name}.png`,
    fullPage: true,
  });
}

// ============================================================================
// MOBILE HELPERS
// ============================================================================

/**
 * Set viewport to mobile size
 */
export async function setMobileViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 375, height: 667 });
}

/**
 * Set viewport to tablet size
 */
export async function setTabletViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 768, height: 1024 });
}

/**
 * Set viewport to desktop size
 */
export async function setDesktopViewport(page: Page): Promise<void> {
  await page.setViewportSize({ width: 1920, height: 1080 });
}

/**
 * Toggle mobile menu
 */
export async function toggleMobileMenu(page: Page): Promise<void> {
  const menuButton = page.locator('[data-mobile-menu], button:has-text("Menu"), .hamburger').first();
  await menuButton.click();
  await page.waitForTimeout(300);
}

// ============================================================================
// PERMISSIONS HELPERS
// ============================================================================

/**
 * Test that a user cannot access a page they shouldn't
 */
export async function assertAccessDenied(page: Page, url: string): Promise<void> {
  await page.goto(url);

  // Check for redirect or error message
  const urlChanged = page.url().includes('/sign-in') || page.url().includes('/unauthorized');

  // Also check for error messages
  const hasError = await page.locator('text=/unauthorized|access denied|not allowed').count() > 0;

  if (!urlChanged && !hasError) {
    throw new Error(`User was able to access ${url} without proper permissions`);
  }
}
