/**
 * BHUTAN STANDARD SUBJECTS SEED
 *
 * Standard subjects for Bhutan middle schools (Grades 6-12)
 * Subject codes are globally unique for cross-school comparison
 *
 * Core Subjects per BCSEA curriculum:
 * - English
 * - Dzongkha
 * - Mathematics
 * - Science (Physics, Chemistry, Biology)
 * - Social Studies (History, Geography, Civics)
 * - Information Technology
 * - Health & Physical Education
 * - Environmental Science
 * - Agriculture
 * - Work Education
 * - Moral Education
 */

import "dotenv/config";
import { db } from "../src/lib/db";
import { subjects, schools } from "../src/lib/db/schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

interface Subject {
  name: string;
  nameDzongkha?: string;
  code: string;
  type: "core" | "elective" | "language" | "additional";
  description: string;
  grades: number[];
  applicableGrades: number[];
}

// Bhutan standard curriculum subjects
const bhutanSubjects: Subject[] = [
  // LANGUAGES
  {
    name: "English",
    nameDzongkha: "རྒྱ་བོད།",
    code: "ENG",
    type: "core",
    description: "English language and literature",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },
  {
    name: "Dzongkha",
    nameDzongkha: "རྫོང་ཁ",
    code: "DZO",
    type: "core",
    description: "Dzongkha language and literature",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // MATHEMATICS
  {
    name: "Mathematics",
    nameDzongkha: "གྲབཀ",
    code: "MATH",
    type: "core",
    description: "Mathematics",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // SCIENCES
  {
    name: "Science",
    nameDzongkha: "ཚན་རིག",
    code: "SCI",
    type: "core",
    description: "General Science (Grades 6-8)",
    grades: [6, 7, 8],
    applicableGrades: [6, 7, 8],
  },
  {
    name: "Physics",
    nameDzongkha: "རིག་གཞུང་རིག་གནས",
    code: "PHY",
    type: "core",
    description: "Physics",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },
  {
    name: "Chemistry",
    nameDzongkha: "རགས་བྲིབཊས་རིག",
    code: "CHEM",
    type: "core",
    description: "Chemistry",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },
  {
    name: "Biology",
    nameDzongkha: "སྐྱེདག་བདགས་",
    code: "BIO",
    type: "core",
    description: "Biology",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },

  // SOCIAL STUDIES
  {
    name: "Social Studies",
    nameDzongkha: "སྤྱི་ཚོངས་སློབ་དཔྱེད།",
    code: "SST",
    type: "core",
    description: "Social Studies (History, Geography, Civics)",
    grades: [6, 7, 8],
    applicableGrades: [6, 7, 8],
  },
  {
    name: "History",
    nameDzongkha: "སྲོད་རྒྱུས་",
    code: "HIST",
    type: "core",
    description: "History",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },
  {
    name: "Geography",
    nameDzongkha: "ས་ཁམས་རྒྱུས་",
    code: "GEOG",
    type: "core",
    description: "Geography",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },
  {
    name: "Economics",
    nameDzongkha: "དཔལ་འབྱོར་ལས་",
    code: "ECON",
    type: "core",
    description: "Economics",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },

  // INFORMATION TECHNOLOGY
  {
    name: "Information Technology",
    nameDzongkha: "བརྡ་བྱིས་བཙུགས་འཕྲུལ་",
    code: "IT",
    type: "core",
    description: "Information Technology and Computer Literacy",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // HEALTH & PHYSICAL EDUCATION
  {
    name: "Health & Physical Education",
    nameDzongkha: "གཟའ་གཟིབ་དང་ལུས་པའི་སྦྱངུལ་",
    code: "HPED",
    type: "core",
    description: "Health and Physical Education",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // ENVIRONMENTAL SCIENCE
  {
    name: "Environmental Science",
    nameDzongkha: "སྐྱེད་ཁམས་རིག་",
    code: "ENV",
    type: "core",
    description: "Environmental Science",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // WORK EDUCATION / VOCATIONAL
  {
    name: "Work Education",
    nameDzongkha: "ལཱ་བཟོ་སློབ།",
    code: "WRKED",
    type: "core",
    description: "Work Education and Vocational Skills",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // AGRICULTURE
  {
    name: "Agriculture",
    nameDzongkha: "ཞིང་ལས།",
    code: "AGR",
    type: "core",
    description: "Agricultural Education",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // MORAL EDUCATION
  {
    name: "Moral Education",
    nameDzongkha: "ངོར་སྤྱི་བསླབ།",
    code: "MORAL",
    type: "core",
    description: "Values and Moral Education",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // ART & CULTURE
  {
    name: "Art & Culture",
    nameDzongkha: "སྒྱུ་རིག་དང་རིག་གཞུང་",
    code: "ART",
    type: "core",
    description: "Art and Bhutanese Culture",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },

  // ELECTIVE SUBJECTS (Grades 9-12)
  {
    name: "Business Studies",
    nameDzongkha: "སྐུག་འབྱུཕ་ལས་",
    code: "BST",
    type: "elective",
    description: "Business Studies",
    grades: [9, 10, 11, 12],
    applicableGrades: [9, 10, 11, 12],
  },
  {
    name: "Accountancy",
    nameDzongkha: "རྩིས་ཕྱི་",
    code: "ACC",
    type: "elective",
    description: "Accountancy",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },
  {
    name: "Business Mathematics",
    nameDzongkha: "སྐུག་གྲབཀ",
    code: "B-MATH",
    type: "elective",
    description: "Business Mathematics",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },
  {
    name: "Computer Science",
    nameDzongkha: "ཀམམ་ཕུའུ་རིག",
    code: "CS",
    type: "elective",
    description: "Computer Science",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },
  {
    name: "Media Studies",
    nameDzongkha: "བརྡ་བརྒྱུད་སློབ།",
    code: "MEDIA",
    type: "elective",
    description: "Media Studies",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },
  {
    name: "Tourism",
    nameDzongkha: "འགྲི་བཅོ་སྐོར་",
    code: "TOUR",
    type: "elective",
    description: "Tourism and Hospitality",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },
  {
    name: "Entrepreneurship",
    nameDzongkha: "རང་དབང་སྐྱེད་",
    code: "ENT",
    type: "elective",
    description: "Entrepreneurship Development",
    grades: [11, 12],
    applicableGrades: [11, 12],
  },

  // ADDITIONAL SUBJECTS
  {
    name: "Nepali",
    nameDzongkha: "ནེ་པཱི།",
    code: "NEP",
    type: "additional",
    description: "Nepali language (optional)",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },
  {
    name: "Hindi",
    nameDzongkha: "ཧིན་དི།",
    code: "HIN",
    type: "additional",
    description: "Hindi language (optional)",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },
  {
    name: "Chinese",
    nameDzongkha: "རྒྱ་ན་སེ།",
    code: "CHI",
    type: "additional",
    description: "Chinese language (optional)",
    grades: [6, 7, 8, 9, 10, 11, 12],
    applicableGrades: [6, 7, 8, 9, 10, 11, 12],
  },
];

async function seedBhutanSubjects() {
  console.log("🌱 Seeding Bhutan standard subjects for Grades 6-12...\n");

  // Get all schools (we'll create subjects for each school)
  const allSchools = await db.select({ id: schools.id, code: schools.code }).from(schools);

  if (allSchools.length === 0) {
    console.log("❌ No schools found. Please create a school first.");
    return;
  }

  console.log(`📚 Found ${allSchools.length} school(s)\n`);

  let createdCount = 0;
  let skippedCount = 0;

  for (const school of allSchools) {
    console.log(`\n🏫 Processing school: ${school.code} (${school.id})`);

    for (const subject of bhutanSubjects) {
      // Check if subject already exists for this school
      const existing = await db
        .select()
        .from(subjects)
        .where(eq(subjects.code, subject.code))
        .limit(1);

      if (existing.length > 0) {
        console.log(`  ⏭️  Skipped: ${subject.name} (${subject.code}) - already exists`);
        skippedCount++;
        continue;
      }

      // For each applicable grade, create a subject entry
      for (const grade of subject.grades) {
        const subjectId = `subject_${nanoid(10)}`;

        await db.insert(subjects).values({
          id: subjectId,
          schoolId: school.id,
          name: subject.name,
          nameDzongkha: subject.nameDzongkha || null,
          code: `${subject.code}-${grade}`, // Grade-specific code (e.g., MATH-9, MATH-10)
          type: subject.type,
          subjectType: subject.type,
          description: `${subject.description} - Grade ${grade}`,
          grade: grade,
          applicableGrades: JSON.stringify(subject.applicableGrades),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        });

        createdCount++;
        console.log(`  ✅ Created: ${subject.name} Grade ${grade} (${subject.code}-${grade})`);
      }
    }
  }

  console.log(`\n\n📊 Summary:`);
  console.log(`   ✅ Created: ${createdCount} subjects`);
  console.log(`   ⏭️  Skipped: ${skippedCount} subjects`);
  console.log(`\n✨ Seeding complete!\n`);
}

// Run the seed
seedBhutanSubjects()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Error seeding subjects:", error);
    process.exit(1);
  });
