import { test, expect } from '@playwright/test';

/**
 * E2E Tests: API Endpoints
 *
 * Tests that all API endpoints respond correctly
 */
test.describe('API Health Check', () => {

  const baseAPI = 'http://localhost:3003/api';

  test('auth set-role endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/auth/set-role`);

    // Should return 200, 401 (unauthorized), or 405 (method not allowed for GET)
    expect([200, 401, 405]).toContain(response.status());
  });

  test('schools endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/schools`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('users endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/users`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('classes endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/classes`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('homework endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/teacher/homework`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('library endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/library`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('transport endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/transport`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('hostel endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/hostel`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('inventory endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/inventory/items`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('student profile endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/student/profile`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('teacher profile endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/teacher/profile`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('parent children endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/parent/children`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('counselor students endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/counselor/students`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('school-admin teachers endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/school-admin/teachers`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

  test('ministry dashboard endpoint exists', async ({ request }) => {
    const response = await request.get(`${baseAPI}/ministry/dashboard`);

    // Should return 200 or 401
    expect([200, 401]).toContain(response.status());
  });

});

test.describe('API Response Format', () => {

  test('returns JSON content-type', async ({ request }) => {
    const response = await request.get('/api/auth/set-role');

    const contentType = response.headers()['content-type'];
    expect(contentType).toMatch(/json/);
  });

  test('returns valid response structure', async ({ request }) => {
    const response = await request.get('/api/auth/set-role');

    // Should be able to parse as JSON
    const body = await response.json();
    expect(body).toBeDefined();
  });

});
