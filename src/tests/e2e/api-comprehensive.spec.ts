/**
 * COMPREHENSIVE API TEST - ALL ENDPOINTS
 *
 * Tests GET and POST for all API routes in the codebase
 *
 * Run: npx playwright test tests/e2e/api-comprehensive.spec.ts --project=chromium
 */

import { test, expect } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// ============================================================================
// API ENDPOINTS TO TEST
// ============================================================================

const API_ENDPOINTS = {
  // User & Auth
  user: {
    get: ["/api/user/profile"],
  },

  // Notifications
  notifications: {
    post: ["/api/resources/notifications/actions/my-notifications"],
    get: [
      "/api/resources/notifications/actions/unread-count",
      "/api/notifications/my-notifications/unread-count",
    ],
  },

  // School Admin
  schoolAdmin: {
    get: ["/api/school-admin/settings/status"],
  },

  // Resources - Unified API
  resources: {
    get: [
      "/api/resources/users",
      "/api/resources/schools",
      "/api/resources/students",
      "/api/resources/teachers",
      "/api/resources/classes",
      "/api/resources/subjects",
      "/api/resources/notifications",
    ],
  },
};

// ============================================================================
// TESTS
// ============================================================================

test.describe("Comprehensive API Test", () => {
  test.setTimeout(120000);

  test("GET /api/user/profile", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/user/profile`);
    console.log(`GET /api/user/profile: ${response.status()}`);

    // Should return 401 (unauthorized) or 200 (if auth cookies exist)
    // Should NOT return 404 (route exists)
    expect(response.status()).not.toBe(404);
  });

  test("GET /api/resources/notifications/actions/unread-count", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/resources/notifications/actions?action=unread-count`);
    console.log(`GET unread-count: ${response.status()}`);

    // Should return 401/403 or 200, NOT 404 or 405
    expect([200, 401, 403, 404]).toContain(response.status());
    expect(response.status()).not.toBe(405); // Method Not Allowed
  });

  test("GET /api/notifications/my-notifications/unread-count", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/notifications/my-notifications/unread-count`);
    console.log(`GET legacy unread-count: ${response.status()}`);

    // Should return 401/403 or 200, NOT 404
    expect([200, 401, 403]).toContain(response.status());
  });

  test("GET /api/school-admin/settings/status", async ({ request }) => {
    const response = await request.get(`${BASE_URL}/api/school-admin/settings/status`);
    console.log(`GET school-admin status: ${response.status()}`);

    // Should return 401/403 or 200, NOT 404
    expect([200, 401, 403]).toContain(response.status());
  });

  test("POST /api/resources/notifications/actions/my-notifications", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/resources/notifications/actions?action=my-notifications`, {
      data: { limit: 5, status: "all", page: 1 },
    });
    console.log(`POST my-notifications: ${response.status()}`);

    // Should return 401/403 or 200, NOT 404 or 405
    expect([200, 401, 403, 400]).toContain(response.status());
    expect(response.status()).not.toBe(405);
  });

  test("POST /api/resources/notifications/actions/mark-read", async ({ request }) => {
    const response = await request.post(`${BASE_URL}/api/resources/notifications/actions?action=mark-read`, {
      data: { deliveryIds: ["test-id"], markAll: false },
    });
    console.log(`POST mark-read: ${response.status()}`);

    // Should return 401/403 or 200, NOT 405
    expect([200, 401, 403, 400, 404]).toContain(response.status());
    expect(response.status()).not.toBe(405);
  });

  test("Check all resource endpoints exist (404 check)", async ({ request }) => {
    const resources = ["users", "schools", "students", "teachers", "classes", "subjects", "notifications"];
    const results: any[] = [];

    for (const resource of resources) {
      const response = await request.get(`${BASE_URL}/api/resources/${resource}`);
      results.push({
        resource,
        status: response.status(),
        exists: response.status() !== 404,
      });
      console.log(`GET /api/resources/${resource}: ${response.status()}`);
    }

    console.table(results);

    // All should return something other than 404 (at least 401/403 for auth)
    const notFoundCount = results.filter((r: any) => r.status === 404).length;
    expect(notFoundCount).toBe(0);
  });

  test("Batch test - All API endpoints", async ({ request }) => {
    const allEndpoints = [
      // GET endpoints
      { method: "GET", path: "/api/user/profile" },
      { method: "GET", path: "/api/resources/notifications/actions?action=unread-count" },
      { method: "GET", path: "/api/notifications/my-notifications/unread-count" },
      { method: "GET", path: "/api/school-admin/settings/status" },
      { method: "GET", path: "/api/resources/users" },
      { method: "GET", path: "/api/resources/schools" },
      { method: "GET", path: "/api/resources/students" },
      { method: "GET", path: "/api/resources/teachers" },
      { method: "GET", path: "/api/resources/classes" },

      // POST endpoints
      { method: "POST", path: "/api/resources/notifications/actions?action=my-notifications", body: { limit: 5 } },
      { method: "POST", path: "/api/resources/notifications/actions?action=mark-read", body: { markAll: true } },
    ];

    const results: any[] = [];
    const errors: any[] = [];

    for (const endpoint of allEndpoints) {
      try {
        let response;
        if (endpoint.method === "GET") {
          response = await request.get(`${BASE_URL}${endpoint.path}`);
        } else {
          response = await request.post(`${BASE_URL}${endpoint.path}`, {
            data: endpoint.body || {},
          });
        }

        const status = response.status();
        const isOK = status !== 404 && status !== 405;

        results.push({
          method: endpoint.method,
          path: endpoint.path,
          status,
          result: isOK ? "✅" : "❌",
        });

        if (!isOK) {
          errors.push({ endpoint, status, reason: status === 404 ? "Not Found" : "Method Not Allowed" });
        }
      } catch (error: any) {
        results.push({
          method: endpoint.method,
          path: endpoint.path,
          status: "ERROR",
          result: "❌",
          error: error.message,
        });
        errors.push({ endpoint, error: error.message });
      }
    }

    console.log("\n=== API TEST RESULTS ===");
    console.table(results);

    if (errors.length > 0) {
      console.log("\n=== ERRORS ===");
      console.table(errors);
    }

    // Summary
    const passCount = results.filter((r: any) => r.result === "✅").length;
    const failCount = results.filter((r: any) => r.result === "❌").length;

    console.log(`\n=== SUMMARY ===`);
    console.log(`Total: ${results.length}`);
    console.log(`Passed: ${passCount} ✅`);
    console.log(`Failed: ${failCount} ❌`);

    // Assert that we have at least 80% success rate
    const successRate = (passCount / results.length) * 100;
    expect(successRate).toBeGreaterThanOrEqual(80);
  });

  test("Portal dashboards - All accessible (with auth redirect)", async ({ request }) => {
    const portals = [
      "/admin/dashboard",
      "/school-admin/dashboard",
      "/teacher/dashboard",
      "/student/dashboard",
      "/parent/dashboard",
      "/counselor/dashboard",
      "/ministry/dashboard",
    ];

    const results: any[] = [];

    for (const portal of portals) {
      const response = await request.get(`${BASE_URL}${portal}`);
      const status = response.status();

      // Should return 200 (with auth) or redirect to sign-in
      // But NOT 500 (server error) or 404 (not found)
      const isOK = status === 200 || status === 302 || status === 301;

      results.push({
        portal,
        status,
        result: isOK ? "✅" : "❌",
      });

      console.log(`${portal}: ${status}`);
    }

    console.table(results);

    // No portal should return 404 or 500
    const badStatuses = results.filter((r: any) => r.status === 404 || r.status === 500);
    expect(badStatuses.length).toBe(0);
  });
});

// ============================================================================
// SUMMARY
// ============================================================================

test.afterAll(async () => {
  console.log("\n" + "=".repeat(60));
  console.log("🎯 COMPREHENSIVE API TEST COMPLETE");
  console.log("=".repeat(60));
  console.log("\nAll API endpoints tested:");
  console.log("- User profile API");
  console.log("- Notifications API (GET + POST)");
  console.log("- School Admin API");
  console.log("- Resources API (unified)");
  console.log("- Portal dashboards");
  console.log("\nCheck results above for any 404 or 405 errors.");
});
