import { test, expect } from '@playwright/test';
import { TEST_CREDENTIALS } from '../playwright-helpers';

test.describe('Test With Helpers', () => {
  test('should import helpers', async ({ page }) => {
    console.log('Credentials:', TEST_CREDENTIALS.teacher);
    await page.goto('https://example.com');
    expect(page.url()).toContain('example');
  });
});
