import { test, expect } from '@playwright/test';

/**
 * Admin Login Test for raplyhollow@gmail.com
 * Tests if admin goes to dashboard or gets stuck at setup
 */

test.describe('Admin Login - raplyhollow@gmail.com', () => {
  test('should check admin login flow', async ({ page, context }) => {
    // Set base URL
    await page.goto('http://localhost:3001/sign-in');

    console.log('Navigated to sign-in page');
    console.log('Current URL:', page.url());

    // Wait for page to load
    await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      console.log('Page may still be loading...');
    });

    // Take screenshot
    await page.screenshot({ path: 'test-screenshots/admin-signin.png' });

    // Check if there's an email input field
    const emailInput = await page.locator('input[type="email"], input[name="email"]').first();
    const isVisible = await emailInput.isVisible().catch(() => false);

    console.log('Email input visible:', isVisible);

    if (isVisible) {
      console.log('Clerk sign-in form detected');
      console.log('Note: Full Clerk authentication test requires:');
      console.log('  1. Valid Clerk test credentials');
      console.log('  2. Clerk test mode enabled');
      console.log('  3. Or manual testing in browser');
    } else {
      // Check if already redirected (user might be logged in)
      const currentUrl = page.url();
      console.log('Current URL after load:', currentUrl);

      if (currentUrl.includes('/setup')) {
        console.log('❌ STUCK AT SETUP PAGE');
      } else if (currentUrl.includes('/admin') || currentUrl.includes('/dashboard')) {
        console.log('✅ REDIRECTED TO DASHBOARD');
      } else if (currentUrl.includes('clerk.accounts.dev')) {
        console.log('⚠️  Redirected to Clerk authentication');
      }
    }

    // Try to check user status via API
    try {
      const response = await context.request.get('http://localhost:3001/api/user/profile');
      console.log('API Response status:', response.status());

      if (response.status() === 401) {
        console.log('User not authenticated - expected for automatic test');
      } else {
        const data = await response.json().catch(() => ({}));
        console.log('User data:', JSON.stringify(data, null, 2));

        if (data.data?.user) {
          const user = data.data.user;
          console.log('User email:', user.email);
          console.log('User type:', user.type);
          console.log('Onboarding complete:', user.onboardingComplete);
          console.log('Onboarding status:', user.onboardingStatus);
        }
      }
    } catch (e) {
      console.log('API check failed:', e);
    }
  });

  test('should check database for raplyhollow@gmail.com', async ({ context }) => {
    // Check if user exists via a test endpoint
    try {
      const response = await context.request.get('http://localhost:3001/api/test/check-user?email=raplyhollow@gmail.com');
      console.log('Check user response:', response.status());

      if (response.ok()) {
        const data = await response.json();
        console.log('User data:', JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.log('Test endpoint not available:', e);
    }
  });
});
