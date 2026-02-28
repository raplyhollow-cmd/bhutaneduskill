import { defineConfig, devices } from '@playwright/test';

/**
 * Temporary Playwright Configuration for QA Testing
 */
export default defineConfig({
  testDir: './src/tests/e2e/school-admin',
  fullyParallel: false,
  forbidOnly: false,
  retries: 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
    ['json', { outputFile: 'school-admin-test-results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3002',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
