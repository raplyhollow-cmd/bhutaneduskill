import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS } from '../playwright-helpers';

test.describe('Test With beforeEach', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Before each running...');
  });

  test('should run', async ({ page }) => {
    await page.goto('https://example.com');
    expect(page.url()).toContain('example');
  });
});
