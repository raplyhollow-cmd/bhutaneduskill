/**
 * SIMPLE BHUTAN SUBJECTS SEED - Fixed
 */

import "dotenv/config";

const { neon } = require("@neondatabase/serverless");

const sql = neon(process.env.DATABASE_URL);

const bhutanSubjects = [
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
  { code: "BST", name: "Business Studies", type: "elective", grades: [9,10,11,12] },
  { code: "ACC", name: "Accountancy", type: "elective", grades: [11,12] },
  { code: "CS", name: "Computer Science", type: "elective", grades: [11,12] },
  { code: "TOUR", name: "Tourism", type: "elective", grades: [11,12] },
];

async function addSubjects() {
  console.log("Adding Bhutan subjects...\n");

  const schools = await sql`SELECT id, code FROM schools`;
  console.log("Found " + schools.length + " school(s)\n");

  let created = 0;

  for (const school of schools) {
    console.log("\nSchool: " + school.code);

    for (const subject of bhutanSubjects) {
      for (const grade of subject.grades) {
        const id = "sub_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
        const code = subject.code + "-" + grade;
        const applicableGrades = JSON.stringify(subject.grades);

        const query = `
          INSERT INTO subjects
          (id, school_id, name, code, type, subject_type, description, grade, applicable_grades, is_active, created_at, updated_at)
          VALUES ('${id}', '${school.id}', '${subject.name}', '${code}', '${subject.type}', '${subject.type}',
          '${subject.name} - Grade ${grade}', ${grade}, '${applicableGrades}', true, NOW(), NOW())
          ON CONFLICT DO NOTHING
        `;

        try {
          await sql(query);
          console.log("  OK " + subject.name + " Grade " + grade);
          created++;
        } catch (err) {
          console.log("  SKIP " + subject.name + " Grade " + grade);
        }
      }
    }
  }

  console.log("\nCreated " + created + " subjects");
  process.exit(0);
}

addSubjects().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
