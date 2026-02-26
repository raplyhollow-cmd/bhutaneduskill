/**
 * RESET AND SEED GLOBAL SUBJECT TEMPLATES
 *
 * 1. Clear existing subjects
 * 2. Seed global subject templates (school_id = NULL)
 * Platform Admin manages these, School Admin selects from them
 */

require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

const globalSubjects = [
  { code: "ENG", name: "English", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "DZO", name: "Dzongkha", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "MATH", name: "Mathematics", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "SCI", name: "Science", type: "core", grades: [6, 7, 8] },
  { code: "PHY", name: "Physics", type: "core", grades: [9, 10, 11, 12] },
  { code: "CHEM", name: "Chemistry", type: "core", grades: [9, 10, 11, 12] },
  { code: "BIO", name: "Biology", type: "core", grades: [9, 10, 11, 12] },
  { code: "SST", name: "Social Studies", type: "core", grades: [6, 7, 8] },
  { code: "HIST", name: "History", type: "core", grades: [9, 10, 11, 12] },
  { code: "GEOG", name: "Geography", type: "core", grades: [9, 10, 11, 12] },
  { code: "ECON", name: "Economics", type: "core", grades: [9, 10, 11, 12] },
  { code: "IT", name: "Information Technology", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "HPED", name: "Health and Physical Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "ENV", name: "Environmental Science", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "WRKED", name: "Work Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "AGR", name: "Agriculture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "MORAL", name: "Moral Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "ART", name: "Art and Culture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "BST", name: "Business Studies", type: "elective", grades: [9, 10, 11, 12] },
  { code: "ACC", name: "Accountancy", type: "elective", grades: [11, 12] },
  { code: "CS", name: "Computer Science", type: "elective", grades: [11, 12] },
  { code: "TOUR", name: "Tourism", type: "elective", grades: [11, 12] },
];

async function resetAndSeed() {
  console.log("=== Resetting and Seeding Global Subject Templates ===\n");

  // 1. Clear existing subjects
  console.log("1. Clearing existing subjects...");
  await sql`DELETE FROM subjects`;
  console.log("   Cleared all subjects\n");

  // 2. Seed global templates (school_id = NULL)
  console.log("2. Seeding global subject templates...");
  let created = 0;

  for (const subject of globalSubjects) {
    for (const grade of subject.grades) {
      const code = `${subject.code}-${grade}`;
      const id = `global_${code}`;

      try {
        await sql.query(
          `INSERT INTO subjects (id, school_id, name, code, type, subject_type, description, grade, applicable_grades, is_active, created_at, updated_at)
           VALUES ($1, NULL, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9, NOW(), NOW())`,
          [
            id,
            subject.name,
            code,
            subject.type,
            JSON.stringify(subject.type),
            `${subject.name} - Grade ${grade}`,
            grade,
            JSON.stringify(subject.grades),
            true,
          ]
        );
        console.log(`   OK ${subject.name} Grade ${grade} (${code})`);
        created++;
      } catch (err) {
        console.log(`   ERR ${code}: ${err.message}`);
      }
    }
  }

  console.log(`\n=== Summary: ${created} global subject templates created ===`);
  console.log("Platform Admin can manage these at /admin/subjects");
  console.log("School Admin can select from these when creating school subjects\n");

  process.exit(0);
}

resetAndSeed().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
