const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = 'postgresql://neondb_owner:npg_zEGrNB2cl7wk@ep-soft-rain-aigc3qom-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(DATABASE_URL);

async function makeAdmin() {
  const email = 'dipanpradhan.biz@gmail.com';
  
  console.log(`Looking for user: ${email}`);
  
  const users = await sql`
    SELECT id, email, clerk_user_id, type 
    FROM users 
    WHERE email = ${email}
  `;
  
  if (users.length === 0) {
    console.log('❌ User not found in database');
    console.log('Note: User might need to sign in first via Clerk');
    return;
  }
  
  const user = users[0];
  console.log('Found user:', user);
  
  if (user.type === 'admin') {
    console.log('✅ User is already a platform admin');
    return;
  }
  
  await sql`
    UPDATE users 
    SET type = 'admin' 
    WHERE id = ${user.id}
  `;
  
  console.log('✅ User updated to platform admin successfully!');
  
  const updated = await sql`
    SELECT id, email, type FROM users WHERE email = ${email}
  `;
  console.log('Verified:', updated[0]);
}

makeAdmin().catch(console.error);
