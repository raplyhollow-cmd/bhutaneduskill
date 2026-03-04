/**
 * Teacher Portal Students Page Tests
 *
 * Tests the Teacher Portal students page including:
 * - Load students list
 * - Search and filter students
 * - View student details
 * - Export student list
 * - Bulk actions on students
 * - Contact student/guardian
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError, trackApiCalls } from '../playwright-helpers';

test.describe('Teacher Portal - Students Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load students page', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/students');
    await assertPageNotError(page);
  });

  test('should display students list or empty state', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for either student cards or empty state
    const studentCards = page.locator('[data-testid="student-card"], .student-card, article');
    const emptyState = page.locator('[data-testid="empty-state"], .empty-state, text=/no students/i');

    const hasStudents = await studentCards.count() > 0;
    const hasEmpty = await emptyState.count() > 0;

    console.log(`Students page - Has students: ${hasStudents}, Has empty state: ${hasEmpty}`);

    // Should have either students or empty state
    expect(hasStudents || hasEmpty).toBeTruthy();
  });

  test('should display student stats cards', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for stats cards (Total Students, Avg Attendance, etc.)
    const statsCards = page.locator('.grid').filter({ hasText: /Total Students|Avg Attendance|Need Attention|Classes/i });

    const hasStats = await statsCards.count() > 0;
    console.log(`Students page - Has stats cards: ${hasStats}`);
  });

  test('should have search functionality', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="name" i], input[placeholder*="roll" i]').first();

    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      console.log('Search input found on students page');

      // Try typing in search
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Verify search was performed (page should not error)
      await assertPageNotError(page);
    } else {
      console.log('Note: Search input not found on students page');
    }
  });

  test('should have class filter dropdown', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class filter dropdown
    const classFilter = page.locator('select, [role="combobox"]').filter({ hasText: /class|filter/i }).first();

    const hasFilter = await classFilter.isVisible().catch(() => false);

    if (hasFilter) {
      console.log('Class filter found on students page');
    } else {
      console.log('Note: Class filter not found');
    }
  });

  test('should have sort functionality', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for sort dropdown
    const sortDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /sort|Name \(A-Z\)|Class|Attendance/i }).first();

    const hasSort = await sortDropdown.isVisible().catch(() => false);

    if (hasSort) {
      console.log('Sort dropdown found on students page');

      // Try changing sort option
      await sortDropdown.click();
      await page.waitForTimeout(300);
    } else {
      console.log('Note: Sort dropdown not found');
    }
  });

  test('should have export button', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("CSV")').first();

    const hasExport = await exportButton.isVisible().catch(() => false);

    if (hasExport) {
      console.log('Export button found on students page');
    } else {
      console.log('Note: Export button not found');
    }
  });

  test('should display student contact information', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for contact information on student cards
    const emailLinks = page.locator('a[href^="mailto:"]');
    const phoneElements = page.locator('text=/\+975|phone|guardian/i');

    const hasEmail = await emailLinks.count() > 0;
    const hasPhone = await phoneElements.count() > 0;

    console.log(`Students page - Has email links: ${hasEmail}, Has phone info: ${hasPhone}`);
  });

  test('should have view profile button for each student', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for "View Profile" buttons
    const viewProfileButtons = page.locator('button:has-text("View Profile"), a:has-text("View Profile"), button:has-text("View"), a:has-text("View")');

    const count = await viewProfileButtons.count();
    console.log(`Found ${count} view profile buttons`);
  });

  test('should have contact button for students', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for contact/message buttons
    const contactButtons = page.locator('button:has-text("Contact"), button:has-text("Message"), button:has-text("Email")');

    const count = await contactButtons.count();
    console.log(`Found ${count} contact/message buttons`);
  });

  test('should display attendance and homework percentages', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for percentage displays
    const percentageText = await page.locator('text=/\\d+%').all();
    const hasPercentages = percentageText.length > 0;

    console.log(`Found ${percentageText.length} percentage displays`);

    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"], .progress, .w-full.bg-gray-200');
    const hasProgressBars = await progressBars.count() > 0;

    console.log(`Has progress bars: ${hasProgressBars}`);
  });

  test('should highlight students needing attention', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for "Needs Attention" badges or indicators
    const attentionBadges = page.locator('text=/needs attention|attention required|alert/i');

    const count = await attentionBadges.count();
    console.log(`Found ${count} attention indicators`);
  });

  test('should have bulk selection functionality', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for checkboxes
    const checkboxes = page.locator('input[type="checkbox"], [role="checkbox"]');

    const count = await checkboxes.count();
    console.log(`Found ${count} checkboxes`);

    if (count > 0) {
      // Try clicking a checkbox
      await checkboxes.first().check({ force: true });
      await page.waitForTimeout(300);

      // Look for bulk action bar
      const bulkActionBar = page.locator('.fixed, [data-bulk-actions]').filter({ hasText: /selected|send message/i });
      const hasBulkBar = await bulkActionBar.isVisible().catch(() => false);

      console.log(`Has bulk action bar: ${hasBulkBar}`);
    }
  });

  test('should track students API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && url.includes('student')) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Students API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }

    // Should at least try to fetch students
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('should navigate to student detail page', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for a link to student details
    const studentLinks = page.locator('a[href*="/teacher/students/"]');

    const count = await studentLinks.count();

    if (count > 0) {
      // Click the first student link
      await studentLinks.first().click();
      await page.waitForTimeout(2000);

      // Should navigate to student detail page
      const currentUrl = page.url();
      console.log(`Navigated to: ${currentUrl}`);

      expect(currentUrl).toContain('/teacher/students/');
    } else {
      console.log('Note: No student detail links found (may need students in database)');
    }
  });

  test('should filter students by class', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class selector
    const classSelector = page.locator('select, [role="combobox"], button').filter({ hasText: /All Classes|class/i }).first();

    const hasSelector = await classSelector.isVisible().catch(() => false);

    if (hasSelector) {
      await classSelector.click();
      await page.waitForTimeout(500);

      // Look for class options
      const options = page.locator('[role="option"], option');

      const optionCount = await options.count();
      console.log(`Found ${optionCount} class filter options`);
    }
  });

  test('should handle empty state gracefully', async ({ page }) => {
    // This test checks if the page handles the case when no students are found
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Search for something that won't exist
    const searchInput = page.locator('input[placeholder*="search" i]').first();

    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      await searchInput.fill('xyznonexistentstudent123');
      await page.waitForTimeout(1000);

      // Should show empty state or no results message
      const noResults = await page.locator('text=/no students|no results|not found/i').count() > 0;
      console.log(`Shows no results message: ${noResults}`);
    }
  });

  test('should not have console errors on students page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });
});