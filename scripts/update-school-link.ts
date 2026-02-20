import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function updateSchoolLinks() {
  console.log("Updating demo users school links...");

  // Get TMSS school
  const school = await sql`SELECT id FROM schools WHERE code = 'TMSS'`;
  if (school.length === 0) {
    console.log("TMSS school not found");
    process.exit(1);
  }

  const schoolId = school[0].id;
  console.log("Found TMSS school:", schoolId);

  // Update demo users
  const demoEmails = [
    'tashi.wangchuk@demo.bt',
    'karma.dorji@demo.bt',
    'dorji.wangmo@demo.bt',
    'pema.lhamo@demo.bt',
    'choki.wangchuk@demo.bt'
  ];

  for (const email of demoEmails) {
    await sql`UPDATE users SET school_id = ${schoolId} WHERE email = ${email}`;
    console.log(`Updated ${email} -> school_id: ${schoolId}`);
  }

  // Verify
  const users = await sql`
    SELECT email, school_id FROM users
    WHERE email IN ${sql(demoEmails)}
  `;
  console.log("\nVerified users:");
  users.forEach((u: any) => console.log(`  ${u.email} -> ${u.school_id}`));
}

updateSchoolLinks()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
