/**
 * Seed Bhutan Schools and Districts
 *
 * This script seeds the database with all 20 districts of Bhutan
 * and 40+ predefined schools from bhutan-data.ts
 *
 * Uses raw SQL to avoid schema mismatches with Drizzle ORM
 */

// Load environment variables from .env file
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { bhutanDistricts, bhutanSchools } from "@/lib/data/bhutan-data";

// Fix duplicate district codes (TY for both Trongsa and Trashiyangtse)
const FIXED_DISTRICTS = bhutanDistricts.map(d => {
  if (d.id === "district-trashiyangtse") {
    return { ...d, code: "TYT" }; // Trashiyangtse -> TYT
  }
  return d;
});

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL environment variable is not set");
  process.exit(1);
}

const sql = neon(DATABASE_URL);

/**
 * Parse address to extract city and state
 * Example: "Yangchenphug, Thimphu" → { city: "Yangchenphug", state: "Thimphu" }
 */
function parseAddress(address: string) {
  const parts = address.split(",").map((p) => p.trim());
  const city = parts[0] || "";
  const state = parts[1] || "";
  return { city, state };
}

async function main() {
  console.log("🌱 Seeding Bhutan schools and districts...");

  try {
    // Seed districts first
    console.log("  Seeding districts...");
    let districtCount = 0;

    for (const district of FIXED_DISTRICTS) {
      await sql`
        INSERT INTO districts (id, name, code, dzongkhag, country, is_active, created_at, updated_at)
        VALUES (
          ${district.id},
          ${district.name},
          ${district.code},
          ${district.name},
          'Bhutan',
          ${district.isActive},
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      districtCount++;
    }
    console.log(`  ✅ Seeded ${districtCount} districts`);

    // Seed schools
    console.log("  Seeding schools...");
    let schoolCount = 0;

    for (const school of bhutanSchools) {
      const { city, state } = parseAddress(school.address);

      await sql`
        INSERT INTO schools (
          id, name, code, type, address, city, state, country, postal_code,
          phone, email, website, logo, established_year, accreditation_status,
          max_students, campus_size, facilities, board,
          principal_name, principal_email, principal_phone,
          counselor_name, counselor_email, counselor_phone,
          vice_principal_name, school_type, level,
          contact_email, contact_phone, tenant_id, district_id, is_active,
          created_at, updated_at
        )
        VALUES (
          ${school.id},
          ${school.name},
          ${school.code},
          'public',
          ${school.address},
          ${city},
          ${state},
          'Bhutan',
          '11001',
          '+975-2-322',
          'info@schools.edu.bt',
          'https://schools.edu.bt',
          '/logo.png',
          2000,
          'registered',
          1000,
          '10 acres',
          '[]',
          'BCSE',
          'Principal',
          'principal@schools.edu.bt',
          '+975-2-322',
          'Counselor',
          'counselor@schools.edu.bt',
          '+975-2-322',
          'Vice Principal',
          ${school.schoolType},
          ${school.level},
          'info@schools.edu.bt',
          '+975-2-322',
          null,
          ${school.districtId},
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (id) DO NOTHING
      `;
      schoolCount++;
    }
    console.log(`  ✅ Seeded ${schoolCount} schools`);

    console.log("✅ Bhutan data seeded successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to seed Bhutan data:", error);
    process.exit(1);
  }
}

main();
