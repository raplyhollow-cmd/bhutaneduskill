import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  const userId = "user-manual-test-" + Date.now();
  
  const existing = await sql`
    SELECT id, clerk_user_id, type, role, name, email FROM users
     WHERE clerk_user_id = 'manual-platform-admin'
    `;
  
  console.log('Existing users:', existing.length);
  
  if (existing.length === 0) {
    await sql`
      INSERT INTO users (id, clerk_user_id, type, role, name, first_name, last_name, email, created_at, updated_at)
      VALUES (
        \${userId},
        'manual-platform-admin',
        'admin',
        'Platform Admin',
        'Admin',
        'User',
        'admin@bhutaneduskill.vercel.app',
        NOW(),
        NOW()
      )
    `;
    console.log('Created user:', userId);
  } else {
    console.log('User already exists, skipping');
  }
}
main().catch(console.error);
