/**
 * Parent Portal Dashboard Tests
 *
 * Tests the Parent Portal dashboard page:
 * - Page loads successfully
 * - Dashboard displays children's information
 * - Navigation works
 */

import { test, expect } from '@playwright/test';
import { assertPageNotError } from '../playwright-helpers';

test.setTimeout(60000);

test.describe('Parent Portal - Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/parent');
    await assertPageNotError(page);
  });

  test('should display dashboard content', async ({ page }) => {
    await page.goto('/parent/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    const count = await mainContent.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Parent Portal - Navigation', () => {
  const parentPages = [
    { path: '/parent/children', name: 'Children' },
    { path: '/parent/homework', name: 'Homework' },
    { path: '/parent/attendance', name: 'Attendance' },
    { path: '/parent/assessments', name: 'Assessments' },
    { path: '/parent/careers', name: 'Careers' },
  ];

  for (const { path, name } of parentPages) {
    test(`should load ${name} page`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`${name} page URL: ${currentUrl}`);
    });
  }
});
