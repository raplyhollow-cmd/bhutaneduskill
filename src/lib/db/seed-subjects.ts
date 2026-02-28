/**
 * SEED GLOBAL SUBJECTS
 *
 * Common Bhutan curriculum subjects for Classes 6-12
 * Run this script to populate global subjects that schools can copy
 *
 * Usage:
 *   npx tsx src/lib/db/seed-subjects.ts
 */

import { db } from "./index";
import { subjects } from "./schema";
import { nanoid } from "nanoid";
import { sql } from "drizzle-orm";

const CORE_SUBJECTS = [
  // English
  { name: "English", code: "ENG", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { name: "English Literature", code: "ENG-LIT", type: "core", grades: [11, 12] },

  // Dzongkha (National Language)
  { name: "Dzongkha", code: "DZO", type: "core", grades: [6, 7, 8, 9, 10, 11, 12] },
  { name: "Dzongkha Literature", code: "DZO-LIT", type: "core", grades: [11, 12] },

  // Mathematics
  { name: "Mathematics", code: "MATH", type: "core", grades: [6, 7, 8, 9, 10] },
  { name: "Mathematics (Basic)", code: "MATH-B", type: "core", grades: [11, 12] },
  { name: "Mathematics (Advanced)", code: "MATH-A", type: "core", grades: [11, 12] },

  // Sciences
  { name: "Science", code: "SCI", type: "core", grades: [6, 7, 8] },
  { name: "Physics", code: "PHY", type: "core", grades: [9, 10, 11, 12] },
  { name: "Chemistry", code: "CHEM", type: "core", grades: [9, 10, 11, 12] },
  { name: "Biology", code: "BIO", type: "core", grades: [9, 10, 11, 12] },

  // Social Studies
  { name: "Social Studies", code: "SOC", type: "core", grades: [6, 7, 8] },
  { name: "History", code: "HIST", type: "core", grades: [9, 10] },
  { name: "Geography", code: "GEOG", type: "core", grades: [9, 10] },
  { name: "Economics", code: "ECON", type: "core", grades: [11, 12] },

  // Bhutan Studies
  { name: "Bhutan History", code: "BH-HIST", type: "core", grades: [9, 10, 11, 12] },
  { name: "Environmental Studies", code: "ENV", type: "core", grades: [6, 7, 8] },

  // ICT
  { name: "Information & Communication Technology", code: "ICT", type: "core", grades: [9, 10, 11, 12] },
  { name: "Computer Science", code: "CS", type: "elective", grades: [11, 12] },

  // Commerce
  { name: "Accountancy", code: "ACCT", type: "elective", grades: [11, 12] },
  { name: "Business Studies", code: "BST", type: "elective", grades: [11, 12] },
];

const ELECTIVE_SUBJECTS = [
  // Additional Sciences
  { name: "Additional Mathematics", code: "ADD-MATH", type: "elective", grades: [9, 10] },
  { name: "Environmental Science", code: "ENV-SCI", type: "elective", grades: [11, 12] },

  // Languages
  { name: "Hindi", code: "HIN", type: "language", grades: [6, 7, 8, 9, 10] },
  { name: "Nepali", code: "NEP", type: "language", grades: [6, 7, 8, 9, 10] },
  { name: "Chinese", code: "CHI", type: "language", grades: [9, 10, 11, 12] },
  { name: "French", code: "FRE", type: "language", grades: [9, 10, 11, 12] },

  // Vocational
  { name: "Agriculture", code: "AGRI", type: "elective", grades: [9, 10, 11, 12] },
  { name: "Home Science", code: "HOME", type: "elective", grades: [9, 10, 11, 12] },
  { name: "Technical Drawing", code: "TD", type: "elective", grades: [9, 10] },

  // Arts
  { name: "Art & Craft", code: "ART", type: "elective", grades: [6, 7, 8] },
  { name: "Music", code: "MUS", type: "elective", grades: [6, 7, 8, 9, 10] },
  { name: "Drama", code: "DRAM", type: "elective", grades: [9, 10, 11, 12] },

  // Physical Education
  { name: "Physical Education", code: "PE", type: "elective", grades: [6, 7, 8, 9, 10, 11, 12] },
  { name: "Health & Physical Education", code: "HPE", type: "elective", grades: [9, 10, 11, 12] },
];

async function seedSubjects() {
  console.log("🌱 Seeding global subjects for Bhutan curriculum...\n");

  try {
    // Check existing global subjects
    const existing = await db
      .select({ id: subjects.id, code: subjects.code })
      .from(subjects)
      .where(sql`${subjects.schoolId} IS NULL`);

    if (existing.length > 0) {
      console.log(`⚠️  Found ${existing.length} existing global subjects`);
      console.log("Delete them first if you want to re-seed:");
      console.log("   DELETE FROM subjects WHERE school_id IS NULL;\n");
      return;
    }

    const allSubjects = [...CORE_SUBJECTS, ...ELECTIVE_SUBJECTS];
    let count = 0;

    for (const subject of allSubjects) {
      for (const grade of subject.grades) {
        const subjectId = `subj_${nanoid()}`;

        await db.insert(subjects).values({
          id: subjectId,
          schoolId: null, // NULL = global subject
          departmentId: null,
          code: `${subject.code}-${grade}`,
          name: subject.name,
          type: subject.type,
          subjectType: subject.type,
          description: `${subject.name} for Class ${grade}`,
          grade,
          applicableGrades: JSON.stringify([grade]),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        count++;
      }
    }

    console.log(`✅ Successfully seeded ${count} global subjects`);
    console.log("\n📚 Summary:");
    console.log(`   - Core Subjects: ${CORE_SUBJECTS.length} × avg 7 grades = ~${CORE_SUBJECTS.length * 7}`);
    console.log(`   - Elective Subjects: ${ELECTIVE_SUBJECTS.length} × avg 4 grades = ~${ELECTIVE_SUBJECTS.length * 4}`);
    console.log(`   - Total: ${count} subject-grade combinations`);
    console.log("\n✨ Schools can now add these subjects to their catalog!");

  } catch (error) {
    console.error("❌ Error seeding subjects:", error);
    process.exit(1);
  }
}

// Run the seed function
seedSubjects().then(() => process.exit(0));
