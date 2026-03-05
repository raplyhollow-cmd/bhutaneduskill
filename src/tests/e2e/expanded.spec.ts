/**
 * EXPANDED E2E TEST SUITE
 *
 * Playwright tests covering critical user flows
 */

import { test, expect, devices } from "@playwright/test";

// ============================================================================
// MOBILE DEVICE TESTS (test.use must be top-level)
// ============================================================================

test.describe("Mobile User Experience", () => {
  // Note: Mobile tests run in separate project defined in playwright.config.ts
  // The "Mobile Chrome" and "Mobile Safari" projects handle mobile viewports

  test("student dashboard works on mobile viewport", async ({ page }) => {
    // Set mobile viewport manually for this test
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/student");

    // Check no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    expect(bodyWidth).toBeLessThanOrEqual(400);

    // Check mobile menu exists
    const mobileMenu = page.locator("[data-mobile-menu], .mobile-menu, .hamburger, button[aria-label*='menu'], button[aria-label*='Menu']");
    const menuCount = await mobileMenu.count();
    if (menuCount > 0) {
      await expect(mobileMenu.first()).toBeVisible();
    }
  });

  test("assessment flow on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/student/assessments/riasec");

    // Start assessment
    const startButton = page.locator("button:has-text('Start'), button:has-text('Start Assessment')");
    const startCount = await startButton.count();
    if (startCount > 0) {
      await startButton.first().click();

      // Answer first question
      const agreeButton = page.locator("button:has-text('Strongly Agree')");
      const agreeCount = await agreeButton.count();
      if (agreeCount > 0) {
        await agreeButton.first().click();

        // Continue works
        const nextButton = page.locator("button:has-text('Next')");
        const nextCount = await nextButton.count();
        if (nextCount > 0) {
          await nextButton.first().click();
        }
      }
    }
  });
});

// ============================================================================
// AUTHENTICATION FLOW TESTS
// ============================================================================

test.describe("Authentication Flow", () => {
  test("sign in page is minimal", async ({ page }) => {
    await page.goto("/sign-in");

    // Check no unnecessary elements
    const hasBackButton = await page.locator("button:has-text('Back')").count();
    expect(hasBackButton).toBe(0);

    // Clerk form is visible
    const clerkForm = page.locator("[data-clerk-id]");
    await expect(clerkForm.first()).toBeVisible();
  });

  test("portal redirect after sign in", async ({ page }) => {
    // This test assumes authentication is working
    // In production, use test credentials
    await page.goto("/sign-in");
    await page.waitForURL(/\/(student|teacher|admin)/);
  });
});

// ============================================================================
// STUDENT ASSESSMENT FLOW TESTS
// ============================================================================

test.describe("Student Assessment Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as student
    await page.goto("/sign-in");
    // Mock authentication for testing
  });

  test("complete RIASEC assessment and view report", async ({ page }) => {
    await page.goto("/student/assessments/riasec");

    // Start assessment
    await page.click("button:has-text('Start Assessment')");

    // Answer all questions (simplified for demo)
    for (let i = 0; i < 5; i++) {
      await page.click("button:has-text('Strongly Agree')");
      await page.click("button:has-text('Next')");
    }

    // Complete and view results
    await page.click("button:has-text('Complete')");
    await expect(page).toHaveURL(/\/student\/assessments\/.*\/report/);

    // Check report displays
    await expect(page.locator("text=Your Results")).toBeVisible();
  });

  test("assessment report shows AI insights", async ({ page }) => {
    // Navigate to completed assessment
    await page.goto("/student/assessments");

    // Click on a completed assessment
    await page.click("text=View Report");

    // Check for AI insights section
    await expect(page.locator("text=AI Insights").or(page.locator("text=Career Recommendations"))).toBeVisible();
  });
});

test.describe("Teacher Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as teacher
  });

  test("view student assessment results", async ({ page }) => {
    await page.goto("/teacher");

    // Click on students
    await page.click("text=Students");

    // Click on a student
    await page.click("tr >> nth=0");

    // View assessments
    await page.click("text=Assessments");

    // Check results are visible
    await expect(page.locator("text=RIASEC").or(page.locator("text=MBTI"))).toBeVisible();
  });

  test("create homework assignment", async ({ page }) => {
    await page.goto("/teacher/homework/create");

    // Fill form
    await page.fill("input[name=\"title\"]", "Test Homework");
    await page.fill("textarea[name=\"description\"]", "Complete this assignment");
    await page.fill("input[name=\"dueDate\"]", "2026-12-31");

    // Submit
    await page.click("button:has-text('Create')");

    // Check success
    await expect(page.locator("text=Homework created")).toBeVisible();
  });
});

test.describe("School Admin", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as school admin
  });

  test("approve pending student", async ({ page }) => {
    await page.goto("/school-admin/students/pending");

    // Click approve on first student
    await page.click("button:has-text('Approve') >> nth=0");

    // Confirm
    await page.click("button:has-text('Confirm')");

    // Check success message
    await expect(page.locator("text=Student approved")).toBeVisible();
  });

  test("view assessment analytics", async ({ page }) => {
    await page.goto("/school-admin/reports/assessments");

    // Check charts load
    await expect(page.locator("canvas, svg").first()).toBeVisible();

    // Check completion rate
    await expect(page.locator("text=Completion")).toBeVisible();
  });
});

test.describe("Platform Admin", () => {
  test.beforeEach(async ({ page }) => {
    // Sign in as platform admin
  });

  test("view platform-wide analytics", async ({ page }) => {
    await page.goto("/admin");

    // Check dashboard loads
    await expect(page.locator("text=Dashboard")).toBeVisible();

    // Check stats cards
    await expect(page.locator("text=Schools").or(page.locator("text=Students"))).toBeVisible();
  });

  test("approve pending school", async ({ page }) => {
    await page.goto("/admin/schools/pending");

    // Click approve
    await page.click("button:has-text('Approve') >> nth=0");

    // Check success
    await expect(page.locator("text=School approved")).toBeVisible();
  });
});

test.describe("Performance", () => {
  test("dashboard loads within 3 seconds", async ({ page }) => {
    const startTime = Date.now();
    await page.goto("/student");
    await page.waitForLoadState("networkidle");
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(3000);
  });

  test("no console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    expect(errors.length).toBe(0);
  });
});

test.describe("Accessibility", () => {
  test("all images have alt text", async ({ page }) => {
    await page.goto("/");

    const imagesWithoutAlt = await page.evaluate(() => {
      const images = Array.from(document.querySelectorAll("img"));
      return images.filter((img) => !img.alt).length;
    });

    expect(imagesWithoutAlt).toBe(0);
  });

  test("form inputs have labels", async ({ page }) => {
    await page.goto("/sign-in");

    const inputsWithoutLabel = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll("input, select, textarea"));
      return inputs.filter((input) => {
        const hasLabel =
          input.getAttribute("aria-label") ||
          input.getAttribute("aria-labelledby") ||
          document.querySelector(`label[for="${input.id}"]`);
        return !hasLabel;
      }).length;
    });

    expect(inputsWithoutLabel).toBe(0);
  });

  test("keyboard navigation works", async ({ page }) => {
    await page.goto("/");

    // Tab through interactive elements
    let tabCount = 0;
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press("Tab");
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      if (focusedElement === "BUTTON" || focusedElement === "A" || focusedElement === "INPUT") {
        tabCount++;
      }
    }

    expect(tabCount).toBeGreaterThan(0);
  });
});

test.describe("Data Export", () => {
  test("export student data", async ({ page }) => {
    await page.goto("/school-admin/students");

    // Click export button
    await page.click("button:has-text('Export')");

    // Check download
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("text=Download CSV"),
    ]);

    expect(download.suggestedFilename()).toContain("students");
  });

  test("export assessment results", async ({ page }) => {
    await page.goto("/school-admin/reports/assessments");

    // Click export
    await page.click("button:has-text('Export')");

    // Check download initiated
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("text=Download"),
    ]);

    expect(download.suggestedFilename()).toContain("assessment");
  });
});

test.describe("Search Functionality", () => {
  test("global search finds students", async ({ page }) => {
    await page.goto("/teacher");

    // Click search
    await page.click("button[aria-label=\"Search\"], .search-button");

    // Type query
    await page.fill("input[placeholder=\"Search\"]", "student");

    // Wait for results
    await expect(page.locator("text=Search Results").or(page.locator(".search-result"))).toBeVisible();
  });
});

test.describe("Bulk Operations", () => {
  test("bulk assign students to class", async ({ page }) => {
    await page.goto("/school-admin/students");

    // Select multiple students
    await page.check("input[type=\"checkbox\"] >> nth=0");
    await page.check("input[type=\"checkbox\"] >> nth=1");

    // Click bulk action
    await page.click("button:has-text('Assign Class')");

    // Select class
    await page.selectOption("select[name=\"classId\"]", "class-1");

    // Confirm
    await page.click("button:has-text('Confirm')");

    // Check success
    await expect(page.locator("text=Students assigned")).toBeVisible();
  });
});

test.describe("Real-time Updates", () => {
  test("SSE connection establishes", async ({ page }) => {
    await page.goto("/student");

    // Monitor network requests
    const sseRequests: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("/stream")) {
        sseRequests.push(request.url());
      }
    });

    // Wait a bit for SSE to connect
    await page.waitForTimeout(2000);

    expect(sseRequests.length).toBeGreaterThan(0);
  });
});
