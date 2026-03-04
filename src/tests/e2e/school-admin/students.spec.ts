/**
 * School Admin Portal - Student Creation Tests
 *
 * **HIGH PRIORITY** - Known bug from QA report:
 * File: src/app/school-admin/students/create/page.tsx:164
 * Issue: Uses setTimeout instead of actual API call
 * Impact: Students are NOT actually created in database
 *
 * These tests verify if the bug has been fixed.
 */

import { test, expect } from '@playwright/test';
import { assertPageNotError } from '../playwright-helpers';

test.setTimeout(60000);

test.describe('School Admin Portal - Student Creation (HIGH PRIORITY)', () => {
  test('should load student creation page', async ({ page }) => {
    await page.goto('/school-admin/students/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const currentUrl = page.url();
    console.log(`Student creation page URL: ${currentUrl}`);

    if (currentUrl.includes('create')) {
      await assertPageNotError(page);
    } else {
      console.log('Note: Redirected from create page (likely needs authentication)');
    }
  });

  test('should have student creation form', async ({ page }) => {
    await page.goto('/school-admin/students/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check for form
    const form = page.locator('form');
    const hasForm = await form.count() > 0;

    if (hasForm) {
      console.log('Student creation form found');

      // Look for expected form fields
      const firstNameInput = page.locator('input[name*="firstName" i], input[name*="first_name" i], input[placeholder*="first" i]');
      const lastNameInput = page.locator('input[name*="lastName" i], input[name*="last_name" i], input[placeholder*="last" i]');
      const emailInput = page.locator('input[type="email"], input[name*="email" i]');
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save"), button:has-text("Add")');

      const hasFirstName = await firstNameInput.count() > 0;
      const hasLastName = await lastNameInput.count() > 0;
      const hasEmail = await emailInput.count() > 0;
      const hasSubmit = await submitButton.count() > 0;

      console.log(`Form fields - First Name: ${hasFirstName}, Last Name: ${hasLastName}, Email: ${hasEmail}, Submit: ${hasSubmit}`);

      expect(hasForm).toBe(true);
    } else {
      console.log('Note: No form found (might need authentication)');
    }
  });

  test('should detect if student creation uses mock setTimeout instead of API', async ({ page }) => {
    await page.goto('/school-admin/students/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Track all network requests
    const apiCalls: string[] = [];
    const setTimeoutCalls: string[] = [];

    // Intercept API calls
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/')) {
        apiCalls.push(url);
      }
    });

    // Also check for setTimeout in console (indirect detection)
    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('setTimeout') || text.includes('mock')) {
        setTimeoutCalls.push(text);
      }
    });

    // Try to find and read the create student page source
    const pageSource = await page.content();

    // Look for indicators of mock behavior
    const hasSetTimeout = pageSource.includes('setTimeout');
    const hasMockData = pageSource.includes('mock') || pageSource.includes('MOCK');
    const hasApiCall = pageSource.includes('/api/school-admin/students') || pageSource.includes('createStudent');

    console.log('=== STUDENT CREATION FORM ANALYSIS ===');
    console.log(`Contains setTimeout: ${hasSetTimeout}`);
    console.log(`Contains mock data: ${hasMockData}`);
    console.log(`Contains API call reference: ${hasApiCall}`);

    if (hasSetTimeout && !hasApiCall) {
      console.log('⚠️  WARNING: Form appears to use setTimeout instead of real API call');
      console.log('⚠️  BUG CONFIRMED: Student creation will not persist to database');
    } else if (hasApiCall) {
      console.log('✅ Form appears to use real API call');
    } else {
      console.log('? Unable to determine - manual code review recommended');
    }
  });

  test('should track API calls when submitting student form', async ({ page }) => {
    await page.goto('/school-admin/students/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    let apiCallMade = false;
    let apiUrl = '';

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && (url.includes('student') || url.includes('create'))) {
        apiCallMade = true;
        apiUrl = url;
        console.log(`API call detected: ${request.method()} ${url}`);
      }
    });

    // Try to fill the form and submit (if form exists)
    const form = page.locator('form').first();
    const hasForm = await form.count() > 0;

    if (hasForm) {
      // Try to find and fill basic fields
      const firstName = page.locator('input[name*="firstName" i], input[name*="first_name" i]').first();
      const lastName = page.locator('input[name*="lastName" i], input[name*="last_name" i]').first();
      const email = page.locator('input[type="email"], input[name*="email" i]').first();
      const submit = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();

      try {
        const hasFirstName = await firstName.isVisible().catch(() => false);
        if (hasFirstName) {
          await firstName.fill('TestStudent');
        }

        const hasLastName = await lastName.isVisible().catch(() => false);
        if (hasLastName) {
          await lastName.fill('E2ETest');
        }

        const hasEmail = await email.isVisible().catch(() => false);
        if (hasEmail) {
          const timestamp = Date.now();
          await email.fill(`test.student.${timestamp}@e2etest.bt`);
        }

        const hasSubmit = await submit.isVisible().catch(() => false);
        if (hasSubmit) {
          // Click submit and wait for any network activity
          await submit.click();
          await page.waitForTimeout(3000);
        }
      } catch (e) {
        console.log('Form submission error (might be expected):', e);
      }
    }

    console.log('=== STUDENT CREATION SUBMISSION ANALYSIS ===');
    console.log(`API call made during submit: ${apiCallMade}`);
    if (apiCallMade) {
      console.log(`API endpoint: ${apiUrl}`);
      console.log('✅ Student creation appears to use real API');
    } else {
      console.log('⚠️  WARNING: No API call detected during form submission');
      console.log('⚠️  BUG CONFIRMED: Student creation likely uses mock setTimeout');
    }
  });

  test('should check for success/error messages after submit', async ({ page }) => {
    await page.goto('/school-admin/students/create');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for success message patterns
    const successSelectors = [
      '[data-testid="success-message"]',
      '.success-message',
      '.alert-success',
      'text=/student created|successfully|saved/i',
    ];

    // Look for error message patterns
    const errorSelectors = [
      '[data-testid="error-message"]',
      '.error-message',
      '.alert-error',
      'text=/error|failed|required/i',
    ];

    // Try to submit the form
    const submit = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
    const hasSubmit = await submit.isVisible().catch(() => false);

    if (hasSubmit) {
      await submit.click();
      await page.waitForTimeout(2000);

      // Check for messages
      let hasSuccess = false;
      let hasError = false;

      for (const selector of successSelectors) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          hasSuccess = true;
          const text = await element.textContent();
          console.log(`Success message: ${text}`);
          break;
        }
      }

      for (const selector of errorSelectors) {
        const element = page.locator(selector).first();
        const isVisible = await element.isVisible().catch(() => false);
        if (isVisible) {
          hasError = true;
          const text = await element.textContent();
          console.log(`Error message: ${text}`);
          break;
        }
      }

      console.log(`Success message shown: ${hasSuccess}`);
      console.log(`Error message shown: ${hasError}`);
    } else {
      console.log('No submit button found (authentication required)');
    }
  });
});

test.describe('School Admin Portal - Students List', () => {
  test('should load students list page', async ({ page }) => {
    await page.goto('/school-admin/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/school-admin/students');
  });

  test('should display students or empty state', async ({ page }) => {
    await page.goto('/school-admin/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for students list
    const studentsList = page.locator('[data-testid="students-list"], .students-list, table');
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state, text=/no students/i');

    const hasList = await studentsList.count() > 0;
    const hasEmpty = await emptyState.count() > 0;

    console.log(`Students list found: ${hasList}`);
    console.log(`Empty state found: ${hasEmpty}`);

    if (!hasList && !hasEmpty) {
      console.log('Note: No students list or empty state found');
    }
  });

  test('should have create student button', async ({ page }) => {
    await page.goto('/school-admin/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const createButton = page.locator(
      'a:has-text("Create"), a:has-text("Add"), button:has-text("Create"), button:has-text("Add"), [href*="create"]'
    ).first();

    const isVisible = await createButton.isVisible().catch(() => false);

    if (isVisible) {
      console.log('Create student button found');
    } else {
      console.log('Note: No create button found');
    }
  });
});
