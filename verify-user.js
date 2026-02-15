require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const clerkUserId = "manual-platform-admin";
  
  try {
    const user = await sql`
      SELECT id, name, email, type, role FROM users 
      WHERE clerk_user_id = ${clerkUserId}
    `;
    
    console.log("=== USER RECORD ===");
    console.log(JSON.stringify(user[0], null, 2));
    
    const roles = await sql`
      SELECT r.name, r.slug FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = ${user[0].id}
    `;
    
    console.log("\n=== RBAC ROLES ===");
    console.log(JSON.stringify(roles, null, 2));
    
  } catch (error) {
    console.error("Error:", error.message);
  }
})();
