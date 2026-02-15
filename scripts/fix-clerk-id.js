import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function fixClerkId() {
  const newClerkId = 'user_39hs5MVLcsJxfofQ7m8upSgy7cM';
  const email = 'raplyhollow@gmail.com';

  console.log("Current Clerk ID from your session:", newClerkId);
  console.log("Updating database record for:", email);
  console.log("---");

  // First show current state
  const current = await sql`
    SELECT id, email, clerk_user_id, type, onboarding_complete
    FROM users
    WHERE email = ${email}
  `;

  console.log("BEFORE:");
  console.log("  Clerk ID:", current[0]?.clerk_user_id);
  console.log("  Type:", current[0]?.type);
  console.log("  Onboarding Complete:", current[0]?.onboarding_complete);
  console.log("---");

  // Update the Clerk ID
  const result = await sql`
    UPDATE users
    SET clerk_user_id = ${newClerkId}
    WHERE email = ${email}
    RETURNING id, email, clerk_user_id, type, onboarding_complete
  `;

  console.log("✅ AFTER:");
  console.log("  Clerk ID:", result[0].clerk_user_id);
  console.log("  Type:", result[0].type);
  console.log("  Onboarding Complete:", result[0].onboarding_complete);
  console.log("---");
  console.log("Now try logging in again!");
}

fixClerkId().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
