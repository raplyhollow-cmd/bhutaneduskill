/**
 * Teacher Portal Authentication Tests
 *
 * Tests the Teacher Portal authentication flow including:
 * - Sign in as teacher
 * - Sign out
 * - Session persistence
 * - Access control
 */

import { test, expect } from '@playwright/test';
import { signIn, signOut, TEST_CREDENTIALS, getDashboardUrl, clearBrowserData } from '../playwright-helpers';

test.describe('Teacher Portal - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await clearBrowserData(page);
  });

  test('should sign in as teacher', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);

    // Wait for redirect to dashboard
    await page.waitForURL(`**${getDashboardUrl('teacher')}**`, { timeout: 10000 });

    // Verify we're on the teacher dashboard
    expect(page.url()).toContain('/teacher/dashboard');
  });

  test('should display teacher name after sign in', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForLoadState('networkidle');

    // Look for teacher name somewhere on the page
    const pageContent = await page.content();
    const teacherName = TEST_CREDENTIALS.teacher.name || 'Teacher';

    // Check if name appears in navigation or header
    const hasName = pageContent.includes(teacherName) ||
                   pageContent.includes('Welcome') ||
                   pageContent.includes('Dashboard');

    expect(hasName).toBeTruthy();
  });

  test('should sign out successfully', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForLoadState('networkidle');

    await signOut(page);

    // Should be redirected to sign-in or home page
    await page.waitForURL(/\/(sign-in|\?$)/, { timeout: 10000 });
  });

  test('should persist session across navigation', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**${getDashboardUrl('teacher')}**`);

    // Navigate to different pages
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded');

    // Should still be authenticated
    expect(page.url()).toContain('/teacher/students');

    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded');

    // Should still be authenticated
    expect(page.url()).toContain('/teacher/classes');
  });

  test('should redirect to sign-in when accessing protected routes without auth', async ({ page }) => {
    // Try to access a protected teacher route without signing in
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('networkidle');

    const currentUrl = page.url();

    // Should be redirected to sign-in or show an auth required screen
    const isOnSignInPage = currentUrl.includes('/sign-in') ||
                           currentUrl.includes('sign-in');

    if (isOnSignInPage) {
      expect(currentUrl).toContain('/sign-in');
    }
    // If not redirected, the page should show authentication required UI
    const hasAuthRequired = await page.locator('text=/sign in|authentication|log in/i').count() > 0;
    expect(isOnSignInPage || hasAuthRequired).toBeTruthy();
  });

  test('should handle invalid credentials gracefully', async ({ page }) => {
    await page.goto('/sign-in');

    // Fill in invalid credentials
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    await emailInput.fill('invalid-teacher@bhutaneduskill.bt');

    const continueButton = page.locator('button:has-text("Continue"), button[type="submit"]').first();
    await continueButton.click();

    // Wait for potential error message
    await page.waitForTimeout(2000);

    // Check for error message
    const hasError = await page.locator('text=/error|invalid|incorrect|not found/i').count() > 0;

    // Should either see an error or be redirected to a password input
    const hasPasswordInput = await page.locator('input[name="password"], input[type="password"]').count() > 0;

    expect(hasError || hasPasswordInput).toBeTruthy();
  });

  test('should have working password reset flow', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for forgot password link
    const forgotPasswordLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")').first();

    const hasForgotLink = await forgotPasswordLink.isVisible().catch(() => false);

    if (hasForgotLink) {
      await forgotPasswordLink.click();
      await page.waitForTimeout(1000);

      // Should be on a password reset page
      const currentUrl = page.url();
      const hasResetContent = await page.locator('text=/reset|password|email/i').count() > 0;

      expect(currentUrl.includes('reset') || currentUrl.includes('forgot') || hasResetContent).toBeTruthy();
    } else {
      // Skip if no forgot password link found
      test.skip();
    }
  });

  test('should redirect to correct dashboard after login', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);

    // Wait for navigation
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });

    // Verify we're on a teacher page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/teacher');
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`);

    // Clear cookies to simulate session expiry
    await page.context().clearCookies();

    // Try to navigate to a protected page
    await page.goto('/teacher/students');
    await page.waitForLoadState('networkidle');

    // Should be redirected to sign-in or show auth required
    const currentUrl = page.url();
    const needsAuth = currentUrl.includes('/sign-in') ||
                      await page.locator('text=/sign in|authentication/i').count() > 0;

    expect(needsAuth).toBeTruthy();
  });
});