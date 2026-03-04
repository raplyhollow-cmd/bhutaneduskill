import { test, expect } from '@playwright/test';
import { signIn, TEST_CREDENTIALS } from '../playwright-helpers';

test.describe('Test With signIn', () => {
  test('should import signIn', async ({ page }) => {
    console.log('Test starting...');
    await page.goto('https://example.com');
    expect(page.url()).toContain('example');
  });
});
