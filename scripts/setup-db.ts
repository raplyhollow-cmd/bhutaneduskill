import { drizzle, LibSQLDatabase } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "../src/lib/db/schema";
import { CAREERS_DATABASE, RUB_COLLEGES, STUDY_ABROAD_REQUIREMENTS } from "../src/lib/tenant";

const client = createClient({
  url: "file:local.db",
});

const db = drizzle(client, { schema });

async function seed() {
  console.log("🌱 Starting database seed...");

  // Create default tenant
  const defaultTenant = await db
    .insert(schema.tenants)
    .values({
      id: "default",
      name: "Career Compass",
      slug: "default",
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✅ Created default tenant:", defaultTenant);

  // Create demo school
  const demoSchool = await db
    .insert(schema.schools)
    .values({
      id: "school-demo",
      tenantId: "default",
      name: "Yangchenphug Higher Secondary School",
      code: "YHSS",
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✅ Created demo school:", demoSchool);

  // Create demo users
  const demoStudent = await db
    .insert(schema.users)
    .values({
      id: "student-demo",
      tenantId: "default",
      schoolId: "school-demo",
      type: "student",
      email: "tashi.dorji@example.com",
      firstName: "Tashi",
      lastName: "Dorji",
      dateOfBirth: "2010-05-15",
      classGrade: 10,
      emailVerified: true,
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✅ Created demo student:", demoStudent);

  const demoTeacher = await db
    .insert(schema.users)
    .values({
      id: "teacher-demo",
      tenantId: "default",
      schoolId: "school-demo",
      type: "teacher",
      email: "teacher@yhss.edu.bt",
      firstName: "Karma",
      lastName: "Wangchuk",
      employeeId: "T-001",
      subjects: ["Mathematics", "Computer Science"],
      emailVerified: true,
      createdAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✅ Created demo teacher:", demoTeacher);

  // Create demo class
  const demoClass = await db
    .insert(schema.classes)
    .values({
      id: "class-demo",
      schoolId: "school-demo",
      teacherId: "teacher-demo",
      name: "Class 10 A",
      grade: 10,
      section: "A",
      academicYear: "2026",
      students: ["student-demo"],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning()
    .then((rows) => rows[0]);

  console.log("✅ Created demo class:", demoClass);

  // Insert careers
  for (const career of CAREERS_DATABASE) {
    await db.insert(schema.careers).values({
      id: career.id,
      tenantId: "default",
      name: career.name,
      slug: career.slug,
      description: career.description,
      riasecCode: career.riasecCode,
      riasecScores: career.riasecScores,
      skills: career.skills,
      educationPath: career.educationPath,
      subjects: career.subjects,
      workEnvironment: career.workEnvironment,
      salaryRange: career.salaryRange,
      demandOutlook: career.demandOutlook as any,
      bhutanSpecific: career.bhutanSpecific ? 1 : 0,
      isActive: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  console.log(`✅ Created ${CAREERS_DATABASE.length} careers`);

  console.log("🎉 Database seed complete!");
  process.exit(0);
}

seed().catch((error) => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});
