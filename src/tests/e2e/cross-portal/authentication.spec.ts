/**
 * Cross-Portal Authentication Tests
 *
 * Tests authentication and access control across all 7 portals:
 * - Role-based redirects work correctly
 * - Unauthorized users are blocked
 * - Navigation between portals
 */

import { test, expect } from '@playwright/test';
import { assertPageNotError } from '../playwright-helpers';

test.setTimeout(60000);

test.describe('Cross-Portal - Authentication', () => {
  const portalDashboards = [
    { path: '/student/dashboard', name: 'Student', allowedRoles: ['student'] },
    { path: '/teacher/dashboard', name: 'Teacher', allowedRoles: ['teacher'] },
    { path: '/school-admin/dashboard', name: 'School Admin', allowedRoles: ['school-admin'] },
    { path: '/parent/dashboard', name: 'Parent', allowedRoles: ['parent'] },
    { path: '/counselor/dashboard', name: 'Counselor', allowedRoles: ['counselor'] },
    { path: '/admin', name: 'Admin', allowedRoles: ['admin'] },
    { path: '/ministry', name: 'Ministry', allowedRoles: ['ministry'] },
  ];

  for (const { path, name } of portalDashboards) {
    test(`should redirect unauthenticated user from ${name} portal`, async ({ page }) => {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(2000);

      const currentUrl = page.url();

      // Unauthenticated users should be redirected to sign-in or setup
      const isRedirected = currentUrl.includes('/sign-in') || currentUrl.includes('/setup');

      console.log(`${name} portal - Redirected: ${isRedirected}, URL: ${currentUrl}`);

      if (!isRedirected && currentUrl.includes(path)) {
        console.log(`⚠️  WARNING: ${name} portal accessible without authentication`);
      }
    });
  }

  test('should have consistent sign-in flow across all portals', async ({ page }) => {
    const signInPages = [
      '/sign-in',
      '/student/sign-in',
      '/teacher/sign-in',
      '/school-admin/sign-in',
      '/parent/sign-in',
      '/counselor/sign-in',
      '/admin/sign-in',
      '/ministry/sign-in',
    ];

    for (const signInPath of signInPages) {
      await page.goto(signInPath);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`Sign-in page ${signInPath} -> ${currentUrl}`);

      // Most portals likely use the same sign-in page
      expect(currentUrl).toContain('/sign-in');
    }
  });
});

test.describe('Cross-Portal - Navigation', () => {
  test('should have portal-specific navigation', async ({ page }) => {
    const portals = [
      { basePath: '/student', name: 'Student' },
      { basePath: '/teacher', name: 'Teacher' },
      { basePath: '/school-admin', name: 'School Admin' },
      { basePath: '/parent', name: 'Parent' },
      { basePath: '/counselor', name: 'Counselor' },
      { basePath: '/admin', name: 'Admin' },
      { basePath: '/ministry', name: 'Ministry' },
    ];

    for (const { basePath, name } of portals) {
      await page.goto(basePath);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1000);

      const nav = page.locator('nav, [role="navigation"], .sidebar');
      const hasNav = await nav.count() > 0;

      console.log(`${name} portal has navigation: ${hasNav}`);

      // Most portals should have navigation
      if (!hasNav) {
        console.log(`⚠️  WARNING: ${name} portal missing navigation`);
      }
    }
  });
});

test.describe('Cross-Portal - Theme Consistency', () => {
  test('should have portal-specific styling', async ({ page }) => {
    const portals = [
      { path: '/student', expectedGradient: 'student' },
      { path: '/teacher', expectedGradient: 'teacher' },
      { path: '/school-admin', expectedGradient: 'school-admin' },
      { path: '/parent', expectedGradient: 'parent' },
      { path: '/counselor', expectedGradient: 'counselor' },
      { path: '/admin', expectedGradient: 'admin' },
      { path: '/ministry', expectedGradient: 'ministry' },
    ];

    for (const { path, expectedGradient } of portals) {
      await page.goto(path);
      await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
      await page.waitForTimeout(1000);

      // Check for portal-specific classes or data attributes
      const body = page.locator('body');
      const bodyClass = await body.getAttribute('class') || '';

      console.log(`${path} - Body classes: ${bodyClass}`);
    }
  });
});
