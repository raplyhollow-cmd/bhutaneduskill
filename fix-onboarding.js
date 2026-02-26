/**
 * Quick script to fix onboardingComplete flag
 */

const { drizzle } = require('drizzle-orm/neon-http');
const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_JeDqjRgXM7Wr@ep-delicate-river-a5hvd0dv.us-east-2.aws.neon.tech/neondb?sslmode=require');
const db = drizzle(sql);

async function fixOnboarding() {
  // Get your user by clerk ID
  const clerkUserId = 'user_39hs5MVLcsJxfofQ7m8upSgy7cM';

  console.log('Looking for user with clerk_user_id:', clerkUserId);

  try {
    const userRecords = await sql`
      SELECT id, clerk_user_id, onboarding_complete, type
      FROM users
      WHERE clerk_user_id = ${clerkUserId}
      LIMIT 1
    `;

    if (userRecords.length === 0) {
      console.log('ERROR: User not found!');
      process.exit(1);
    }

    const user = userRecords[0];
    console.log('Found user:', user);
    console.log('Current onboarding_complete:', user.onboarding_complete);

    if (!user.onboarding_complete) {
      await sql`
        UPDATE users
        SET onboarding_complete = true
        WHERE clerk_user_id = ${clerkUserId}
      `;
      console.log('✅ Updated onboarding_complete to true');

      const updated = await sql`
        SELECT onboarding_complete
        FROM users
        WHERE clerk_user_id = ${clerkUserId}
        LIMIT 1
      `;
      console.log('New value:', updated[0].onboarding_complete);
    } else {
      console.log('ℹ️ onboarding_complete is already true');
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOnboarding().catch(console.error).finally(() => process.exit());
