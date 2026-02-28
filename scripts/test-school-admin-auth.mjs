import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Testing School Admin Portal Access...");

  // Check if test user exists
  const testUser = await sql`
    SELECT id, clerk_user_id, email, name, onboarding_status
    FROM users
    WHERE email = 'test-school-admin@school.com'
    LIMIT 1
  `;

  if (testUser.length === 0) {
    console.log("Test user not found. Run create-test-school-admin.mjs first.");
    return;
  }

  const user = testUser[0];
  console.log("✓ Found test user:", user.name, user.email);

  // Check if user has school assigned
  const school = await sql`
    SELECT s.id, s.name, s.code
    FROM schools s
    JOIN users u ON u.school_id = s.id
    WHERE u.id = ${user.id}
    LIMIT 1
  `;

  if (school.length === 0) {
    console.log("❌ User not assigned to a school");
    return;
  }

  console.log("✓ Assigned to school:", school[0].name, "(", school[0].code, ")");

  // Check roles
  const roles = await sql`
    SELECT r.name, r.slug
    FROM roles r
    JOIN user_roles ur ON ur.role_id = r.id
    WHERE ur.user_id = ${user.id}
  `;

  console.log("✓ User roles:");
  roles.forEach(role => {
    console.log(`  - ${role.name} (${role.slug})`);
  });

  // Check onboarding status
  console.log("✓ Onboarding status:", user.onboarding_status);

  // Check if the user can access portal
  if (user.onboarding_status === 'active') {
    console.log("\n🎉 User should be able to access the school admin portal!");
    console.log("To test manually:");
    console.log("1. Go to http://localhost:3006/sign-in");
    console.log("2. Look for the test user with email:", user.email);
    console.log("3. Note: You may need to create this user in Clerk dashboard manually");
    console.log("4. Or use the Clerk User ID:", user.clerk_user_id);
  } else if (user.onboarding_status === 'pending_approval') {
    console.log("\n⏳ User is pending approval - needs platform admin to approve");
  } else {
    console.log("\n❌ User cannot access portal - status:", user.onboarding_status);
  }

  // Check school setup status
  const schoolSetup = await sql`
    SELECT setup_complete, subscription_status
    FROM schools
    WHERE id = ${school[0].id}
    LIMIT 1
  `;

  console.log("\n🏫 School setup status:");
  console.log("  Setup complete:", schoolSetup[0].setup_complete);
  console.log("  Subscription status:", schoolSetup[0].subscription_status);
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});