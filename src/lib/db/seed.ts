import { db } from "./index";
import { users, schools, tenants, districts, classes, enrollments, subjects, homework, attendance, examResultsEnhanced, academicTerms } from "./schema";
import { nanoid } from "nanoid";

// ============================================================================
// DEMO TENANT
// ============================================================================
const DEMO_TENANT = {
  id: "tenant_demo",
  name: "Demo School District",
  code: "DEMO",
};

// ============================================================================
// DEMO SCHOOL
// ============================================================================
const DEMO_SCHOOL = {
  id: nanoid(),
  name: "Thimphu Middle Secondary School",
  code: "TMSS001",
  type: "MSS",
  level: "VII-X",
  contactEmail: "info@tmss.edu.bt",
  contactPhone: "+975-2-322",
  logo: "/logo.png",
  establishedYear: 2000,
  accreditationStatus: "registered",
  maxStudents: 1000,
  campusSize: "10 acres",
  facilities: [],
  board: "BCSE",
  principalName: "Karma Dorji",
  principalEmail: "karma.dorji@tmss.edu.bt",
  principalPhone: "+975-2-322",
  counselorName: "Dorji Wangchuk",
  counselorEmail: "dorji.wangchuk@tmss.edu.bt",
  counselorPhone: "+975-2-322",
  districtId: null,
};

// ============================================================================
// DEMO USERS
// ============================================================================
const DEMO_USERS = {
  student: {
    firstName: "Tashi",
    lastName: "Dorji",
    email: "tashi.dorji@tmss.edu.bt",
    // type: "student",
    role: "student",
    classGrade: 10,
    section: "A",
    dateOfBirth: "2008-05-15",
  },
  teacher: {
    firstName: "Karma",
    lastName: "Dorji",
    email: "karma.dorji@tmss.edu.bt",
    // type: "teacher",
    role: "teacher",
    employeeId: "TMSS-TEA-001",
    subjects: ["Mathematics", "Physics"],
  },
  parent: {
    firstName: "Dorji",
    lastName: "",
    email: "dorji@tmss.edu.bt",
  },
};

// ============================================================================
// DEMO SUBJECTS
// ============================================================================
const DEMO_SUBJECTS = [
  { id: "sub_math_001", name: "Mathematics", code: "MATH-10", grade: 10 },
  { id: "sub_eng_001", name: "English", code: "ENG-10", grade: 10 },
  { id: "sub_phy_001", name: "Physics", code: "PHY-10", grade: 10 },
  { id: "sub_chem_001", name: "Chemistry", code: "CHM-10", grade: 10 },
  { id: "sub_his_001", name: "Bhutan History", code: "HIS-10", grade: 10 },
  { id: "sub_it_001", name: "Information Technology", code: "IT-10", grade: 10 },
];

// ============================================================================
// DEMO CLASSES
// ============================================================================
const DEMO_CLASSES = [
  {
    name: "Class 10-A",
    grade: 10,
    section: "A",
    academicYear: "2024-2025",
    subjectId: "sub_math_001",
  },
];

// ============================================================================
// DEMO HOMEWORK
// ============================================================================
const DEMO_HOMEWORK = [
  {
    title: "Quadratic Equations Practice",
    description: "Solve quadratic equations using factoring and quadratic formula",
    // type: "assignment",
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxPoints: 100,
    isPublished: true,
  },
  {
    title: "English Essay: My Culture",
    description: "Write a 500-word essay about Bhutanese culture and traditions",
    // type: "assignment",
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxPoints: 50,
    isPublished: true,
  },
];

/**
 * Database Seed Script
 *
 * Creates demo data for testing the application
 */
async function seedDatabase() {
  console.log("🌱 Seeding database...");

  // Create Tenant
  const [tenant] = await db
    .insert(tenants)
    .values({
      id: "tenant_demo",
      name: "Demo School District",
      code: "DEMO",
    })
    .returning();

  // Create School
  const [school] = await db
    .insert(schools)
    .values(DEMO_SCHOOL)
    .returning();

  // Create District
  const [district] = await db
    .insert(districts)
    .values({
      id: nanoid(),
      name: "Thimphu District",
      code: "THIM",
    })
    .returning();

  // Create Users
  await db.insert(users).values({
    id: nanoid(),
    tenantId: tenant.id,
    schoolId: school.id,
    ...DEMO_USERS.student,
  });

  const [parentUser] = await db.insert(users).values({
    id: nanoid(),
    tenantId: tenant.id,
    schoolId: school.id,
    ...DEMO_USERS.parent,
  });

  const [teacherUser] = await db.insert(users).values({
    id: nanoid(),
    tenantId: tenant.id,
    schoolId: school.id,
    ...DEMO_USERS.teacher,
  });

  // Create Classes
  const classData = {
    name: "Class 10-A",
    grade: 10,
    section: "A",
    academicYear: "2024-2025",
    subjectId: "sub_math_001",
  };

  await db.insert(classes).values(classData);

  // Create Enrollments (Student in Class)
  await db.insert(enrollments).values({
    id: nanoid(),
    tenantId: tenant.id,
    schoolId: school.id,
    userId: (parentUser as any)[0].id,
    classId: classData.id,
    role: "student",
    academicYear: "2024-2025",
  });

  // Create Subjects
  for (const sub of DEMO_SUBJECTS) {
    await db.insert(subjects).values({
      id: sub.id,
      schoolId: school.id,
      name: sub.name,
      code: sub.code,
      grade: sub.grade,
    });
  }

  // Create Homework
  for (const hw of DEMO_HOMEWORK) {
    const [studentUser] = await db.query.users.findFirst({
      where: eq(users.email, "tashi.dorji@tmss.edu.bt"),
    });

    await db.insert(homework).values({
      id: `hw_${Date.now()}`,
      teacherId: (teacherUser as any)[0].id,
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      isPublished: hw.isPublished,
    });
  }

  console.log("✅ Database seeded successfully!");
}