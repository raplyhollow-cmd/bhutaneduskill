require("dotenv").config({ path: ".env.local" });
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

(async () => {
  const clerkUserId = "manual-platform-admin";
  const userId = "user-admin-" + Date.now();
  
  try {
    // Check if user exists
    const existing = await sql`
      SELECT id, clerk_user_id, email FROM users 
      WHERE clerk_user_id = ${clerkUserId}
    `;
    
    if (existing.length > 0) {
      console.log("User already exists:");
      console.log(JSON.stringify(existing[0], null, 2));
      return;
    }
    
    // Insert user with ALL required NOT NULL fields
    await sql`
      INSERT INTO users (
        id, clerk_user_id, type, role, name, 
        first_name, last_name, email, phone,
        profile_image, date_of_birth, gender,
        grade, section, roll_number,
        address, city, state, postal_code, country,
        parent_contact, parent_phone, emergency_contact,
        blood_group, enrollment_date, last_login,
        created_at, updated_at
      )
      VALUES (
        ${userId},
        ${clerkUserId},
        'admin',
        'Platform Admin',
        'Platform Admin',
        'Admin',
        'User',
        'admin@bhutaneduskill.vercel.app',
        '+975-17000000',
        '',
        '2000-01-01',
        'other',
        0,
        '',
        '',
        '',
        'Thimphu',
        'Thimphu',
        '',
        'Bhutan',
        '',
        '',
        '',
        '',
        ${new Date().toISOString().split('T')[0]},
        '',
        NOW(),
        NOW()
      )
    `;
    
    console.log("User created successfully!");
    console.log("ID:", userId);
    console.log("Email: admin@bhutaneduskill.vercel.app");
    
  } catch (error) {
    console.error("Error:", error.message);
    console.error("Details:", error);
  }
})();
