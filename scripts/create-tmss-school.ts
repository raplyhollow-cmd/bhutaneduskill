import "dotenv/config";
import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL!);

async function createTMSSSchool() {
  console.log("Creating TMSS School...");

  const schoolId = `school_tmss_${Date.now()}`;

  await sql`
    INSERT INTO schools (
      id, name, code, type, address, city, state, country, postal_code,
      phone, email, website, logo, established_year, accreditation_status,
      max_students, campus_size, board,
      principal_name, principal_email, principal_phone,
      counselor_name, counselor_email, counselor_phone,
      vice_principal_name, school_type, level,
      contact_email, contact_phone, is_active,
      created_at, updated_at
    ) VALUES (
      ${schoolId},
      'Thimphu Middle Secondary School',
      'TMSS',
      'public',
      'Yangchenphug, Thimphu',
      'Thimphu',
      'Thimphu',
      'Bhutan',
      '11001',
      '+975-2-322515',
      'info@tmss.edu.bt',
      'https://tmss.edu.bt',
      '',
      1975,
      'accredited',
      800,
      '5 acres',
      'BCSE',
      'Karma Wangchuk',
      'principal@tmss.edu.bt',
      '+975-17-54321',
      'Pema Lhamo',
      'counselor@tmss.edu.bt',
      '+975-17-54322',
      'Dorji Tshering',
      'public',
      'middle_secondary',
      'info@tmss.edu.bt',
      '+975-2-322515',
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO NOTHING
  `;

  const result = await sql`SELECT id, code, name FROM schools WHERE code = 'TMSS'`;
  console.log("TMSS School created:", result);

  return result[0]?.id;
}

createTMSSSchool()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("Error:", err);
    process.exit(1);
  });
