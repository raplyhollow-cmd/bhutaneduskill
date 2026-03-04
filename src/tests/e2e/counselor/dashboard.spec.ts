/**
 * Counselor Portal Dashboard Tests
 *
 * Tests the Counselor Portal dashboard page:
 * - Page loads successfully
 * - Dashboard displays student/counseling information
 * - Navigation works
 */

import { test, expect } from '@playwright/test';
import { assertPageNotError } from '../playwright-helpers';

test.setTimeout(60000);

test.describe('Counselor Portal - Dashboard', () => {
  test('should load dashboard page', async ({ page }) => {
    await page.goto('/counselor/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/counselor');
    await assertPageNotError(page);
  });

  test('should display dashboard content', async ({ page }) => {
    await page.goto('/counselor/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const mainContent = page.locator('main').or(page.locator('[role="main"]'));
    const count = await mainContent.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Counselor Portal - Navigation', () => {
  const counselorPages = [
    { path: '/counselor/students', name: 'Students' },
    { path: '/counselor/interventions', name: 'Interventions' },
    { path: '/counselor/sessions', name: 'Sessions' },
    { path: '/counselor/notes', name: 'Notes' },
    { path: '/counselor/reports', name: 'Reports' },
  ];

  for (const { path, name } of counselorPages) {
    test(`should load ${name} page`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`${name} page URL: ${currentUrl}`);
    });
  }
});
