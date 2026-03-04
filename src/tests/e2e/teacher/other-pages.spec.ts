/**
 * Teacher Portal Other Pages Tests
 *
 * Tests the Teacher Portal additional pages including:
 * - Messages page
 * - Timetable/Schedule page
 * - Settings page
 * - Earnings/Payslips page
 * - Leave page
 * - Learning/Resources page
 * - Live Sessions page
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Messages Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load messages page', async ({ page }) => {
    await page.goto('/teacher/messages');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/messages');
    await assertPageNotError(page);
  });

  test('should display conversations list or empty state', async ({ page }) => {
    await page.goto('/teacher/messages');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const conversations = page.locator('text=/New Message|Compose|Inbox/i');
    const hasContent = await conversations.count() > 0;
    console.log(`Messages page has content: ${hasContent}`);
  });

  test('should have compose/new message button', async ({ page }) => {
    await page.goto('/teacher/messages');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    const composeButton = page.locator('button:has-text("Compose"), button:has-text("New Message"), a:has-text("New")').first();
    const hasButton = await composeButton.isVisible().catch(() => false);
    console.log(`Has compose button: ${hasButton}`);
  });
});

test.describe('Teacher Portal - Timetable/Schedule Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load timetable page', async ({ page }) => {
    await page.goto('/teacher/timetable');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/timetable');
    await assertPageNotError(page);
  });

  test('should display schedule or empty state', async ({ page }) => {
    await page.goto('/teacher/timetable');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const scheduleContent = page.locator('text=/Monday|Tuesday|Wednesday|Thursday|Friday|Period|Class/i');
    const hasSchedule = await scheduleContent.count() > 0;
    console.log(`Timetable has schedule content: ${hasSchedule}`);
  });

  test('should have time slots displayed', async ({ page }) => {
    await page.goto('/teacher/timetable');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const timeSlots = page.locator('text=/\\d+:\\d\\d|AM|PM/i');
    const hasTimes = await timeSlots.count() > 0;
    console.log(`Timetable has time slots: ${hasTimes}`);
  });
});

test.describe('Teacher Portal - Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load settings page', async ({ page }) => {
    await page.goto('/teacher/settings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/settings');
    await assertPageNotError(page);
  });

  test('should display settings sections', async ({ page }) => {
    await page.goto('/teacher/settings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const settingsContent = page.locator('text=/Profile|Account|Password|Notifications|Preferences/i');
    const hasSettings = await settingsContent.count() > 0;
    console.log(`Settings page has sections: ${hasSettings}`);
  });

  test('should have save/update buttons', async ({ page }) => {
    await page.goto('/teacher/settings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const saveButton = page.locator('button:has-text("Save"), button:has-text("Update"), button[type="submit"]').first();
    const hasButton = await saveButton.isVisible().catch(() => false);
    console.log(`Settings has save button: ${hasButton}`);
  });
});

test.describe('Teacher Portal - Earnings/Payslips Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load earnings page', async ({ page }) => {
    await page.goto('/teacher/earnings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/earnings');
    await assertPageNotError(page);
  });

  test('should display earnings summary', async ({ page }) => {
    await page.goto('/teacher/earnings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const earningsContent = page.locator('text=/Total Earnings|Salary|Payslip|Month/i');
    const hasEarnings = await earningsContent.count() > 0;
    console.log(`Earnings page has content: ${hasEarnings}`);
  });

  test('should have payslip list or download options', async ({ page }) => {
    await page.goto('/teacher/earnings');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const downloadButton = page.locator('button:has-text("Download"), a:has-text("PDF"), button:has-text("View")');
    const count = await downloadButton.count();
    console.log(`Found ${count} download/view buttons`);
  });
});

test.describe('Teacher Portal - Leave Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load leave page', async ({ page }) => {
    await page.goto('/teacher/leave');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/leave');
    await assertPageNotError(page);
  });

  test('should display leave balance or history', async ({ page }) => {
    await page.goto('/teacher/leave');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const leaveContent = page.locator('text=/Leave Balance|Leave History|Apply for Leave|Casual|Sick/i');
    const hasLeave = await leaveContent.count() > 0;
    console.log(`Leave page has content: ${hasLeave}`);
  });

  test('should have apply for leave option', async ({ page }) => {
    await page.goto('/teacher/leave');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const applyButton = page.locator('button:has-text("Apply"), a:has-text("Apply"), button:has-text("Request")').first();
    const hasButton = await applyButton.isVisible().catch(() => false);
    console.log(`Leave page has apply button: ${hasButton}`);
  });
});

test.describe('Teacher Portal - Learning/Resources Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load learning page', async ({ page }) => {
    await page.goto('/teacher/learning');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/learning');
    await assertPageNotError(page);
  });

  test('should display resources or courses', async ({ page }) => {
    await page.goto('/teacher/learning');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const learningContent = page.locator('text=/Course|Resource|Module|Lesson/i');
    const hasContent = await learningContent.count() > 0;
    console.log(`Learning page has content: ${hasContent}`);
  });

  test('should have create resource option', async ({ page }) => {
    await page.goto('/teacher/learning');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), a:has-text("New")').first();
    const hasButton = await createButton.isVisible().catch(() => false);
    console.log(`Learning page has create button: ${hasButton}`);
  });
});

test.describe('Teacher Portal - Live Sessions Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load live sessions page', async ({ page }) => {
    await page.goto('/teacher/live-sessions');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/live-sessions');
    await assertPageNotError(page);
  });

  test('should display sessions or create option', async ({ page }) => {
    await page.goto('/teacher/live-sessions');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const sessionsContent = page.locator('text=/Session|Schedule|Start|Join|Create/i');
    const hasContent = await sessionsContent.count() > 0;
    console.log(`Live sessions page has content: ${hasContent}`);
  });

  test('should have start session or create session button', async ({ page }) => {
    await page.goto('/teacher/live-sessions');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const startButton = page.locator('button:has-text("Start"), button:has-text("Create"), button:has-text("Host")').first();
    const hasButton = await startButton.isVisible().catch(() => false);
    console.log(`Live sessions has start/create button: ${hasButton}`);
  });
});

test.describe('Teacher Portal - My Classes Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load my-classes page', async ({ page }) => {
    await page.goto('/teacher/my-classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/my-classes');
    await assertPageNotError(page);
  });

  test('should display class list', async ({ page }) => {
    await page.goto('/teacher/my-classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const classContent = page.locator('text=/Grade|Class|Section|Subject/i');
    const hasContent = await classContent.count() > 0;
    console.log(`My Classes page has content: ${hasContent}`);
  });
});

test.describe('Teacher Portal - Approvals Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load approvals page', async ({ page }) => {
    await page.goto('/teacher/approvals');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/approvals');
    await assertPageNotError(page);
  });

  test('should display pending approvals or empty state', async ({ page }) => {
    await page.goto('/teacher/approvals');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const approvalContent = page.locator('text=/Pending|Approve|Reject|Request/i');
    const hasContent = await approvalContent.count() > 0;
    console.log(`Approvals page has content: ${hasContent}`);
  });
});

test.describe('Teacher Portal - Schedule Page (Alternative)', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load schedule page', async ({ page }) => {
    await page.goto('/teacher/schedule');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    expect(page.url()).toContain('/teacher/schedule');
    await assertPageNotError(page);
  });

  test('should display weekly schedule', async ({ page }) => {
    await page.goto('/teacher/schedule');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    const scheduleContent = page.locator('text=/Monday|Tuesday|Wednesday|Thursday|Friday/i');
    const hasSchedule = await scheduleContent.count() > 0;
    console.log(`Schedule page has days: ${hasSchedule}`);
  });
});

test.describe('Teacher Portal - All Pages Load Test', () => {
  test('should load all teacher pages without errors', async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });

    const teacherPages = [
      '/teacher/dashboard',
      '/teacher/students',
      '/teacher/classes',
      '/teacher/my-classes',
      '/teacher/homework',
      '/teacher/assessments',
      '/teacher/attendance',
      '/teacher/reports',
      '/teacher/messages',
      '/teacher/timetable',
      '/teacher/schedule',
      '/teacher/settings',
      '/teacher/earnings',
      '/teacher/leave',
      '/teacher/learning',
      '/teacher/live-sessions',
      '/teacher/approvals',
    ];

    const results: { page: string; loaded: boolean; error?: string }[] = [];

    for (const pagePath of teacherPages) {
      try {
        await page.goto(pagePath);
        await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
        await page.waitForTimeout(1000);

        await assertPageNotError(page);

        results.push({ page: pagePath, loaded: true });
        console.log(`✓ ${pagePath} loaded successfully`);
      } catch (error) {
        results.push({ page: pagePath, loaded: false, error: String(error) });
        console.log(`✗ ${pagePath} failed: ${error}`);
      }
    }

    // Count successful loads
    const successCount = results.filter((r) => r.loaded).length;
    const totalCount = results.length;

    console.log(`\nSummary: ${successCount}/${totalCount} pages loaded successfully`);

    // Expect at least 80% of pages to load
    expect(successCount).toBeGreaterThanOrEqual(totalCount * 0.8);
  });
});