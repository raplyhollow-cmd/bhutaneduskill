/**
 * BHUTAN STANDARD SUBJECTS SEED - WORKING VERSION
 *
 * Standard subjects for Bhutan middle schools (Grades 6-12)
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
  { code: "HPED", name: "Health and Physical Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // ENVIRONMENTAL SCIENCE
  { code: "ENV", name: "Environmental Science", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // WORK EDUCATION
  { code: "WRKED", name: "Work Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // AGRICULTURE
  { code: "AGR", name: "Agriculture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // MORAL EDUCATION
  { code: "MORAL", name: "Moral Education", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // ART & CULTURE
  { code: "ART", name: "Art and Culture", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  // ELECTIVES
  { code: "BST", name: "Business Studies", type: "elective", grades: [9, 10, 11, 12] },
  { code: "ACC", name: "Accountancy", type: "elective", grades: [11, 12] },
  { code: "CS", name: "Computer Science", type: "elective", grades: [11, 12] },
  { code: "TOUR", name: "Tourism", type: "elective", grades: [11, 12] },
];

async function seedBhutanSubjects() {
  console.log("Seeding Bhutan standard subjects for Grades 6-12...");

  // Get the first school
  const schools = await sql`SELECT id, code FROM schools`;
  console.log(`Found ${schools.length} school(s)`);

  if (schools.length === 0) {
    console.log("No schools found. Please create a school first.");
    process.exit(1);
  }

  const school = schools[0];
  console.log(`Using school: ${school.code}`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const subject of bhutanSubjects) {
    for (const grade of subject.grades) {
      const code = `${subject.code}-${grade}`;
      const subjectId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const description = `${subject.name} for Grade ${grade}`;

      // Use parameterized query with explicit parameters
      const query = `
        INSERT INTO subjects (id, school_id, name, code, type, subject_type, description, grade, applicable_grades, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
        ON CONFLICT (code) DO NOTHING
      `;

      try {
        await sql(query, [
          subjectId,
          school.id,
          subject.name,
          code,
          subject.type,
          subject.type,
          description,
          grade,
          JSON.stringify(subject.grades),
          true,
        ]);

        // Check if it was actually inserted
        const check = await sql`SELECT id FROM subjects WHERE code = ${code}`;
        if (check.length > 0) {
          console.log(`  OK ${subject.name} Grade ${grade} (${code})`);
          createdCount++;
        } else {
          console.log(`  SKIP ${subject.name} Grade ${grade} (${code}) - exists`);
          skippedCount++;
        }
      } catch (err) {
        console.log(`  ERR ${subject.name} Grade ${grade}: ${err.message}`);
      }
    }
  }

  console.log(`\nSummary:`);
  console.log(`  Created: ${createdCount}`);
  console.log(`  Skipped: ${skippedCount}`);
  console.log("Done!");
  process.exit(0);
}

seedBhutanSubjects().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
