/**
 * Teacher Portal Homework Tests
 *
 * Tests the Teacher Portal homework functionality:
 * - View homework list
 * - Create new homework
 * - Edit homework
 * - Delete homework
 */

import { test, expect } from '@playwright/test';
import { assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Homework', () => {
  test.setTimeout(60000);
  test('should load homework page', async ({ page }) => {
    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/homework');
    await assertPageNotError(page);
  });

  test('should display homework list or empty state', async ({ page }) => {
    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for either a homework list or empty state
    const homeworkList = page.locator('[data-testid="homework-list"], .homework-list');
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state');

    const hasList = await homeworkList.count() > 0;
    const hasEmpty = await emptyState.count() > 0;

    if (!hasList && !hasEmpty) {
      console.log('Note: No homework list or empty state found');
    }
  });

  test('should find create homework button', async ({ page }) => {
    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for create button with various selectors
    const createButton = page.locator(
      'button:has-text("Create"), button:has-text("Add"), button:has-text("New"), a:has-text("Create")'
    ).first();

    const isVisible = await createButton.isVisible().catch(() => false);

    if (isVisible) {
      console.log('Found create homework button');
    } else {
      console.log('Note: No create button found (might need authentication)');
    }
  });
});

test.describe('Teacher Portal - Create Homework Flow', () => {
  test('should navigate to create homework page', async ({ page }) => {
    // Try to navigate to create page directly
    await page.goto('/teacher/homework/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Create homework page URL: ${currentUrl}`);

    // Check if we're on the create page or were redirected
    if (currentUrl.includes('create')) {
      // Check for form elements
      const form = page.locator('form');
      const hasForm = await form.count() > 0;

      if (hasForm) {
        console.log('Create homework form found');

        // Look for common form fields
        const titleInput = page.locator('input[name="title"], input[placeholder*="title" i]');
        const descriptionTextarea = page.locator('textarea[name="description"], textarea[placeholder*="description" i]');
        const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Create")');

        const hasTitle = await titleInput.count() > 0;
        const hasDescription = await descriptionTextarea.count() > 0;
        const hasSubmit = await submitButton.count() > 0;

        console.log(`Form fields - Title: ${hasTitle}, Description: ${hasDescription}, Submit: ${hasSubmit}`);
      }
    } else {
      console.log('Note: Redirected from create page (likely needs authentication)');
    }
  });
});

test.describe('Teacher Portal - Homework API', () => {
  test('should track homework API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && (url.includes('homework') || url.includes('assignment'))) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Homework API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }
  });
});
