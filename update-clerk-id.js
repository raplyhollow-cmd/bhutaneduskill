require("dotenv").config({ path: ".env.local" });
const readline = require("readline");
const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question("Enter your Clerk User ID: ", async (clerkUserId) => {
  try {
    const result = await sql`
      UPDATE users 
      SET clerk_user_id = ${clerkUserId}
      WHERE clerk_user_id = 'manual-platform-admin'
      RETURNING id, name, email, clerk_user_id
    `;
    
    if (result.length > 0) {
      console.log("\n✅ User updated successfully!");
      console.log(JSON.stringify(result[0], null, 2));
      console.log("\nNow sign out and sign back in with your Clerk account.");
    } else {
      console.log("❌ User not found");
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
  rl.close();
});
