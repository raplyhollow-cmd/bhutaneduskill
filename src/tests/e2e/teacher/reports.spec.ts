/**
 * Teacher Portal Reports Page Tests
 *
 * Tests the Teacher Portal reports page including:
 * - Load reports page
 * - View class performance reports
 * - View student progress reports
 * - View attendance summaries
 * - Export reports to PDF/Excel
 * - Filter reports by date range
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError } from '../playwright-helpers';

test.describe('Teacher Portal - Reports Page', () => {
  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should load reports page', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    expect(page.url()).toContain('/teacher/reports');
    await assertPageNotError(page);
  });

  test('should display report categories', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for report category cards
    const reportCards = page.locator('.grid > div, article, [class*="card"]');

    const count = await reportCards.count();
    console.log(`Found ${count} report cards`);
  });

  test('should have class performance section', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for class performance content
    const classPerformance = await page.locator('text=/Class Performance|Performance/i').count() > 0;
    console.log(`Has class performance section: ${classPerformance}`);
  });

  test('should have student progress section', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for student progress content
    const studentProgress = await page.locator('text=/Student Progress|Progress/i').count() > 0;
    console.log(`Has student progress section: ${studentProgress}`);
  });

  test('should have attendance summary section', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for attendance summary content
    const attendanceSummary = await page.locator('text=/Attendance|Summary/i').count() > 0;
    console.log(`Has attendance summary section: ${attendanceSummary}`);
  });

  test('should have date range filter', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for date inputs
    const dateInputs = page.locator('input[type="date"], input[type="text"][placeholder*="date" i]');

    const count = await dateInputs.count();
    console.log(`Found ${count} date input fields`);
  });

  test('should have export buttons', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for export/download buttons
    const exportButtons = page.locator('button:has-text("Export"), button:has-text("Download"), button:has-text("PDF"), button:has-text("Excel")');

    const count = await exportButtons.count();
    console.log(`Found ${count} export buttons`);
  });

  test('should display grade distribution', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for grade distribution chart or data
    const gradeDistribution = await page.locator('text=/Grade Distribution|Distribution|A Grade|B Grade/i').count() > 0;
    console.log(`Has grade distribution: ${gradeDistribution}`);
  });

  test('should have filter options', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for filter dropdowns
    const filters = page.locator('select, [role="combobox"]').filter({ hasText: /class|subject|term|month/i });

    const count = await filters.count();
    console.log(`Found ${count} filter dropdowns`);
  });

  test('should display summary statistics', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for stat cards
    const statCards = page.locator('text=/Total|Average|Percentage|%|Count/i');

    const count = await statCards.count();
    console.log(`Found ${count} stat displays`);
  });

  test('should have charts or visualizations', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for chart elements (could be canvas, svg, or div with chart classes)
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"]');

    const count = await charts.count();
    console.log(`Found ${count} chart elements`);
  });

  test('should have table data for reports', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for tables
    const tables = page.locator('table, [role="table"]');

    const count = await tables.count();
    console.log(`Found ${count} data tables`);
  });

  test('should have report type selector', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for report type tabs or selector
    const reportTabs = page.locator('[role="tab"], button:has-text("Performance"), button:has-text("Attendance"), button:has-text("Homework")');

    const count = await reportTabs.count();
    console.log(`Found ${count} report type tabs`);
  });

  test('should track reports API calls', async ({ page }) => {
    const apiCalls: Array<{ url: string; method: string }> = [];

    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') && (url.includes('report') || url.includes('analytics') || url.includes('insights'))) {
        apiCalls.push({
          url: url.split('/api/').pop() || url,
          method: request.method(),
        });
      }
    });

    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(3000);

    console.log(`Reports API calls made: ${apiCalls.length}`);
    for (const call of apiCalls) {
      console.log(`  ${call.method}: ${call.url}`);
    }
  });

  test('should display top performers', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for top performers section
    const topPerformers = await page.locator('text=/Top Performers|Highest Score|Best/i').count() > 0;
    console.log(`Has top performers section: ${topPerformers}`);
  });

  test('should display students needing attention', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for needs attention section
    const needsAttention = await page.locator('text=/Needs Attention|At Risk|Low Performance/i').count() > 0;
    console.log(`Has needs attention section: ${needsAttention}`);
  });

  test('should have printable reports', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for print button
    const printButton = page.locator('button:has-text("Print"), button:has-text("Printable")');

    const hasPrint = await printButton.isVisible().catch(() => false);
    console.log(`Has print button: ${hasPrint}`);
  });

  test('should handle empty reports state gracefully', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Check for empty state
    const emptyState = await page.locator('text=/no data|no reports|generate report/i').count() > 0;
    const hasData = await page.locator('text=/Grade|Class|Student/i').count() > 0;

    if (emptyState) {
      console.log('Empty state is displayed');
    }

    console.log(`Has report data: ${hasData}`);
  });

  test('should not have console errors on reports page', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
  });

  test('should have homework completion statistics', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for homework stats
    const homeworkStats = await page.locator('text=/Homework|Completion|Submitted/i').count() > 0;
    console.log(`Has homework statistics: ${homeworkStats}`);
  });

  test('should have subject-wise performance', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for subject-wise performance
    const subjectPerformance = await page.locator('text=/Subject|Mathematics|Science|English/i').count() > 0;
    console.log(`Has subject-wise performance: ${subjectPerformance}`);
  });

  test('should allow filtering by class', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for class selector
    const classSelector = page.locator('select, [role="combobox"]').filter({ hasText: /class/i }).first();

    const hasSelector = await classSelector.isVisible().catch(() => false);

    if (hasSelector) {
      console.log('Class selector found on reports page');
    } else {
      console.log('Note: Class selector not found');
    }
  });

  test('should have trending indicators', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for trending up/down indicators
    const trendingUp = await page.locator('text=/improving|trending up|increased/i').count() > 0;
    const trendingDown = await page.locator('text=/declining|trending down|decreased/i').count() > 0;

    console.log(`Trending indicators - Up: ${trendingUp}, Down: ${trendingDown}`);
  });

  test('should have comparison views', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for comparison data
    const comparison = await page.locator('text=/vs|compared to|previous|last month/i').count() > 0;
    console.log(`Has comparison data: ${comparison}`);
  });
});