import { logger } from "@/lib/logger";
import { db } from "./index";
import { users, schools, tenants, districts, classes, enrollments, subjects, homework, attendance, examResultsEnhanced, academicTerms } from "./schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

// Subject type enum matching the database schema
type SubjectType = "core" | "elective" | "language" | "additional";

// ============================================================================
// DEMO TENANT
// ============================================================================
const DEMO_TENANT = {
  id: "tenant_demo",
  name: "Demo School District",
  slug: "demo-school-district",
  domain: "demo.bhutaneduskill.bt",
  logo: "/logo.png",
  primaryColor: "rgb(249 115 22)",
  secondaryColor: "rgb(194 65 12)",
  settings: JSON.stringify({}),
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// DEMO SCHOOL
// ============================================================================
const DEMO_SCHOOL = {
  id: nanoid(),
  name: "Thimphu Middle Secondary School",
  code: "TMSS001",
  type: "public",
  address: "Thimphu, Bhutan",
  city: "Thimphu",
  state: "Thimphu",
  country: "Bhutan",
  postalCode: "11001",
  phone: "+975-2-322",
  email: "info@tmss.edu.bt",
  website: "https://tmss.edu.bt",
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
  vicePrincipalName: "Dorji Wangmo",
  schoolType: "middle",
  level: "secondary",
  contactEmail: "info@tmss.edu.bt",
  contactPhone: "+975-2-322",
  districtId: null,
  domain: "tmss.edu.bt",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ============================================================================
// DEMO USERS
// ============================================================================
const DEMO_USERS = {
  student: {
    firstName: "Tashi",
    lastName: "Dorji",
    email: "tashi.dorji@tmss.edu.bt",
    role: "student",
    type: "student",
    classGrade: 10,
    section: "A",
    dateOfBirth: "2008-05-15",
  },
  teacher: {
    firstName: "Karma",
    lastName: "Dorji",
    email: "karma.dorji@tmss.edu.bt",
    role: "teacher",
    type: "teacher",
    employeeId: "TMSS-TEA-001",
    subjects: ["Mathematics", "Physics"],
  },
  parent: {
    firstName: "Dorji",
    lastName: "Wangchuk",
    email: "dorji.wangchuk@tmss.edu.bt",
    role: "parent",
    type: "parent",
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
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxPoints: 100,
    isPublished: true,
  },
  {
    title: "English Essay: My Culture",
    description: "Write a 500-word essay about Bhutanese culture and traditions",
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
  logger.debug("🌱 Seeding database...");

  // Create Tenant
  await db.insert(tenants).values(DEMO_TENANT);

  // Create District
  const districtId = nanoid();
  await db.insert(districts).values({
    id: districtId,
    name: "Thimphu District",
    code: "THIM",
    dzongkhag: "Thimphu Thromde",
    country: "Bhutan",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Update school with districtId
  DEMO_SCHOOL.districtId = districtId;

  // Create School
  await db.insert(schools).values(DEMO_SCHOOL);

  // Helper function to create user data matching schema
  const createUserData = (baseData: {
    type: string;
    role: string;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth?: string;
    classGrade?: number;
    section?: string;
  }, tenantId: string, schoolId: string) => ({
    id: nanoid(),
    clerkUserId: `clerk_${nanoid()}`,
    type: baseData.type,
    role: baseData.role,
    name: `${baseData.firstName} ${baseData.lastName}`,
    firstName: baseData.firstName,
    lastName: baseData.lastName,
    email: baseData.email,
    phone: "+975-2-322",
    schoolId,
    profileImage: "/placeholder-avatar.png",
    dateOfBirth: baseData.dateOfBirth || "1980-01-01",
    gender: "other",
    grade: baseData.classGrade || 0,
    section: baseData.section || "",
    rollNumber: "1",
    address: "Thimphu, Bhutan",
    city: "Thimphu",
    state: "Thimphu",
    postalCode: "11001",
    country: "Bhutan",
    parentContact: "Parent Name",
    parentPhone: "+975-2-322",
    emergencyContact: "Emergency Contact",
    bloodGroup: "O+",
    tenantId,
    onboardingComplete: true,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create Users
  const studentId = nanoid();
  await db.insert(users).values(createUserData(DEMO_USERS.student, DEMO_TENANT.id, DEMO_SCHOOL.id));
  // Override the ID for student to use later
  await db.update(users).set({ id: studentId }).where(eq(users.email, DEMO_USERS.student.email));

  const parentUserId = nanoid();
  await db.insert(users).values(createUserData(DEMO_USERS.parent, DEMO_TENANT.id, DEMO_SCHOOL.id));
  await db.update(users).set({ id: parentUserId }).where(eq(users.email, DEMO_USERS.parent.email));

  const teacherUserId = nanoid();
  await db.insert(users).values(createUserData(DEMO_USERS.teacher, DEMO_TENANT.id, DEMO_SCHOOL.id));
  await db.update(users).set({ id: teacherUserId }).where(eq(users.email, DEMO_USERS.teacher.email));

  // Create Class
  const classId = nanoid();
  await db.insert(classes).values({
    id: classId,
    schoolId: DEMO_SCHOOL.id,
    name: "Class 10-A",
    grade: 10,
    section: "A",
    roomNumber: "101",
    capacity: 40,
    homeroomTeacherName: DEMO_USERS.teacher.firstName + " " + DEMO_USERS.teacher.lastName,
    classTeacherName: DEMO_USERS.teacher.firstName + " " + DEMO_USERS.teacher.lastName,
    classTeacherId: teacherUserId,
    homeroomTeacherId: teacherUserId,
    academicYear: "2024-2025",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create Enrollment (Student in Class)
  await db.insert(enrollments).values({
    id: nanoid(),
    studentId: studentId,
    classId: classId,
    academicYear: "2024-2025",
    enrollmentDate: new Date().toISOString().split("T")[0],
    status: "active",
    rollNumber: "1",
    section: "A",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // Create Subjects
  for (const sub of DEMO_SUBJECTS) {
    await db.insert(subjects).values({
      id: sub.id,
      schoolId: DEMO_SCHOOL.id,
      name: sub.name,
      code: sub.code,
      grade: sub.grade,
      type: "core" as SubjectType,
      description: `${sub.name} - core subject`,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  // Create Homework
  for (const hw of DEMO_HOMEWORK) {
    await db.insert(homework).values({
      id: `hw_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      classId: classId,
      subjectId: "sub_math_001",
      title: hw.title,
      description: hw.description,
      dueDate: hw.dueDate,
      assignedDate: new Date().toISOString().split("T")[0],
      totalPoints: hw.maxPoints || 100,
      passingScore: 40,
      questions: [],
      attachments: [],
      // REMOVED: authorId, authorName, authorRole - not in actual database
      // authorId: teacherUserId,
      // authorName: `${DEMO_USERS.teacher.firstName} ${DEMO_USERS.teacher.lastName}`,
      // authorRole: "teacher",
      isPublished: hw.isPublished,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  logger.debug("✅ Database seeded successfully!");
}

// Export the seed function
export { seedDatabase };
