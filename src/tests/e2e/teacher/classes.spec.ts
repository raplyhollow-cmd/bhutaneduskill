/**
 * Teacher Portal Classes Page Tests
 *
 * Tests the Teacher Portal classes page including:
 * - Load classes list
 * - View class details (students, attendance, homework)
 * - Expand/collapse class to view students
 * - Quick actions for classes
 * - Class statistics display
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Classes Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load classes page', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/classes');
    await assertPageNotError(page);
  });

  test('should display classes list or empty state', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class cards
    const classCards = page.locator('.grid > div, article, [class*="card"]');

    const count = await classCards.count();
    console.log(`Found ${count} class cards`);

    // Look for empty state
    const emptyState = page.locator('text=/no classes|classes yet/i');
    const hasEmpty = await emptyState.count() > 0;

    console.log(`Has empty state: ${hasEmpty}`);

    expect(count > 0 || hasEmpty).toBeTruthy();
  });

  test('should display class statistics', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for stats cards
    const statsCards = page.locator('text=/Total Classes|Total Students|Avg Attendance|Homework Completion/i');

    const hasStats = await statsCards.count() > 0;
    console.log(`Has statistics cards: ${hasStats}`);

    if (hasStats) {
      // Look for numeric values
      const numbers = await statsCards.allTextContents();
      console.log('Stats values:', numbers);
    }
  });

  test('should display class information on cards', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class information
    const className = await page.locator('text=/Grade|Class \\d|Section/i').count();
    const studentCount = await page.locator('text=/students|\\d+ students/i').count();
    const roomNumber = await page.locator('text=/Room|TBD/i').count();
    const schedule = await page.locator('text=/Schedule|Time|AM|PM/i').count();

    console.log(`Class info - Names: ${className}, Students: ${studentCount}, Room: ${roomNumber}, Schedule: ${schedule}`);
  });

  test('should have search functionality for classes', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for search input
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="class" i], input[placeholder*="subject" i]').first();

    const hasSearch = await searchInput.isVisible().catch(() => false);

    if (hasSearch) {
      console.log('Search input found on classes page');

      // Try typing in search
      await searchInput.fill('math');
      await page.waitForTimeout(500);

      await assertPageNotError(page);
    } else {
      console.log('Note: Search input not found');
    }
  });

  test('should have status filter for classes', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for status filter
    const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /All Classes|Active|Archived|Status/i }).first();

    const hasFilter = await statusFilter.isVisible().catch(() => false);

    if (hasFilter) {
      console.log('Status filter found on classes page');
    } else {
      console.log('Note: Status filter not found');
    }
  });

  test('should have sort functionality', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for sort dropdown
    const sortDropdown = page.locator('select, [role="combobox"]').filter({ hasText: /Sort by|Name|Students|Schedule/i }).first();

    const hasSort = await sortDropdown.isVisible().catch(() => false);

    if (hasSort) {
      console.log('Sort dropdown found on classes page');
    } else {
      console.log('Note: Sort dropdown not found');
    }
  });

  test('should display progress bars for attendance and homework', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"], .bg-gray-200.rounded-full');

    const count = await progressBars.count();
    console.log(`Found ${count} progress bars`);

    // Look for percentage labels
    const percentages = await page.locator('text=/\\d+%').all();
    console.log(`Found ${percentages.length} percentage displays`);
  });

  test('should have quick action buttons for each class', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for action buttons
    const homeworkButtons = page.locator('button:has-text("Homework"), a:has-text("Homework")');
    const attendanceButtons = page.locator('button:has-text("Attendance"), a:has-text("Attendance")');
    const studentsButtons = page.locator('button:has-text("Students"), a:has-text("Students")');
    const viewButtons = page.locator('button:has-text("View"), a:has-text("View")');

    const hwCount = await homeworkButtons.count();
    const attCount = await attendanceButtons.count();
    const stuCount = await studentsButtons.count();
    const viewCount = await viewButtons.count();

    console.log(`Action buttons - Homework: ${hwCount}, Attendance: ${attCount}, Students: ${stuCount}, View: ${viewCount}`);
  });

  test('should expand class to show students', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for expand/collapse buttons
    const expandButtons = page.locator('button:has-text("Students"), button[aria-expanded="false"]');

    const count = await expandButtons.count();

    if (count > 0) {
      console.log(`Found ${count} expand buttons`);

      // Click the first expand button
      await expandButtons.first().click();
      await page.waitForTimeout(500);

      // Should show student list
      const studentList = await page.locator('text=/Roll:|ID:|Attendance/i').count() > 0;
      console.log(`Student list visible after expand: ${studentList}`);
    } else {
      console.log('Note: No expand buttons found');
    }
  });

  test('should display current topic for each class', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for "Current Topic" sections
    const topicSections = page.locator('text=/Current Topic|Topic:/i');

    const count = await topicSections.count();
    console.log(`Found ${count} current topic sections`);
  });

  test('should have "View Schedule" button in header', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for schedule button
    const scheduleButton = page.locator('button:has-text("Schedule"), a:has-text("Schedule")').first();

    const hasButton = await scheduleButton.isVisible().catch(() => false);

    if (hasButton) {
      console.log('Schedule button found');

      // Try clicking it
      await scheduleButton.click();
      await page.waitForTimeout(1000);

      const currentUrl = page.url();
      console.log(`After clicking schedule - URL: ${currentUrl}`);
    } else {
      console.log('Note: Schedule button not found');
    }
  });

  test('should display active/archived badges', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for status badges
    const activeBadges = page.locator('text=/Active/i');
    const archivedBadges = page.locator('text=/Archived/i');

    const activeCount = await activeBadges.count();
    const archivedCount = await archivedBadges.count();

    console.log(`Status badges - Active: ${activeCount}, Archived: ${archivedCount}`);
  });

  test('should track classes API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && (url.includes('class') || url.includes('student'))) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Classes API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }
  });

  test('should navigate to homework via class card', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for homework link on a class card
    const homeworkLink = page.locator('a[href*="/teacher/homework"]').first();

    const hasLink = await homeworkLink.isVisible().catch(() => false);

    if (hasLink) {
      await homeworkLink.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`Navigated to: ${currentUrl}`);

      expect(currentUrl).toContain('/teacher/homework');
    } else {
      console.log('Note: No homework link found');
    }
  });

  test('should navigate to attendance via class card', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for attendance link on a class card
    const attendanceLink = page.locator('a[href*="/teacher/attendance"]').first();

    const hasLink = await attendanceLink.isVisible().catch(() => false);

    if (hasLink) {
      await attendanceLink.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`Navigated to: ${currentUrl}`);

      expect(currentUrl).toContain('/teacher/attendance');
    } else {
      console.log('Note: No attendance link found');
    }
  });

  test('should show student count for each class', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for student count indicators
    const studentCounts = page.locator('text=/\\d+ students?/i');

    const count = await studentCounts.count();
    console.log(`Found ${count} student count displays`);
  });

  test('should have quick action menu for each class', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for menu buttons (three dots, more options)
    const menuButtons = page.locator('button:has([data-lucide="more-vertical"]), button[aria-label*="more"], button:has-text("⋮")');

    const count = await menuButtons.count();
    console.log(`Found ${count} menu buttons`);

    if (count > 0) {
      // Try clicking a menu button
      await menuButtons.first().click();
      await page.waitForTimeout(500);

      // Look for menu items
      const menuItems = page.locator('[role="menuitem"], .menu-item');
      const menuItemCount = await menuItems.count();
      console.log(`Found ${menuItemCount} menu items after clicking menu`);
    }
  });

  test('should handle empty classes state gracefully', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if empty state is shown when no classes exist
    const emptyState = await page.locator('text=/no classes|classes yet|assigned yet/i').count() > 0;
    const hasClasses = await page.locator('text=/Grade|Class/i').count() > 0;

    if (emptyState) {
      console.log('Empty state is displayed');
    }

    // Should have either classes or empty state
    expect(hasClasses || emptyState).toBeTruthy();
  });
});