process.env.DATABASE_URL;

const { neon } = require('@neondatabase/serverless').default;

const sql = neon.default;

const userId = 'user-manual-' + Date.now();

(async () => {
  try {
    const result = await sql`
      INSERT INTO users (id, clerk_user_id, type, role, name, first_name, last_name, email, created_at, updated_at)
      VALUES (
        String(userId),
        'manual-platform-admin',
        'admin',
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
  } catch (err) {
    console.error('Error:', err);
  }
}
})();
