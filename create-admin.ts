import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log("Creating platform admin user...");
  
  const userId = "user-manual-" + Date.now();
  
  // Check if user already exists
  const existing = await sql`
    SELECT id FROM users WHERE clerkUserId = 'manual-platform-admin' LIMIT 1
  `;
  
  if (existing.length > 0) {
    console.log("User already exists:", existing[0].id);
    return;
  }
  
  // Get the platform-admin role from database
  const platformAdminRole = await sql`
    SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
  `;
  
  if (!platformAdminRole || platformAdminRole.length === 0) {
    console.error("Platform admin role not found!");
    process.exit(1);
  }
  
  const roleId = platformAdminRole[0].id;
  
  // Create the user - only required columns
  await sql`
    INSERT INTO users
      ("id", clerkUserId, "type", "role", "name", "email", "createdAt", "updatedAt")
    VALUES
      ('${userId}',
      'manual-platform-admin',
      'admin',
      'Platform Admin',
      'admin@bhutaneduskill.vercel.app',
      NOW(),
      NOW()
    )
  `;
  
  // Assign the platform-admin role
  await sql`
    INSERT INTO user_roles 
      ("id", "user_id", "role_id", "assigned_by", "created_at")
    VALUES 
      ('ur-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)),
      '${userId}',
      '${roleId}',
      '${userId}',
      NOW()
    )
  `;
  
  console.log("✓ Created user!");
  console.log("  Email: admin@bhutaneduskill.vercel.app");
  console.log("  Password: Use 'Forgot Password' to set a password");
}

main().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
