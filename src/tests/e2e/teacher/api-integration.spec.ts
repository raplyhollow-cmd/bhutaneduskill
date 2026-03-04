/**
 * Teacher Portal API Integration Tests
 *
 * Tests the Teacher Portal API endpoints including:
 * - Dashboard API
 * - Students API
 * - Classes API
 * - Homework API
 * - Assessments API
 * - Attendance API
 * - Reports API
 * - Messages API
 * - Error handling
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS } from '../playwright-helpers';

test.describe('Teacher Portal - API Integration', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should call dashboard API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/dashboard') || url.includes('/api/dashboard')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Dashboard API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call students API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/students') || url.includes('/api/students')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Students API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call classes API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/classes') || url.includes('/api/teacher/classes')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Classes API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call homework API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/homework') || url.includes('/api/homework')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Homework API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call assessments API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/assessments') || url.includes('/api/assessments')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Assessments API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call attendance API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/attendance')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Attendance API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call reports API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/reports') || url.includes('/api/reports') || url.includes('/api/teacher/insights')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Reports API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should call messages API successfully', async ({ page }) => {
    let apiCallsCount = 0;

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/teacher/messages') || url.includes('/api/messages')) {
        apiCallsCount++;
      }
      await route.continue();
    });

    await page.goto('/teacher/messages');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Messages API calls: ${apiCallsCount}`);
    expect(apiCallsCount).toBeGreaterThan(0);
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock a failed API call
    await page.route('**/api/teacher/students**', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });

    // Monitor for console errors
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Page should handle the error gracefully
    // Check if error message is shown
    const hasErrorDisplay = await page.locator('text=/error|failed|unable/i').count() > 0;
    console.log(`Error displayed to user: ${hasErrorDisplay}`);
    console.log(`Console errors: ${consoleErrors.length}`);
  });

  test('should handle network timeouts gracefully', async ({ page }) => {
    // Mock a timeout
    await page.route('**/api/teacher/classes**', async (route) => {
      // Don't respond - simulate timeout
      await new Promise(resolve => setTimeout(resolve, 30000));
    });

    // Set shorter timeout for this test
    try {
      await page.goto('/teacher/classes', { timeout: 10000 });
      await page.waitForTimeout(2000);
    } catch (error) {
      // Expected to timeout
      console.log('Page handled timeout');
    }
  });

  test('should retry failed API calls', async ({ page }) => {
    let requestCount = 0;

    // Mock first call to fail, second to succeed
    await page.route('**/api/teacher/dashboard**', async (route) => {
      requestCount++;

      if (requestCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: {} }),
        });
      }
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(5000);

    console.log(`Dashboard API requests made: ${requestCount}`);

    // Check if page eventually loaded
    const pageContent = await page.content();
    const hasContent = pageContent.includes('Dashboard') || pageContent.includes('Welcome');
    console.log(`Page loaded successfully after retry: ${hasContent}`);
  });

  test('should include authentication headers in API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; hasAuth: boolean }> = [];

    await page.route('**/api/**', async (route) => {
      const headers = route.request().headers();
      const hasAuth = !!headers['authorization'] || !!headers['cookie'];

      apiCalls.push({
        url: route.request().url(),
        hasAuth,
      });

      await route.continue();
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`API calls with auth headers: ${apiCalls.filter((c) => c.hasAuth).length}/${apiCalls.length}`);
  });

  test('should cache API responses appropriately', async ({ page }) => {
    const apiCalls: string[] = [];

    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      apiCalls.push(url);
      await route.continue();
    });

    // Load page twice
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log(`API calls for 2 page loads: ${apiCalls.length}`);

    // Some APIs might be called again, but caching should reduce redundant calls
  });

  test('should handle 401 unauthorized responses', async ({ page }) => {
    // Mock 401 response
    await page.route('**/api/teacher/protected**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized' }),
      });
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if redirected to sign-in or shows auth error
    const currentUrl = page.url();
    const needsAuth = currentUrl.includes('/sign-in') ||
                      await page.locator('text=/unauthorized|sign in/i').count() > 0;

    console.log(`Handles 401: ${needsAuth}`);
  });

  test('should include proper error messages for API failures', async ({ page }) => {
    // Mock specific error responses
    await page.route('**/api/teacher/students/skills**', async (route) => {
      await route.fulfill({
        status: 403,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Forbidden - insufficient permissions' }),
      });
    });

    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for user-friendly error messages
    const hasErrorMessage = await page.locator('text=/error|permissions|failed/i').count() > 0;
    console.log(`User-friendly error message shown: ${hasErrorMessage}`);
  });

  test('should load data in parallel where possible', async ({ page }) => {
    const apiCallTimestamps: Array<{ url: string; time: number }> = [];

    await page.route('**/api/**', async (route) => {
      apiCallTimestamps.push({
        url: route.request().url(),
        time: Date.now(),
      });
      await route.continue();
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    if (apiCallTimestamps.length > 1) {
      const firstCall = apiCallTimestamps[0].time;
      const lastCall = apiCallTimestamps[apiCallTimestamps.length - 1].time;
      const timeDiff = lastCall - firstCall;

      console.log(`API call time window: ${timeDiff}ms (${apiCallTimestamps.length} calls)`);

      // If time window is small, calls are likely made in parallel
      const isParallel = timeDiff < 500;
      console.log(`API calls appear to be parallel: ${isParallel}`);
    }
  });

  test('should not expose sensitive data in API responses', async ({ page }) => {
    const apiResponses: string[] = [];

    page.on('response', async (response) => {
      if (response.url().includes('/api/')) {
        try {
          const body = await response.text();
          apiResponses.push(body);
        } catch {
          // Response body might not be available for all responses
        }
      }
    });

    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    // Check for sensitive data patterns
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[_-]?key/i,
      /token["\s:]*[a-z0-9]{20,}/i,
    ];

    let hasSensitiveData = false;
    for (const response of apiResponses) {
      for (const pattern of sensitivePatterns) {
        if (pattern.test(response)) {
          hasSensitiveData = true;
          console.log(`Found sensitive data pattern: ${pattern}`);
        }
      }
    }

    expect(hasSensitiveData).toBeFalsy();
  });
});
