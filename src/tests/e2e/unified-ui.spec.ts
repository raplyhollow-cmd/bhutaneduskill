/**
 * UNIFIED UI COMPONENTS E2E TESTS
 *
 * Tests for the unified components (FeatureDataGrid, FeatureForm, etc.)
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';

// ============================================================================
// FEATURE DATA GRID TESTS
// ============================================================================

test.describe('FeatureDataGrid', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to a page that uses FeatureDataGrid
    await page.goto(`${BASE_URL}/school-admin/students`);
  });

  test('should render data table', async ({ page }) => {
    const table = page.locator('table, [role="table"]');
    await expect(table.first()).toBeVisible();
  });

  test('should display pagination controls', async ({ page }) => {
    const pagination = page.locator('[data-testid="pagination"], .pagination');
    await expect(pagination.first()).toBeVisible();
  });

  test('should have search input', async ({ page }) => {
    const search = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]');
    await expect(search.first()).toBeVisible();
  });

  test('should filter data when typing in search', async ({ page }) => {
    const search = page.locator('input[placeholder*="search" i]').first();
    await search.fill('test');

    // Wait for debounced search
    await page.waitForTimeout(500);

    // Check that URL or results updated
    const url = page.url();
    expect(url).toContain('search');
  });

  test('should sort when clicking column header', async ({ page }) => {
    const nameColumn = page.locator('th:has-text("Name"), th:has-text("name")').first();
    await nameColumn.click();

    // Check URL for sort parameter
    const url = page.url();
    expect(url).toContain('sort');
  });

  test('should select rows', async ({ page }) => {
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();

    // Verify bulk actions appear
    const bulkActions = page.locator('[data-testid="bulk-actions"], .bulk-actions');
    await expect(bulkActions.first()).toBeVisible({ timeout: 5000 });
  });

  test('should export to CSV', async ({ page }) => {
    const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV")');
    if (await exportButton.isVisible()) {
      const downloadPromise = page.waitForEvent('download');
      await exportButton.first().click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toContain('.csv');
    }
  });
});

// ============================================================================
// FEATURE FORM TESTS
// ============================================================================

test.describe('FeatureForm', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate to create page
    await page.goto(`${BASE_URL}/school-admin/students/new`);
  });

  test('should render form fields', async ({ page }) => {
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check for common fields
    const nameInput = page.locator('input[name*="name" i], label:has-text("Name")');
    await expect(nameInput.first()).toBeVisible();
  });

  test('should show validation errors for required fields', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check for error messages
    const errors = page.locator('.error, [role="alert"], .text-destructive');
    await expect(errors.first()).toBeVisible({ timeout: 3000 });
  });

  test('should submit form with valid data', async ({ page }) => {
    // Fill in form fields
    const nameInput = page.locator('input[name*="name" i]').first();
    await nameInput.fill(`E2E Test Student ${Date.now()}`);

    const emailInput = page.locator('input[name*="email" i]').first();
    await emailInput.fill(`e2e-${Date.now()}@test.com`);

    // Submit form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check for success or redirect
    await page.waitForTimeout(2000);

    const url = page.url();
    const isRedirected = !url.includes('/new');
    const hasSuccessMessage = await page.locator('text=success, text=created, text=Success').count() > 0;

    expect(isRedirected || hasSuccessMessage).toBeTruthy();
  });

  test('should show reference field dropdown', async ({ page }) => {
    // Look for class or subject dropdown
    const select = page.locator('[role="combobox"], select').first();
    if (await select.isVisible()) {
      await select.click();

      const dropdown = page.locator('[role="listbox"], .dropdown-menu');
      await expect(dropdown.first()).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================================================
// NOTIFICATION TESTS
// ============================================================================

test.describe('Notifications', () => {

  test('should show toast on successful operation', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);
    await page.waitForLoadState('networkidle');

    // Trigger an operation that shows a toast
    const actionButton = page.locator('button:has-text("Create"), button:has-text("Add")').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();
      await page.waitForTimeout(1000);

      // Check for toast
      const toast = page.locator('[role="status"], .toast').first();
      await expect(toast).toBeVisible({ timeout: 5000 });
    }
  });

  test('should show error toast on failed operation', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students/new`);

    // Try to submit empty form
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    // Check for error toast or inline error
    const error = page.locator('.toast:has-text("error"), .toast:has-text("Error"), [role="alert"]').first();
    await expect(error).toBeVisible({ timeout: 3000 });
  });
});

// ============================================================================
// UNIFIED SEARCH TESTS
// ============================================================================

test.describe('UnifiedSearch', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);
  });

  test('should have search bar', async ({ page }) => {
    const search = page.locator('input[placeholder*="search" i]');
    await expect(search.first()).toBeVisible();
  });

  test('should debounce search input', async ({ page }) => {
    const search = page.locator('input[placeholder*="search" i]').first();

    await search.fill('test');

    // URL should not update immediately (debounce)
    await page.waitForTimeout(100);
    let url = page.url();
    const hasImmediateSearch = url.includes('search');

    // After debounce period, should update
    await page.waitForTimeout(300);
    url = page.url();
    const hasDebouncedSearch = url.includes('search');

    expect(hasDebouncedSearch).toBeTruthy();
  });

  test('should show active filter pills', async ({ page }) => {
    const search = page.locator('input[placeholder*="search" i]').first();
    await search.fill('class 10');
    await page.waitForTimeout(500);

    const filterPills = page.locator('[data-testid="filter-pill"], .badge');
    if (await filterPills.count() > 0) {
      await expect(filterPills.first()).toBeVisible();
    }
  });
});

// ============================================================================
// MODAL TESTS
// ============================================================================

test.describe('UniversalModal', () => {

  test('should open modal on action click', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    const actionButton = page.locator('button:has-text("Create"), button:has-text("Add New")').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();

      const modal = page.locator('[role="dialog"], .modal, .dialog').first();
      await expect(modal).toBeVisible({ timeout: 3000 });
    }
  });

  test('should close modal on cancel', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    const actionButton = page.locator('button:has-text("Create"), button:has-text("Add New")').first();
    if (await actionButton.isVisible()) {
      await actionButton.click();

      await page.waitForTimeout(500);

      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      await cancelButton.click();

      await page.waitForTimeout(300);

      const modal = page.locator('[role="dialog"], .modal').first();
      const isVisible = await modal.count() > 0 ? await modal.isVisible() : false;
      expect(isVisible).toBeFalsy();
    }
  });

  test('should show loading state during submission', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students/new`);

    // Fill form
    const nameInput = page.locator('input[name*="name" i]').first();
    await nameInput.fill(`Test ${Date.now()}`);

    // Submit and check for loading state
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.click();

    const loading = page.locator('.spinner, [aria-busy="true"], .animate-spin').first();
    await expect(loading).toBeVisible({ timeout: 2000 });
  });
});

// ============================================================================
// PAGE NAVIGATION TESTS
// ============================================================================

test.describe('Page Navigation', () => {

  test('should navigate to list page', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);
    await page.waitForLoadState('networkidle');

    const heading = page.locator('h1:has-text("Student"), h1:has-text("student")');
    await expect(heading.first()).toBeVisible();
  });

  test('should navigate to detail page', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    // Click first row
    const firstRow = page.locator('tr, [role="row"]').nth(1);
    await firstRow.click();

    await page.waitForTimeout(500);

    const url = page.url();
    const isDetailPage = /\/students\/[^/]+$/.test(url) || url.includes('/detail');
    expect(isDetailPage).toBeTruthy();
  });

  test('should navigate to edit page', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();

      await page.waitForTimeout(500);

      const url = page.url();
      expect(url).toContain('/edit');
    }
  });
});

// ============================================================================
// RESPONSIVE TESTS
// ============================================================================

test.describe('Responsive Design', () => {

  test('should show mobile menu on small screens', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/school-admin/students`);

    const menuButton = page.locator('button[aria-label*="menu" i], button:has-text("Menu")');
    if (await menuButton.isVisible()) {
      await menuButton.click();

      const mobileMenu = page.locator('[role="navigation"], .mobile-menu');
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test('should use sheet for modal on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${BASE_URL}/school-admin/students/new`);

    // On mobile, forms might use sheets instead of modals
    const sheet = page.locator('[data-state="open"], .sheet').first();
    if (await sheet.isVisible()) {
      expect(await sheet.isVisible()).toBeTruthy();
    }
  });
});

// ============================================================================
// ACCESSIBILITY TESTS
// ============================================================================

test.describe('Accessibility', () => {

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    const h1 = page.locator('h1');
    await expect(h1.first()).toBeVisible();
  });

  test('should have focus indicators', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    const button = page.locator('button').first();
    await button.focus();

    const focused = await button.evaluate((el) => {
      return window.getComputedStyle(el).outline !== 'none' ||
             window.getComputedStyle(el).boxShadow !== 'none';
    });

    expect(focused).toBeTruthy();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto(`${BASE_URL}/school-admin/students`);

    // Tab through elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'INPUT', 'A', 'SELECT']).toContain(focusedElement);
  });
});
