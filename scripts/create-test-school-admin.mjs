import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Creating test school admin user...");

  const userId = "user-test-school-admin-" + Date.now();
  const clerkUserId = "test-school-admin-" + Date.now();

  // Check if user already exists
  const existing = await sql`
    SELECT id FROM users WHERE clerk_user_id = ${clerkUserId} LIMIT 1
  `;

  if (existing.length > 0) {
    console.log("User already exists:", existing[0].id);
    return;
  }

  // Get a test school (create one if none exists)
  let school = await sql`
    SELECT id FROM schools WHERE code = 'TESTSCHOOL' LIMIT 1
  `;

  if (!school || school.length === 0) {
    // Create test school with minimal required fields
    const schoolResult = await sql`
      INSERT INTO schools (id, name, code, type, address, city, state, country, postal_code, phone, email, website, logo, established_year, accreditation_status, max_students, campus_size, facilities, board, principal_name, principal_email, principal_phone, counselor_name, counselor_email, counselor_phone, vice_principal_name, subscription_status, created_at, updated_at)
      VALUES (
        'school-test-' || ${Date.now()},
        'Test School',
        'TESTSCHOOL',
        'public',
        '123 Test St',
        'Thimphu',
        'Thimphu',
        'Bhutan',
        '10001',
        '1234567890',
        'test@school.com',
        'https://testschool.bt',
        '/logo.png',
        2020,
        'accredited',
        1000,
        'medium',
        '[]',
        'Bhutanese',
        'Principal Test',
        'principal@school.com',
        '1234567891',
        'Counselor Test',
        'counselor@school.com',
        '1234567892',
        'Vice Principal Test',
        'active',
        NOW(),
        NOW()
      )
      RETURNING id
    `;
    school = schoolResult;
    console.log("✓ Created test school:", school[0].id);
  }

  // Get the school-admin role
  const role = await sql`
    SELECT id FROM roles WHERE slug = 'school-admin' LIMIT 1
  `;

  if (!role || role.length === 0) {
    console.error("School admin role not found!");
    process.exit(1);
  }

  // Create the user
  await sql`
    INSERT INTO users
      ("id", clerk_user_id, "type", "role", "name", "first_name", "last_name", "email", "phone", "school_id", "grade", "enrollment_date", "country", "onboarding_complete", "onboarding_status", "created_at", "updated_at")
    VALUES
      (${userId},
      ${clerkUserId},
      'school-admin',
      'School Admin',
      'Test Admin',
      'Test',
      'Admin',
      'test-school-admin@school.com',
      '1234567890',
      ${school[0].id},
      12,
      NOW(),
      'Bhutan',
      true,
      'active',
      NOW(),
      NOW()
    )
  `;

  // Skip role assignment for now and just report the user creation
  console.log("✓ User created successfully!");
  console.log("  User ID:", userId);
  console.log("  Clerk User ID:", clerkUserId);
  console.log("  Email: test-school-admin@school.com");
  console.log("  School:", school[0].id);

  // Note: You may need to manually assign the role in the database
  console.log("\nNote: Role assignment may need to be done manually in the database.");

  console.log("✓ Created test school admin user!");
  console.log("  Email: test-school-admin@school.com");
  console.log("  Clerk User ID:", clerkUserId);
  console.log("  User ID:", userId);
  console.log("  School:", school[0].id);
  console.log("\nTo login, use this Clerk User ID in your test environment.");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});