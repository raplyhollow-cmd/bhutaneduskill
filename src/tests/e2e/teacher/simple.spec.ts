import { test, expect } from '@playwright/test';

test.describe('Simple Test', () => {
  test('should pass', async ({ page }) => {
    await page.goto('https://example.com');
    expect(page.url()).toContain('example');
  });
});
