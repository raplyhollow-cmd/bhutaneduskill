# Bhutan EduSkill - E2E Test Documentation

## Overview

Complete listing of all End-to-End (E2E) tests for the Bhutan EduSkill platform using Playwright.

**Test Configuration:** [playwright.config.ts](../playwright.config.ts)
**Test Directory:** `src/tests/e2e`
**Base URL:** `http://localhost:3003`
**Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari

---

## Test Categories

### 1. Unified API Tests (`unified-api.spec.ts`)

Tests for the universal API architecture at `/api/resources/[resource]`

| Test | Description |
|------|-------------|
| `should list students with pagination` | GET /api/resources/students with pagination |
| `should filter students by class` | Filter by classId |
| `should sort students by name` | Sort by name asc/desc |
| `should search students by name` | Search functionality |
| `should get single student by ID` | GET /api/resources/students/:id |
| `should return 404 for non-existent student` | 404 error handling |
| `should create new student` | POST /api/resources/students |
| `should update existing student` | PUT /api/resources/students/:id |
| `should delete student` | DELETE /api/resources/students/:id |
| **Feature: Teachers** | |
| `should list all teachers` | GET /api/resources/teachers |
| `should filter teachers by subject` | Filter by subjectId |
| **Feature: Classes** | |
| `should list all classes` | GET /api/resources/classes |
| `should filter classes by grade` | Filter by grade |
| **Feature: Subjects** | |
| `should list all subjects` | GET /api/resources/subjects |
| **Feature: Attendance** | |
| `should list attendance records` | GET /api/resources/attendance |
| `should filter attendance by date range` | Date range filter |
| **Feature: Homework** | |
| `should list homework assignments` | GET /api/resources/homework |
| `should filter homework by class` | Filter by classId |
| **Permissions** | |
| `should deny access without auth` | 401/403 for unauthenticated |
| `should allow read for school-admin` | Role-based access |
| `should deny delete for teacher` | Role restrictions |
| **Validation** | |
| `should reject student without required fields` | 400 validation error |
| `should reject invalid email format` | Email validation |
| **Performance** | |
| `should list 100 items in under 1 second` | Performance benchmark |
| `should handle concurrent requests` | Concurrent request handling |
| **Error Handling** | |
| `should return 400 for invalid query parameter` | Query param validation |
| `should return 404 for invalid resource` | Resource not found |
| `should return proper error message` | Error message format |

**Total Unified API Tests:** ~30 tests

---

### 2. Unified UI Tests (`unified-ui.spec.ts`)

Tests for the unified UI components system.

**Total Unified UI Tests:** ~10 tests

---

### 3. Teacher Portal Tests

#### Dashboard (`teacher/dashboard.spec.ts`)

| Test | Description |
|------|-------------|
| `should load dashboard page` | Page load verification |
| `should display dashboard content` | Content rendering |
| `should have working navigation` | Navigation functionality |
| `should not have console errors` | Console error check |
| **Navigation Tests** | |
| `should load My Classes page` | /teacher/classes |
| `should load Students page` | /teacher/students |
| `should load Homework page` | /teacher/homework |
| `should load Assessments page` | /teacher/assessments |
| `should load Attendance page` | /teacher/attendance |
| `should load Reports page` | /teacher/reports |
| `should load Earnings page` | /teacher/earnings |
| **Button Tests** | |
| `should find buttons on dashboard` | Button rendering |
| **API Tests** | |
| `should track API calls on dashboard load` | API call tracking |

**Total Teacher Dashboard Tests:** ~15 tests

#### Other Teacher Tests

| File | Tests |
|------|-------|
| `teacher/authentication.spec.ts` | Login, logout, auth flows |
| `teacher/students.spec.ts` | Student management, filtering |
| `teacher/classes.spec.ts` | Class management |
| `teacher/assessments.spec.ts` | Assessment CRUD |
| `teacher/attendance.spec.ts` | Attendance marking |
| `teacher/reports.spec.ts` | Report generation |
| `teacher/homework.spec.ts` | Homework assignment |
| `teacher/other-pages.spec.ts` | Other pages |
| `teacher/mobile.spec.ts` | Mobile responsiveness |
| `teacher/simple.spec.ts` | Simple smoke tests |
| `teacher/test-with-helpers.spec.ts` | Helper function tests |
| `teacher/test-signin.spec.ts` | Sign-in flow tests |
| `teacher/test-beforeeach.spec.ts` | Setup/teardown tests |
| `teacher/api-integration.spec.ts` | API integration |

**Total Teacher Portal Tests:** ~100+ tests

---

### 4. Student Portal Tests

| File | Description |
|------|-------------|
| `student/dashboard.spec.ts` | Student dashboard, homework, grades |

**Total Student Portal Tests:** ~15 tests

---

### 5. School Admin Portal Tests

| File | Description |
|------|-------------|
| `school-admin/dashboard.spec.ts` | Admin dashboard |
| `school-admin/students.spec.ts` | Student management |

**Total School Admin Tests:** ~20 tests

---

### 6. Parent Portal Tests

| File | Description |
|------|-------------|
| `parent/dashboard.spec.ts` | Parent dashboard, child monitoring |

**Total Parent Portal Tests:** ~10 tests

---

### 7. Counselor Portal Tests

| File | Description |
|------|-------------|
| `counselor/dashboard.spec.ts` | Counselor dashboard |

**Total Counselor Portal Tests:** ~10 tests

---

### 8. Platform Admin Tests

| File | Description |
|------|-------------|
| `admin/dashboard.spec.ts` | Platform admin dashboard |

**Total Platform Admin Tests:** ~10 tests

---

### 9. Ministry Portal Tests

| File | Description |
|------|-------------|
| `ministry/dashboard.spec.ts` | Ministry dashboard |

**Total Ministry Portal Tests:** ~10 tests

---

### 10. Cross-Portal Tests

| File | Description |
|------|-------------|
| `cross-portal/authentication.spec.ts` | Cross-portal authentication flows |

**Total Cross-Portal Tests:** ~15 tests

---

### 11. Regression Tests

| File | Description |
|------|-------------|
| `regression/known-bugs.spec.ts` | Known bug regression tests |

**Total Regression Tests:** ~10 tests

---

### 12. Expanded Tests

| File | Description |
|------|-------------|
| `expanded.spec.ts` | Expanded feature tests |

**Total Expanded Tests:** ~20 tests

---

## Test Fixtures

### Database Fixture (`fixtures/database.fixture.ts`)
- Database setup/teardown
- Test data seeding
- Database cleanup

### Auth Fixture (`fixtures/auth.fixture.ts`)
- Authentication setup
- Test user creation
- Token management

---

## Running Tests

### Run All Tests
```bash
npm run test:e2e
# or
npx playwright test
```

### Run Specific Test File
```bash
npx playwright test src/tests/e2e/teacher/dashboard.spec.ts
```

### Run Specific Test Suite
```bash
# Teacher portal only
npx playwright test --project=chromium src/tests/e2e/teacher/

# With grep filter
npx playwright test --grep "dashboard"
```

### Run in Specific Browser
```bash
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project="Mobile Chrome"
```

### Debug Mode
```bash
npx playwright test --debug
```

### UI Mode
```bash
npx playwright test --ui
```

### View Report
```bash
npx playwright show-report
```

---

## Test Coverage Summary

| Portal | Test Count | Coverage |
|--------|------------|----------|
| Teacher | ~100 | 🟢 High |
| Student | ~15 | 🟡 Medium |
| School Admin | ~20 | 🟡 Medium |
| Parent | ~10 | 🟡 Medium |
| Counselor | ~10 | 🟡 Medium |
| Platform Admin | ~10 | 🟡 Medium |
| Ministry | ~10 | 🟡 Medium |
| Cross-Portal | ~15 | 🟢 High |
| Unified API | ~30 | 🟢 High |
| **Total** | **~220** | **Average** |

---

## Test Status Indicators

| Symbol | Meaning |
|--------|---------|
| 🟢 | All tests passing |
| 🟡 | Some tests skipped/flaky |
| 🔴 | Critical failures |
| ⚪ | Not yet tested |

---

## CI/CD Integration

Tests run on CI with:
- 2 retries on failure
- 1 worker (sequential)
- HTML report output
- JSON report for metrics
- Screenshot on failure
- Video on failure
- Trace on retry

---

## Missing Test Coverage

Areas that need additional E2E tests:

1. **Setup Wizard Flows** - New school setup, admin setup
2. **Payment Flows** - Subscription, billing
3. **Library Management** - Book loans, fines
4. **Transport Management** - Route allocation
5. **Notification System** - In-app, email notifications
6. **File Uploads** - Document uploads, images
7. **Bulk Operations** - Bulk import, bulk actions
8. **Advanced Filtering** - Complex filter combinations
9. **Export/Import** - Data export, CSV uploads
10. **Webhook Testing** - Clerk, Stripe webhooks

---

## Best Practices

1. **Always clean up test data** - Use beforeEach/afterEach
2. **Use fixtures for shared setup** - Don't repeat auth logic
3. **Test for failures too** - Not just happy paths
4. **Use data selectors** - Not CSS classes that may change
5. **Wait properly** - Use waitForLoadState, not arbitrary timeouts
6. **Log useful info** - console.log for debugging
7. **Keep tests independent** - Each test should work alone
8. **Use test.describe grouping** - Organize related tests

---

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Project Test Config](../playwright.config.ts)
- [Test Helpers](src/tests/e2e/playwright-helpers.ts)
