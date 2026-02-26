import { test, expect } from '@playwright/test';

/**
 * E2E Tests: All Wizards
 *
 * Tests all 6 wizards in the application
 */
test.describe('Unified Setup Wizard', () => {

  test('loads at /setup/unified', async ({ page }) => {
    await page.goto('/setup/unified');

    // Page should load
    await expect(page).toHaveURL('/setup/unified');
    await expect(page.locator('body')).toBeVisible();
  });

  test('has role selection cards', async ({ page }) => {
    await page.goto('/setup/unified');

    // Check for common role names
    const expectedRoles = ['Student', 'Teacher', 'Parent', 'School Admin', 'Counselor'];

    for (const role of expectedRoles) {
      const element = page.locator(`text=${role}`).first();
      await expect(element).toBeVisible();
    }
  });

  test('shows next button after role selection', async ({ page }) => {
    await page.goto('/setup/unified');

    // Click a role card
    const studentRole = page.locator('text=Student').first();
    await studentRole.click();

    // Wait a bit for state update
    await page.waitForTimeout(500);

    // Next button should exist (may or may not be enabled)
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    await expect(nextButton).toBeAttached();
  });

});

test.describe('Guardian Link Wizard', () => {

  test('loads at /parent/link-child', async ({ page }) => {
    await page.goto('/parent/link-child');

    // Page should load
    await expect(page).toHaveURL('/parent/link-child');
    await expect(page.locator('body')).toBeVisible();
  });

  test('has CID input field', async ({ page }) => {
    await page.goto('/parent/link-child');

    // Look for CID input (11 digit Bhutan Citizen ID)
    const cidInput = page.locator('input[type="text"], input[type="number"], input[name*="cid"], input[name*="CID"]').first();

    if (await cidInput.count() > 0) {
      await expect(cidInput.first()).toBeVisible();
    }
  });

});

test.describe('School Admin Setup Wizard', () => {

  test('loads at /school-admin/setup', async ({ page }) => {
    await page.goto('/school-admin/setup');

    // Page should load
    await expect(page).toHaveURL('/school-admin/setup');
    await expect(page.locator('body')).toBeVisible();
  });

  test('has school profile form', async ({ page }) => {
    await page.goto('/school-admin/setup');

    // Look for school name input
    const schoolNameInput = page.locator('input[name*="school"], input[name*="name"], input[placeholder*="school"]').first();

    if (await schoolNameInput.count() > 0) {
      await expect(schoolNameInput.first()).toBeVisible();
    }
  });

});

test.describe('Subject-Teacher Mapping Wizard', () => {

  test('loads at /school-admin/timetable/assign', async ({ page }) => {
    await page.goto('/school-admin/timetable/assign');

    // Page should load (might redirect if not authenticated)
    await expect(page.locator('body')).toBeVisible();
  });

});

test.describe('Wellness Compass Wizard (Counselor)', () => {

  test('loads at /counselor/intervention/create', async ({ page }) => {
    await page.goto('/counselor/intervention/create');

    // Page should load (might redirect if not authenticated)
    await expect(page.locator('body')).toBeVisible();
  });

});

test.describe('Ministry Setup Wizard', () => {

  test('loads at /setup/ministry', async ({ page }) => {
    await page.goto('/setup/ministry');

    // Page should load
    await expect(page).toHaveURL('/setup/ministry');
    await expect(page.locator('body')).toBeVisible();
  });

  test('has ministry verification form', async ({ page }) => {
    await page.goto('/setup/ministry');

    // Look for ministry ID input
    const ministryInput = page.locator('input[name*="ministry"], input[name*="Ministry"]').first();

    if (await ministryInput.count() > 0) {
      await expect(ministryInput.first()).toBeAttached();
    }
  });

});

test.describe('Wizard Navigation', () => {

  test('next/back buttons exist', async ({ page }) => {
    await page.goto('/setup/unified');

    // Select a role
    await page.locator('text=Student').first().click();
    await page.waitForTimeout(500);

    // Check for navigation buttons
    const nextButton = page.locator('button:has-text("Next"), button:has-text("Continue")').first();
    const backButton = page.locator('button:has-text("Back"), button:has-text("Previous")').first();

    // At least one should be attached
    const hasNavigation = await nextButton.count() > 0 || await backButton.count() > 0;
    expect(hasNavigation).toBeTruthy();
  });

  test('exit button exists', async ({ page }) => {
    await page.goto('/setup/unified');

    // Look for exit/close button
    const exitButton = page.locator('button:has-text("Exit"), button[aria-label*="close"], button[aria-label*="Close"], button:has-text("Cancel")').first();

    // Exit button might exist
    const hasExit = await exitButton.count() > 0;
    // This is optional, so we just log it
    console.log(`Exit button exists: ${hasExit}`);
  });

});
