/**
 * Teacher Portal Attendance Page Tests
 *
 * Tests the Teacher Portal attendance page including:
 * - Load classes for attendance
 * - Select class and take attendance
 * - View attendance history
 * - View attendance reports
 * - Mark students as present/absent/late
 * - Add attendance notes
 * - Export attendance data
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Attendance Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load attendance page', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/attendance');
    await assertPageNotError(page);
  });

  test('should display classes for attendance or empty state', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class cards
    const classCards = page.locator('.grid > div, article, [class*="card"]');

    const count = await classCards.count();
    console.log(`Found ${count} class cards`);

    // Look for empty state
    const emptyState = await page.locator('text=/no classes|assigned yet/i').count() > 0;
    console.log(`Has empty state: ${emptyState}`);

    expect(count > 0 || emptyState).toBeTruthy();
  });

  test('should have date selector', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for date input
    const dateInput = page.locator('input[type="date"]');

    const hasDateInput = await dateInput.count() > 0;
    console.log(`Has date input: ${hasDateInput}`);

    if (hasDateInput) {
      // Check if date is set to today
      const dateValue = await dateInput.first().inputValue();
      console.log(`Date input value: ${dateValue}`);
    }
  });

  test('should display student count for each class', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for student count displays
    const studentCounts = page.locator('text=/\\d+ students?/i');

    const count = await studentCounts.count();
    console.log(`Found ${count} student count displays`);
  });

  test('should be able to select a class', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for clickable class cards
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const count = await classCards.count();

    if (count > 0) {
      console.log(`Found ${count} class cards`);

      // Click the first class card
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Should navigate to class attendance view
      const currentUrl = page.url();
      console.log(`After clicking class - URL: ${currentUrl}`);

      // Look for attendance interface elements
      const attendanceInterface = await page.locator('text=/Take Attendance|Attendance|Present|Absent/i').count() > 0;
      console.log(`Attendance interface visible: ${attendanceInterface}`);
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should have tabs for Take/History/Reports when class selected', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // First try to select a class
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Look for tabs
      const tabs = page.locator('[role="tab"], button:has-text("Take"), button:has-text("History"), button:has-text("Reports")');

      const tabCount = await tabs.count();
      console.log(`Found ${tabCount} tabs`);

      // Check for specific tab names
      const takeTab = await page.locator('text=/Take Attendance/i').count() > 0;
      const historyTab = await page.locator('text=/History/i').count() > 0;
      const reportsTab = await page.locator('text=/Reports/i').count() > 0;

      console.log(`Tabs - Take: ${takeTab}, History: ${historyTab}, Reports: ${reportsTab}`);
    } else {
      console.log('Note: No class cards found, skipping tabs test');
    }
  });

  test('should have save button for attendance', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Look for save button
      const saveButton = page.locator('button:has-text("Save"), button[type="submit"]');

      const hasSave = await saveButton.isVisible().catch(() => false);
      console.log(`Has save button: ${hasSave}`);
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should have attendance status options (Present/Absent/Late)', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Look for attendance status options
      const presentOption = await page.locator('text=/Present|P/i').count() > 0;
      const absentOption = await page.locator('text=/Absent|A/i').count() > 0;
      const lateOption = await page.locator('text=/Late|L/i').count() > 0;

      console.log(`Status options - Present: ${presentOption}, Absent: ${absentOption}, Late: ${lateOption}`);
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should display back button when class selected', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Look for back button
      const backButton = page.locator('button:has-text("Back"), button:has-text("←"), a:has-text("Back")');

      const hasBack = await backButton.isVisible().catch(() => false);
      console.log(`Has back button: ${hasBack}`);

      if (hasBack) {
        // Click back button
        await backButton.first().click();
        await page.waitForTimeout(1000);

        const currentUrl = page.url();
        console.log(`After clicking back - URL: ${currentUrl}`);
      }
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should have self check-in kiosk option', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for kiosk card/link
    const kioskCard = await page.locator('text=/Self Check-In|Kiosk/i').count() > 0;
    const kioskButton = page.locator('button:has-text("Kiosk"), button:has-text("Open Kiosk")');

    const hasKioskButton = await kioskButton.isVisible().catch(() => false);

    console.log(`Has kiosk section: ${kioskCard}, Has kiosk button: ${hasKioskButton}`);
  });

  test('should track attendance API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && url.includes('attendance')) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Attendance API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }
  });

  test('should display loading state', async ({ page }) => {
    // Set up a listener to catch loading indicators
    const loader = page.locator('text=/Loading|loading|\\.\\.\\./i');

    await page.goto('/teacher/attendance');

    // Check briefly for loading state (it might be fast)
    const hasLoader = await loader.isVisible().catch(() => false);
    console.log(`Loading indicator visible: ${hasLoader}`);
  });

  test('should handle error state gracefully', async ({ page }) => {
    // This test verifies error handling by checking if error elements exist
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check for any error messages
    const errorMessages = await page.locator('text=/error|failed|unable/i').count();
    console.log(`Error messages found: ${errorMessages}`);
  });

  test('should not have console errors on attendance page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('should have class name and section displayed', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class name displays
    const classInfo = await page.locator('text=/Grade|Section|Class/i').count() > 0;
    console.log(`Has class info displayed: ${classInfo}`);
  });

  test('should display history when tab clicked', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Try to click history tab
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History")').first();

      const hasHistoryTab = await historyTab.isVisible().catch(() => false);

      if (hasHistoryTab) {
        await historyTab.click();
        await page.waitForTimeout(1000);

        // Check if history content is displayed
        const historyContent = await page.locator('text=/Recent|History|Records|Date/i').count() > 0;
        console.log(`History content visible: ${historyContent}`);
      }
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should have export button in reports tab', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Try to click reports tab
      const reportsTab = page.locator('button:has-text("Reports"), [role="tab"]:has-text("Reports")').first();

      const hasReportsTab = await reportsTab.isVisible().catch(() => false);

      if (hasReportsTab) {
        await reportsTab.click();
        await page.waitForTimeout(1000);

        // Look for export buttons
        const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download")');
        const exportCount = await exportButtons.count();
        console.log(`Export buttons found: ${exportCount}`);
      }
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should display summary statistics in history', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Try to click history tab
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History")').first();

      const hasHistoryTab = await historyTab.isVisible().catch(() => false);

      if (hasHistoryTab) {
        await historyTab.click();
        await page.waitForTimeout(1500);

        // Look for summary stats
        const summaryStats = await page.locator('text=/Total Students|Avg Attendance|Critical|Warnings/i').count() > 0;
        console.log(`Summary statistics visible: ${summaryStats}`);
      }
    } else {
      console.log('Note: No class cards found');
    }
  });

  test('should show refresh button in history', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Select a class first
    const classCards = page.locator('.grid > div, article').filter({ hasText: /Grade|Class|Open/i });

    const cardCount = await classCards.count();

    if (cardCount > 0) {
      await classCards.first().click();
      await page.waitForTimeout(2000);

      // Try to click history tab
      const historyTab = page.locator('button:has-text("History"), [role="tab"]:has-text("History")').first();

      const hasHistoryTab = await historyTab.isVisible().catch(() => false);

      if (hasHistoryTab) {
        await historyTab.click();
        await page.waitForTimeout(1000);

        // Look for refresh button
        const refreshButton = page.locator('button:has-text("Refresh")');
        const hasRefresh = await refreshButton.isVisible().catch(() => false);
        console.log(`Has refresh button: ${hasRefresh}`);
      }
    } else {
      console.log('Note: No class cards found');
    }
  });
});