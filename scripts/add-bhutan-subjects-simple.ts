/**
 * SIMPLE BHUTAN SUBJECTS SEED
 *
 * Direct SQL insert to avoid Drizzle schema mismatches
 */

import "dotenv/config";

const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

// Bhutan standard subjects for Grades 6-12
const bhutanSubjects = [
  // Core subjects for all grades
  { code: "ENG", name: "English", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "DZO", name: "Dzongkha", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "MATH", name: "Mathematics", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "SCI", name: "Science", type: "core", grades: [6,7,8] },
  { code: "PHY", name: "Physics", type: "core", grades: [9,10,11,12] },
  { code: "CHEM", name: "Chemistry", type: "core", grades: [9,10,11,12] },
  { code: "BIO", name: "Biology", type: "core", grades: [9,10,11,12] },
  { code: "SST", name: "Social Studies", type: "core", grades: [6,7,8] },
  { code: "HIST", name: "History", type: "core", grades: [9,10,11,12] },
  { code: "GEOG", name: "Geography", type: "core", grades: [9,10,11,12] },
  { code: "ECON", name: "Economics", type: "core", grades: [9,10,11,12] },
  { code: "IT", name: "Information Technology", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "HPED", name: "Health & Physical Education", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "ENV", name: "Environmental Science", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "WRKED", name: "Work Education", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "AGR", name: "Agriculture", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "MORAL", name: "Moral Education", type: "core", grades: [6,7,8,9,10,11,12] },
  { code: "ART", name: "Art & Culture", type: "core", grades: [6,7,8,9,10,11,12] },
  // Electives
  { code: "BST", name: "Business Studies", type: "elective", grades: [9,10,11,12] },
  { code: "ACC", name: "Accountancy", type: "elective", grades: [11,12] },
  { code: "CS", name: "Computer Science", type: "elective", grades: [11,12] },
  { code: "TOUR", name: "Tourism", type: "elective", grades: [11,12] },
];

async function addSubjects() {
  console.log("🌱 Adding Bhutan subjects...\n");

  // Get schools
  const schools = await sql`SELECT id, code FROM schools`;
  console.log(`📚 Found ${schools.length} school(s)\n`);

  if (schools.length === 0) {
    console.log("❌ No schools found!");
    process.exit(1);
  }

  for (const school of schools) {
    console.log(`\n🏫 School: ${school.code}`);

    for (const subject of bhutanSubjects) {
      for (const grade of subject.grades) {
        const id = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const code = `${subject.code}-${grade}`;

        try {
          await sql`
            INSERT INTO subjects (id, school_id, name, code, type, subject_type, description, grade, applicable_grades, is_active, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
            ON CONFLICT (school_id, code) DO NOTHING
          `, [
            id,
            school.id,
            subject.name,
            code,
            subject.type,
            subject.type,
            `${subject.name} - Grade ${grade}`,
            grade,
            JSON.stringify(subject.grades),
            true,
          ];
          console.log(`  ✅ ${subject.name} Grade ${grade} (${code})`);
        } catch (err) {
          console.log(`  ⚠️  ${subject.name} Grade ${grade}: ${err.message?.substring(0, 50)}`);
        }
      }
    }
  }

  console.log("\n✅ Done!");
  process.exit(0);
}

addSubjects().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
