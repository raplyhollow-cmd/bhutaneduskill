require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const clerkUserId = "manual-platform-admin";
  
  try {
    // Get the user
    const userResult = await sql`
      SELECT id FROM users WHERE clerk_user_id = ${clerkUserId}
    `;
    
    if (userResult.length === 0) {
      console.log("User not found! Please create user first.");
      return;
    }
    
    const userId = userResult[0].id;
    console.log("Found user:", userId);
    
    // Get platform-admin role
    const roleResult = await sql`
      SELECT id FROM roles WHERE slug = 'platform-admin' LIMIT 1
    `;
    
    if (roleResult.length === 0) {
      console.log("Platform-admin role not found in RBAC system!");
      return;
    }
    
    const roleId = roleResult[0].id;
    console.log("Found role:", roleId);
    
    // Check if already assigned
    const existing = await sql`
      SELECT id FROM user_roles WHERE user_id = ${userId} AND role_id = ${roleId}
    `;
    
    if (existing.length > 0) {
      console.log("Role already assigned to user");
      return;
    }
    
    // Assign role
    await sql`
      INSERT INTO user_roles (id, user_id, role_id, assigned_by, created_at)
      VALUES ('ur-' || ${userId} || '-' || ${roleId}, ${userId}, ${roleId}, ${userId}, NOW())
    `;
    
    console.log("RBAC role assigned successfully!");
    
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
