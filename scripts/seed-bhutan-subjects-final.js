/**
 * BHUTAN STANDARD SUBJECTS SEED - FINAL VERSION
 *
 * Standard subjects for Bhutan middle schools (Grades 6-12)
 * Each subject is created per grade (e.g., MATH-6, MATH-7, etc.)
 * This allows for cross-school comparison using standardized codes
 */

require("dotenv/config");
const { neon } = require("@neondatabase/serverless");
const sql = neon(process.env.DATABASE_URL);

// Bhutan standard curriculum subjects
const bhutanSubjects = [
  // LANGUAGES
  { code: "ENG", name: "English", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { code: "DZO", name: "Dzongkha", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // MATHEMATICS
  { code: "MATH", name: "Mathematics", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // SCIENCES
  { code: "SCI", name: "Science", type: "core", grades: [6, 7, 8] },
  { code: "PHY", name: "Physics", type: "core", grades: [9, 10, 11, 12] },
  { code: "CHEM", name: "Chemistry", type: "core", grades: [9, 10, 11, 12] },
  { code: "BIO", name: "Biology", type: "core", grades: [9, 10, 11, 12] },

  // SOCIAL STUDIES
  { code: "SST", name: "Social Studies", type: "core", grades: [6, 7, 8] },
  { code: "HIST", name: "History", type: "core", grades: [9, 10, 11, 12] },
  { code: "GEOG", name: "Geography", type: "core", grades: [9, 10, 11, 12] },
  { code: "ECON", name: "Economics", type: "core", grades: [9, 10, 11, 12] },

  // INFORMATION TECHNOLOGY
  { code: "IT", name: "Information Technology", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // HEALTH & PHYSICAL EDUCATION
  { code: "HPED", name: "Health & Physical Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // ENVIRONMENTAL SCIENCE
  { code: "ENV", name: "Environmental Science", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // WORK EDUCATION / VOCATIONAL
  { code: "WRKED", name: "Work Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // AGRICULTURE
  { code: "AGR", name: "Agriculture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // MORAL EDUCATION
  { code: "MORAL", name: "Moral Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // ART & CULTURE
  { code: "ART", name: "Art & Culture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },

  // ELECTIVE SUBJECTS (Grades 9-12)
  { code: "BST", name: "Business Studies", type: "elective", grades: [9, 10, 11, 12] },
  { code: "ACC", name: "Accountancy", type: "elective", grades: [11, 12] },
  { code: "CS", name: "Computer Science", type: "elective", grades: [11, 12] },
  { code: "TOUR", name: "Tourism", type: "elective", grades: [11, 12] },
];

async function seedBhutanSubjects() {
  console.log("🌱 Seeding Bhutan standard subjects for Grades 6-12...\n");

  // Get all schools
  const schools = await sql`SELECT id, code FROM schools`;
  console.log(`📚 Found ${schools.length} school(s)\n`);

  if (schools.length === 0) {
    console.log("❌ No schools found. Please create a school first.");
    process.exit(1);
  }

  let createdCount = 0;
  let skippedCount = 0;

  for (const school of schools) {
    console.log(`\n🏫 Processing school: ${school.code} (${school.id})`);

    for (const subject of bhutanSubjects) {
      // For each applicable grade, create a subject entry
      for (const grade of subject.grades) {
        const subjectId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const code = `${subject.code}-${grade}`; // Grade-specific code (e.g., MATH-9, MATH-10)

        try {
          await sql`
            INSERT INTO subjects (
              id, school_id, name, code, type, subject_type, description, grade,
              applicable_grades, is_active, created_at, updated_at
            )
            VALUES (
              ${subjectId}, ${school.id}, ${subject.name}, ${code}, ${subject.type},
              ${subject.type}, ${subject.name} - Grade ${grade}, ${grade},
              ${JSON.stringify(subject.grades)}, true, NOW(), NOW()
            )
            ON CONFLICT (school_id, code) DO NOTHING
          `;
          console.log(`  ✅ ${subject.name} Grade ${grade} (${code})`);
          createdCount++;
        } catch (err) {
          console.log(`  ⏭️  Skipped: ${subject.name} Grade ${grade} (${code})`);
          skippedCount++;
        }
      }
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} subjects`);
  console.log(`   ⏭️  Skipped: ${skippedCount} subjects`);
  console.log(`\n✨ Seeding complete!\n`);
  process.exit(0);
}

seedBhutanSubjects().catch(err => {
  console.error("❌ Error:", err);
  process.exit(1);
});
