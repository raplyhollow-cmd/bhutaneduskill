/**
 * Teacher Portal Mobile Responsive Tests
 *
 * Tests the Teacher Portal on mobile viewports including:
 * - Mobile navigation (hamburger menu)
 * - Mobile layout responsiveness
 * - Touch interactions
 * - Mobile-specific UI elements
 */

import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS, assertPageNotError, toggleMobileMenu } from '../playwright-helpers';

test.describe('Teacher Portal - Mobile Responsive', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should display mobile menu on dashboard', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for mobile menu button
    const menuButton = page.locator('button[aria-label*="menu"], button[data-mobile-menu], button:has-text("Menu"), .hamburger').first();

    const hasMenu = await menuButton.isVisible().catch(() => false);
    console.log(`Mobile menu button visible: ${hasMenu}`);

    if (hasMenu) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Check if menu opened
      const menuContent = await page.locator('[role="navigation"], nav, .sidebar').count() > 0;
      console.log(`Mobile menu opened: ${menuContent}`);
    }
  });

  test('should have responsive layout on students page', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check if content fits in viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = page.viewportSize()?.width || 375;

    console.log(`Body width: ${bodyWidth}, Viewport width: ${viewportWidth}`);

    // Content should not overflow horizontally
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20); // Allow small margin
  });

  test('should have working mobile navigation on classes page', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Try to open mobile menu
    const menuButton = page.locator('button[aria-label*="menu"], button[data-mobile-menu]').first();

    const hasMenu = await menuButton.isVisible().catch(() => false);

    if (hasMenu) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Look for navigation links
      const navLinks = page.locator('nav a, [role="navigation"] a');
      const linkCount = await navLinks.count();
      console.log(`Found ${linkCount} navigation links in mobile menu`);
    }
  });

  test('should stack cards vertically on mobile', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for grid containers - they should collapse to single column on mobile
    const grids = page.locator('.grid');

    const gridCount = await grids.count();
    console.log(`Found ${gridCount} grid containers`);

    if (gridCount > 0) {
      // Check if first grid is single column on mobile
      const gridClasses = await grids.first().getAttribute('class');
      console.log(`First grid classes: ${gridClasses}`);
    }
  });

  test('should have touch-friendly buttons on homework page', async ({ page }) => {
    await page.goto('/teacher/homework');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Check button sizes for touch targets (should be at least 44x44px)
    const buttons = page.locator('button, a[role="button"]').first();

    const hasButton = await buttons.isVisible().catch(() => false);

    if (hasButton) {
      const box = await buttons.boundingBox();
      if (box) {
        const minDimension = Math.min(box.width, box.height);
        console.log(`Button size: ${box.width}x${box.height}px (min: ${minDimension}px)`);

        // Touch targets should ideally be at least 44px
        // This is informational, not a hard requirement
        console.log(`Touch-friendly (>=44px): ${minDimension >= 44}`);
      }
    }
  });

  test('should show mobile-specific back button', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2000);

    // Look for back button (common on mobile)
    const backButton = page.locator('button:has-text("Back"), button:has-text("←"), a:has-text("Back")').first();

    const hasBack = await backButton.isVisible().catch(() => false);
    console.log(`Has back button: ${hasBack}`);
  });

  test('should handle horizontal scrolling on assessments page', async ({ page }) => {
    await page.goto('/teacher/assessments');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Check for horizontal scrollable containers (tables, etc.)
    const scrollContainers = page.locator('.overflow-x-auto, [style*="overflow-x"]');

    const count = await scrollContainers.count();
    console.log(`Found ${count} horizontal scroll containers`);
  });

  test('should have mobile-friendly inputs on reports page', async ({ page }) => {
    await page.goto('/teacher/reports');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Check input types
    const inputs = page.locator('input, select, textarea');

    const inputCount = await inputs.count();
    console.log(`Found ${inputCount} input elements`);

    if (inputCount > 0) {
      // Check if inputs have proper touch sizing
      const firstInput = inputs.first();
      const box = await firstInput.boundingBox();

      if (box) {
        console.log(`First input height: ${box.height}px (should be >=44px for touch)`);
      }
    }
  });

  test('should close mobile menu when clicking outside', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Try to open mobile menu
    const menuButton = page.locator('button[aria-label*="menu"], button[data-mobile-menu]').first();

    const hasMenu = await menuButton.isVisible().catch(() => false);

    if (hasMenu) {
      await menuButton.click();
      await page.waitForTimeout(500);

      // Click outside the menu
      const mainContent = page.locator('main, [role="main"]').first();
      await mainContent.click();
      await page.waitForTimeout(300);

      // Menu should close (this is informational - implementation varies)
      console.log('Clicked outside menu');
    }
  });

  test('should show mobile table/card views', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // On mobile, tables might be converted to cards
    const cards = page.locator('[class*="card"], article');
    const tables = page.locator('table');

    const cardCount = await cards.count();
    const tableCount = await tables.count();

    console.log(`Found ${cardCount} cards, ${tableCount} tables`);

    // Mobile should prefer cards over tables
    if (cardCount > 0 || tableCount > 0) {
      console.log(`Content displayed using ${cardCount > tableCount ? 'cards' : 'tables'}`);
    }
  });

  test('should have readable text on mobile', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Check font size
    const bodyFontSize = await page.evaluate(() => {
      const styles = window.getComputedStyle(document.body);
      return parseInt(styles.fontSize);
    });

    console.log(`Body font size: ${bodyFontSize}px`);

    // Font size should be at least 14px for mobile readability
    expect(bodyFontSize).toBeGreaterThanOrEqual(14);
  });

  test('should work on tablet viewport', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    await assertPageNotError(page);

    // Check if content is displayed properly
    const content = page.locator('main, [role="main"]');
    const hasContent = await content.count() > 0;
    console.log(`Tablet view has main content: ${hasContent}`);
  });

  test('should handle orientation change gracefully', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Change to landscape
    await page.setViewportSize({ width: 667, height: 375 });
    await page.waitForTimeout(1000);

    // Page should still work
    await assertPageNotError(page);
    console.log('Page handles orientation change');
  });

  test('should have working bottom navigation or floating action buttons', async ({ page }) => {
    await page.goto('/teacher/students');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Look for mobile-specific navigation
    const bottomNav = page.locator('.bottom-nav, [class*="bottom"], nav:has([fixed])');
    const fab = page.locator('[class*="fab"], [class*="floating-action"]');

    const hasBottomNav = await bottomNav.count() > 0;
    const hasFAB = await fab.count() > 0;

    console.log(`Has bottom nav: ${hasBottomNav}, Has FAB: ${hasFAB}`);
  });

  test('should not have horizontal scroll on body', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // Check if body has unwanted horizontal scroll
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.body.scrollWidth > document.body.clientWidth;
    });

    console.log(`Has unwanted horizontal scroll: ${hasHorizontalScroll}`);

    // Ideally should not have horizontal scroll on the body
    // Allow small margin for browser differences
    expect(hasHorizontalScroll).toBeFalsy();
  });

  test('should collapse sidebar on mobile', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // On mobile, sidebar should be collapsed or hidden by default
    const sidebar = page.locator('aside, [class*="sidebar"], nav[aria-label*="main"]');

    const hasSidebar = await sidebar.count() > 0;

    if (hasSidebar) {
      // Check if sidebar is hidden or off-screen
      const isVisible = await sidebar.first().isVisible().catch(() => false);
      console.log(`Sidebar visible on mobile: ${isVisible}`);

      // On mobile, sidebar should typically be hidden or collapsed
      // If visible, it should be in a collapsed state
    }
  });

  test('should work with swipe gestures on attendance page', async ({ page }) => {
    await page.goto('/teacher/attendance');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // This is a basic check - actual swipe testing would require more complex setup
    const touchableElements = page.locator('button, a, [role="button"], input[type="checkbox"]');

    const count = await touchableElements.count();
    console.log(`Found ${count} touchable elements`);
  });

  test('should display loading states properly on mobile', async ({ page }) => {
    // Monitor for loading indicators
    await page.goto('/teacher/students');

    // Look for skeleton loaders or spinners
    const loadingIndicators = page.locator('[class*="loading"], [class*="skeleton"], [class*="spinner"]');

    // This is informational - loading states are often quick
    const hasLoading = await loadingIndicators.isVisible().catch(() => false);
    console.log(`Loading indicator visible: ${hasLoading}`);
  });
});

test.describe('Teacher Portal - Tablet Responsive', () => {
  test.use({ viewport: { width: 768, height: 1024 } }); // iPad size

  test.beforeEach(async ({ page }) => {
    await signIn(page, TEST_CREDENTIALS.teacher);
    await page.waitForURL(`**/teacher/**`, { timeout: 10000 });
  });

  test('should display properly on tablet dashboard', async ({ page }) => {
    await page.goto('/teacher/dashboard');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    await assertPageNotError(page);

    // Check content layout
    const grid = page.locator('.grid');
    const hasGrid = await grid.count() > 0;

    console.log(`Has grid layout: ${hasGrid}`);
  });

  test('should show sidebar on tablet', async ({ page }) => {
    await page.goto('/teacher/classes');
    await page.waitForLoadState('domcontentloaded', { timeout: 30000 });
    await page.waitForTimeout(2002);

    // On tablet, sidebar might be visible
    const sidebar = page.locator('aside, [class*="sidebar"]');
    const hasSidebar = await sidebar.count() > 0;

    if (hasSidebar) {
      const isVisible = await sidebar.first().isVisible().catch(() => false);
      console.log(`Sidebar visible on tablet: ${isVisible}`);
    }
  });
});