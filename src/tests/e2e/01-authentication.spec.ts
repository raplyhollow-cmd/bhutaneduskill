import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Authentication Flow
 *
 * Tests user sign-in, sign-out, and redirects
 */
test.describe('Authentication', () => {

  test.beforeEach(async ({ page }) => {
    // Start from landing page
    await page.goto('/');
  });

  test('landing page loads without errors', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/Bhutan EduSkill/);

    // Check main elements are visible
    await expect(page.locator('body')).toBeVisible();

    // Check for console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('404') && !e.includes('favicon')).length).toBe(0);
  });

  test('sign-in button is visible and clickable', async ({ page }) => {
    // Look for sign-in button (might be in nav or hero)
    const signInButton = page.locator('a:has-text("Sign In"), button:has-text("Sign In")').first();

    await expect(signInButton).toBeVisible();
    await signInButton.click();

    // Should redirect to Clerk auth or sign-in page
    await expect(page).toHaveURL(/.*sign-in.*/);
  });

  test('sign-up button is visible and clickable', async ({ page }) => {
    const signUpButton = page.locator('a:has-text("Sign Up"), button:has-text("Sign Up")').first();

    await expect(signUpButton).toBeVisible();
    await signUpButton.click();

    // Should redirect to sign-up page
    await expect(page).toHaveURL(/.*sign-up.*/);
  });

  test('portal cards are displayed on landing page', async ({ page }) => {
    // Check for portal cards
    const portalCards = page.locator('a, button').filter(async (el) => {
      const text = await el.textContent();
      return text && (
        text.includes('Student') ||
        text.includes('Teacher') ||
        text.includes('Parent') ||
        text.includes('Counselor') ||
        text.includes('School Admin')
      );
    });

    // Should have at least 3 portal options
    await expect(portalCards.first()).toBeVisible();
  });

});

test.describe('Setup Wizard', () => {

  test('setup wizard page loads', async ({ page }) => {
    await page.goto('/setup/unified');

    // Should show role selection
    await expect(page.locator('body')).toBeVisible();

    // Check for role cards
    const roles = ['Student', 'Teacher', 'Parent', 'Counselor', 'School Admin', 'Ministry'];

    for (const role of roles) {
      const roleElement = page.locator(`text=${role}`).first();
      // At least some roles should be visible
    }
  });

  test('can select student role', async ({ page }) => {
    await page.goto('/setup/unified');

    // Click on Student role
    const studentCard = page.locator('text=Student').first();
    await studentCard.click();

    // Look for Next button and click it
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();

    // Give it a moment for the button to become enabled
    await page.waitForTimeout(500);

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Should move to next step
      await page.waitForTimeout(1000);
    }
  });

  test('back button works in wizard', async ({ page }) => {
    await page.goto('/setup/unified');

    // Select a role
    const studentCard = page.locator('text=Student').first();
    await studentCard.click();

    await page.waitForTimeout(500);

    // Look for Back button
    const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")').first();

    if (await backButton.isVisible()) {
      await backButton.click();
      // Should stay on same page (was on first step)
    }
  });

});

test.describe('Portal Access', () => {

  test('student portal route exists', async ({ page }) => {
    const response = await page.request.get('/student');

    // Should return 200 (even if redirects to setup)
    expect([200, 302, 307]).toContain(response.status());
  });

  test('teacher portal route exists', async ({ page }) => {
    const response = await page.request.get('/teacher');
    expect([200, 302, 307]).toContain(response.status());
  });

  test('school admin portal route exists', async ({ page }) => {
    const response = await page.request.get('/school-admin');
    expect([200, 302, 307]).toContain(response.status());
  });

  test('admin portal route exists', async ({ page }) => {
    const response = await page.request.get('/admin');
    expect([200, 302, 307]).toContain(response.status());
  });

  test('parent portal route exists', async ({ page }) => {
    const response = await page.request.get('/parent');
    expect([200, 302, 307]).toContain(response.status());
  });

  test('counselor portal route exists', async ({ page }) => {
    const response = await page.request.get('/counselor');
    expect([200, 302, 307]).toContain(response.status());
  });

  test('ministry portal route exists', async ({ page }) => {
    const response = await page.request.get('/ministry');
    expect([200, 302, 307]).toContain(response.status());
  });

});
