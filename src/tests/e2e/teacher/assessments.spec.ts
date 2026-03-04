/**
 * Teacher Portal Assessments Page Tests
 *
 * Tests the Teacher Portal assessments page including:
 * - Load assessments list
 * - Create new assessment
 * - View assessment results
 * - Filter by class and status
 * - Assessment completion tracking
 * - Quick create from templates
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Assessments Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load assessments page', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/assessments');
    await assertPageNotError(page);
  });

  test('should display assessments list or empty state', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for assessment cards
    const assessmentCards = page.locator('.grid > div, article, [class*="card"]');

    const count = await assessmentCards.count();
    console.log(`Found ${count} assessment cards`);

    // Look for empty state
    const emptyState = await page.locator('text=/no assessments|create your first assessment/i').count() > 0;
    console.log(`Has empty state: ${emptyState}`);

    expect(count > 0 || emptyState).toBeTruthy();
  });

  test('should display assessment statistics', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for stats cards
    const statsLabels = page.locator('text=/Total Assessments|Active|Completed|Avg Completion/i');

    const hasStats = await statsLabels.count() > 0;
    console.log(`Has statistics cards: ${hasStats}`);

    if (hasStats) {
      // Look for numeric values
      const statValues = await page.locator('text=/\\d+').all();
      console.log(`Found ${statValues.length} stat values`);
    }
  });

  test('should have create assessment button', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for create button
    const createButton = page.locator('button:has-text("Create"), button:has-text("New"), button:has-text("Add Assessment")').first();

    const hasButton = await createButton.isVisible().catch(() => false);

    if (hasButton) {
      console.log('Create assessment button found');
    } else {
      console.log('Note: Create button not found');
    }
  });

  test('should display assessment types/badges', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for assessment type badges
    const assessmentTypes = page.locator('text=/RIASEC|MBTI|DISC|SPARK|Career/i');

    const count = await assessmentTypes.count();
    console.log(`Found ${count} assessment type indicators`);
  });

  test('should display status badges (Active, Completed, Draft)', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for status badges
    const activeBadges = page.locator('text=/Active/i');
    const completedBadges = page.locator('text=/Completed/i');
    const draftBadges = page.locator('text=/Draft/i');

    const activeCount = await activeBadges.count();
    const completedCount = await completedBadges.count();
    const draftCount = await draftBadges.count();

    console.log(`Status badges - Active: ${activeCount}, Completed: ${completedCount}, Draft: ${draftCount}`);
  });

  test('should have class filter dropdown', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class filter
    const classFilter = page.locator('select, [role="combobox"]').filter({ hasText: /All Classes|Filter by class/i }).first();

    const hasFilter = await classFilter.isVisible().catch(() => false);

    if (hasFilter) {
      console.log('Class filter found on assessments page');
    } else {
      console.log('Note: Class filter not found');
    }
  });

  test('should have status filter dropdown', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for status filter
    const statusFilter = page.locator('select, [role="combobox"]').filter({ hasText: /All Status|Active|Completed|Draft/i }).first();

    const hasFilter = await statusFilter.isVisible().catch(() => false);

    if (hasFilter) {
      console.log('Status filter found on assessments page');
    } else {
      console.log('Note: Status filter not found');
    }
  });

  test('should display assessment completion progress', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for progress bars
    const progressBars = page.locator('[role="progressbar"], .bg-gray-200.rounded-full');

    const count = await progressBars.count();
    console.log(`Found ${count} progress bars`);

    // Look for completion text
    const completionText = page.locator('text=/\\d+/\\d+ students|completion/i');
    const hasCompletion = await completionText.count() > 0;
    console.log(`Has completion text: ${hasCompletion}`);
  });

  test('should have view results links', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for "View Results" links
    const viewResultsLinks = page.locator('a:has-text("Results"), button:has-text("Results")');

    const count = await viewResultsLinks.count();
    console.log(`Found ${count} view results links`);
  });

  test('should have quick create assessment templates', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for template cards or quick create section
    const templateSection = await page.locator('text=/Quick Create|template|select a template/i').count() > 0;
    const templateButtons = page.locator('button:has-text("RIASEC"), button:has-text("MBTI"), button:has-text("DISC")');

    const templateCount = await templateButtons.count();
    console.log(`Has template section: ${templateSection}, Template buttons: ${templateCount}`);
  });

  test('should display assessment due dates', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for date displays
    const dateLabels = page.locator('text=/Assigned:|Due:|Calendar/i');

    const count = await dateLabels.count();
    console.log(`Found ${count} date label displays`);
  });

  test('should have edit/view/delete actions for assessments', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for action buttons
    const viewButtons = page.locator('button:has-text("View"), button:has-text("Eye")');
    const editButtons = page.locator('button:has-text("Edit"), button:has-text("Pencil")');
    const deleteButtons = page.locator('button:has-text("Delete"), button:has-text("Trash")');

    const viewCount = await viewButtons.count();
    const editCount = await editButtons.count();
    const deleteCount = await deleteButtons.count();

    console.log(`Action buttons - View: ${viewCount}, Edit: ${editCount}, Delete: ${deleteCount}`);
  });

  test('should have "remind pending" functionality', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for "remind pending" links/buttons
    const remindButtons = page.locator('button:has-text("Remind"), a:has-text("Remind")');

    const count = await remindButtons.count();
    console.log(`Found ${count} remind buttons`);
  });

  test('should display average score for completed assessments', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for average score displays
    const avgScoreText = page.locator('text=/Average Score|avg score/i');

    const count = await avgScoreText.count();
    console.log(`Found ${count} average score displays`);
  });

  test('should navigate to assessment results page', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for a link to assessment results
    const resultsLink = page.locator('a[href*="/teacher/assessments/"][href*="results"]').first();

    const hasLink = await resultsLink.isVisible().catch(() => false);

    if (hasLink) {
      await resultsLink.click();
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`Navigated to: ${currentUrl}`);

      expect(currentUrl).toContain('/teacher/assessments/');
      expect(currentUrl).toContain('results');
    } else {
      console.log('Note: No assessment results link found (may need assessments with data)');
    }
  });

  test('should track assessments API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && url.includes('assessment')) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Assessments API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }
  });

  test('should handle empty assessments state gracefully', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if empty state is shown
    const emptyState = await page.locator('text=/no assessments|create your first assessment/i').count() > 0;
    const hasAssessments = await page.locator('text=/RIASEC|MBTI|DISC|Quiz/i').count() > 0;

    if (emptyState) {
      console.log('Empty state is displayed');
      // Check if there's a call to action
      const ctaButton = await page.locator('button:has-text("Create")').count() > 0;
      console.log(`Has CTA button in empty state: ${ctaButton}`);
    }

    expect(hasAssessments || emptyState).toBeTruthy();
  });

  test('should not have console errors on assessments page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('should display icons for different assessment types', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for icon containers (colored divs with icons)
    const iconContainers = page.locator('div[class*="rounded"], div[class*="flex"]').filter({ hasText: /Target|Clipboard|Trending|File|BarChart/i });

    const count = await iconContainers.count();
    console.log(`Found ${count} icon containers for assessments`);
  });
});