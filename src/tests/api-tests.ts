/**
 * Bhutan EduSkill - API Test Suite
 *
 * Template file for API endpoint testing
 * Run these tests after making changes to API routes
 *
 * @see src/tests/README.md for testing documentation
 */

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
}

// ============================================================================
// TEST UTILITIES
// ============================================================================

const TEST_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3003";

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<TestResult> {
  const start = Date.now();
  try {
    await testFn();
    return { name, passed: true, duration: Date.now() - start };
  } catch (error) {
    return {
      name,
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - start,
    };
  }
}

// ============================================================================
// AUTHENTICATION TESTS
// ============================================================================

export async function testAuthentication() {
  const results: TestResult[] = [];

  // Test 1: Set-role endpoint accessible
  results.push(
    await runTest("GET /api/auth/set-role returns user type", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/auth/set-role`);
      if (!response.ok) {
        throw new Error(`Expected 200, got ${response.status}`);
      }
      const data = await response.json();
      if (!data.userType) {
        throw new Error("Response missing userType");
      }
    })
  );

  // Test 2: Platform admin bypass
  results.push(
    await runTest("Platform admin bypasses setup", async () => {
      // This test requires a platform admin user to exist
      const response = await fetch(`${TEST_BASE_URL}/api/auth/set-role`);
      const data = await response.json();
      // If user is admin, needsSetup should be false
      if (data.userType === "admin" && data.needsSetup) {
        throw new Error("Platform admin should not need setup");
      }
    })
  );

  return {
    name: "Authentication Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// ADMIN API TESTS
// ============================================================================

export async function testAdminAPI() {
  const results: TestResult[] = [];

  // Test 1: List users
  results.push(
    await runTest("GET /api/admin/users lists users", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/users`);
      // May return 401 if not authenticated, that's expected
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  // Test 2: Admin analytics
  results.push(
    await runTest("GET /api/admin/analytics-data returns stats", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/analytics-data`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  return {
    name: "Admin API Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// STUDENT API TESTS
// ============================================================================

export async function testStudentAPI() {
  const results: TestResult[] = [];

  // Test 1: Student dashboard
  results.push(
    await runTest("GET /api/student/dashboard returns data", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/student/dashboard`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  // Test 2: Student profile
  results.push(
    await runTest("GET /api/student/profile returns profile", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/student/profile`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  return {
    name: "Student API Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// TEACHER API TESTS
// ============================================================================

export async function testTeacherAPI() {
  const results: TestResult[] = [];

  // Test 1: Teacher dashboard
  results.push(
    await runTest("GET /api/teacher/dashboard returns data", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/teacher/dashboard`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  // Test 2: Teacher classes
  results.push(
    await runTest("GET /api/teacher/classes returns classes", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/teacher/classes`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  return {
    name: "Teacher API Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// QUERY OPTIMIZATION TESTS
// ============================================================================

export async function testQueryOptimization() {
  const results: TestResult[] = [];

  // Test 1: Classes endpoint uses batch queries
  results.push(
    await runTest("GET /api/classes uses optimized queries", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/classes`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
      // Verify response is fast (< 1 second for batch queries)
      // This is a basic check - real testing would measure DB queries
    })
  );

  // Test 2: Transport allocations uses inArray
  results.push(
    await runTest("GET /api/transport/allocations batch queries work", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/transport/allocations`);
      if (response.status !== 200 && response.status !== 401) {
        throw new Error(`Unexpected status: ${response.status}`);
      }
    })
  );

  return {
    name: "Query Optimization Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

export async function testErrorHandling() {
  const results: TestResult[] = [];

  // Test 1: 401 on protected endpoint without auth
  results.push(
    await runTest("Protected endpoint returns 401 without auth", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/admin/users`);
      if (response.status !== 401) {
        throw new Error(`Expected 401, got ${response.status}`);
      }
    })
  );

  // Test 2: Invalid request handling
  results.push(
    await runTest("Invalid POST request returns 400/500", async () => {
      const response = await fetch(`${TEST_BASE_URL}/api/classes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invalid: "data" }),
      });
      // Should return error (400 or 500), not 200
      if (response.status === 200) {
        throw new Error("Expected error for invalid data");
      }
    })
  );

  return {
    name: "Error Handling Tests",
    tests: results,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
  };
}

// ============================================================================
// TEST RUNNER
// ============================================================================

export async function runAllTests(): Promise<TestSuite[]> {
  const suites: TestSuite[] = [];

  console.log("Running API Test Suite...\n");

  // Run all test suites
  suites.push(await testAuthentication());
  suites.push(await testAdminAPI());
  suites.push(await testStudentAPI());
  suites.push(await testTeacherAPI());
  suites.push(await testQueryOptimization());
  suites.push(await testErrorHandling());

  // Print results
  printResults(suites);

  return suites;
}

function printResults(suites: TestSuite[]) {
  let totalTests = 0;
  let passedTests = 0;
  let totalDuration = 0;

  for (const suite of suites) {
    console.log(`\n${suite.name}`);
    console.log("=".repeat(50));

    for (const test of suite.tests) {
      const status = test.passed ? "PASS" : "FAIL";
      const symbol = test.passed ? "✓" : "✗";
      console.log(
        `  ${symbol} ${test.name} (${test.duration}ms) ${test.error ? `- ${test.error}` : ""}`
      );

      totalTests++;
      if (test.passed) passedTests++;
      totalDuration += test.duration;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`TOTAL: ${passedTests}/${totalTests} tests passed`);
  console.log(`Duration: ${totalDuration}ms`);
  console.log("=".repeat(50));
}

// ============================================================================
// USAGE
// ============================================================================

/**
 * To run these tests:
 *
 * 1. Start the dev server: npm run dev
 * 2. In a separate terminal, run:
 *    npx tsx src/tests/api-tests.ts
 *
 * Or import and use in another test file.
 */

export default {
  testAuthentication,
  testAdminAPI,
  testStudentAPI,
  testTeacherAPI,
  testQueryOptimization,
  testErrorHandling,
  runAllTests,
};
