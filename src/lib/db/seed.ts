/**
 * Database Seed Script
 *
 * Creates demo data for testing the application
 * Run with: npm run db:seed
 */

import { db } from "./index";
import { users, schools, tenants, districts, classes, enrollments, subjects, homework, attendance, examResultsEnhanced, academicTerms } from "./schema";
import { nanoid } from "nanoid";
import { eq } from "drizzle-orm";

/**
 * Demo School Configuration
 */
const DEMO_SCHOOL = {
  name: "Thimphu Middle Secondary School",
  code: "TMSS001",
  address: "Thimphu, Bhutan",
  schoolType: "MSS",
  level: "VII-X",
  contactEmail: "info@tmss.edu.bt",
  contactPhone: "+975-2-32245",
};

/**
 * Demo Users Configuration
 */
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
    lastName: "Wangyal",
    email: "dorji.wangyal@gmail.com",
    // type: "parent",
    role: "parent",
    occupation: "Businessman",
    relationship: "Father",
  },
  counselor: {
    firstName: "Pema",
    lastName: "Lhamo",
    email: "pema.lhamo@tmss.edu.bt",
    // type: "counselor",
    role: "counselor",
  },
  schoolAdmin: {
    firstName: "Sangay",
    lastName: "Thinley",
    email: "sangay.thinley@tmss.edu.bt",
    // type: "admin",
    role: "school_admin",
  },
};

/**
 * Demo Subjects
 */
const DEMO_SUBJECTS = [
  { id: "sub_math_001", name: "Mathematics", code: "MATH-10", grade: 10 },
  { id: "sub_eng_001", name: "English", code: "ENG-10", grade: 10 },
  { id: "sub_phy_001", name: "Physics", code: "PHY-10", grade: 10 },
  { id: "sub_chem_001", name: "Chemistry", code: "CHM-10", grade: 10 },
  { id: "sub_his_001", name: "Bhutan History", code: "HIS-10", grade: 10 },
  { id: "sub_it_001", name: "Information Technology", code: "IT-10", grade: 10 },
];

/**
 * Demo Classes
 */
const DEMO_CLASSES = [
  {
    name: "Class 10-A",
    grade: 10,
    section: "A",
    academicYear: "2024-2025",
    subjectId: "sub_math_001",
  },
];

/**
 * Demo Homework
 */
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
  {
    title: "Physics Lab Report: Motion",
    description: "Complete the lab report on Newton's laws of motion",
    // type: "assignment",
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    maxPoints: 75,
    isPublished: true,
  },
];

/**
 * Demo Exam Results
 */
const DEMO_EXAM_RESULTS = {
  examType: "midterm",
  examName: "Class 10 Midterm Examination 2024",
  examYear: 2024,
  subjectResults: [
    { subjectName: "Mathematics", marksObtained: 78, maxMarks: 100, percentage: 78, grade: "A+" },
    { subjectName: "English", marksObtained: 82, maxMarks: 100, percentage: 82, grade: "A+" },
    { subjectName: "Physics", marksObtained: 70, maxMarks: 100, percentage: 70, grade: "A" },
    { subjectName: "Chemistry", marksObtained: 75, maxMarks: 100, percentage: 75, grade: "A" },
    { subjectName: "Bhutan History", marksObtained: 85, maxMarks: 100, percentage: 85, grade: "A+" },
    { subjectName: "Information Technology", marksObtained: 88, maxMarks: 100, percentage: 88, grade: "A+" },
  ],
  totalMarksObtained: 478,
  totalMaxMarks: 600,
  overallPercentage: 80,
  division: "First Division",
  rank: 3,
};

/**
 * Generate attendance records for last 30 days
 */
function generateAttendanceRecords(studentId: string, classId: string, schoolId: string) {
  const records = [];
  const today = new Date();

  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    // Skip weekends (Saturday = 6, Sunday = 0)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue;

    // Random attendance (mostly present, some absent/late)
    const rand = Math.random();
    let status: "present" | "absent" | "late" | "excused" = "present";
    if (rand < 0.05) status = "absent";
    else if (rand < 0.10) status = "late";
    else if (rand < 0.12) status = "excused";

    records.push({
      id: nanoid(),
      schoolId,
      classId,
      studentId,
      date: dateStr,
      status,
      entryMethod: "manual",
      enteredBy: "teacher_demo",
      checkInTime: status === "late" ? "08:45" : "08:30",
      checkOutTime: "15:30",
    });
  }

  return records;
}

/**
 * Main Seed Function
 */
export async function seedDatabase() {
  console.log("🌱 Starting database seed...");

  try {
    // 1. Create or get Tenant
    console.log("📁 Creating tenant...");
    const existingTenants = await db.query.tenants.findMany();
    let tenant;
    if (existingTenants.length === 0) {
      [tenant] = await db.insert(tenants).values({
    // @ts-ignore
        id: "tenant_default",
        name: "Bhutan EduSkill",
        slug: "bhutan-eduskill",
        createdAt: new Date(),
    } as any).returning();
    } else {
      tenant = existingTenants[0];
    }

    // 2. Create or get District (Thimphu)
    console.log("🏔️ Creating district...");
    const existingDistricts = await db.query.districts.findMany();
    let district;
    if (existingDistricts.length === 0) {
      [district] = await db.insert(districts).values({
        id: "district_thimphu",
        name: "Thimphu",
        // nameDzongkha: "ཐིམ་",
        code: "TH",
        isCity: true,
        isActive: true,
        createdAt: new Date(),
    } as any).returning();
    } else {
      district = existingDistricts[0];
    }

    // 3. Create School
    console.log("🏫 Creating school...");
    const existingSchools = await db.query.schools.findMany();
    let school;
    if (existingSchools.length === 0) {
      [school] = await db.insert(schools).values({
        id: nanoid(),
        tenantId: tenant.id,
        districtId: district.id,
        ...DEMO_SCHOOL,
        createdAt: new Date(),
    } as any).returning();
    } else {
      school = existingSchools[0];
    }

    // 4. Create Academic Term
    console.log("📅 Creating academic term...");
    const existingTerms = await db.query.academicTerms.findMany();
    let term;
    if (existingTerms.length === 0) {
      [term] = await db.insert(academicTerms).values({
        id: "term_2024_2025",
        schoolId: school.id,
        name: "Academic Year 2024-2025",
        // type: "annual",
        startDate: "2024-02-01",
        endDate: "2025-12-31",
        isActive: true,
        createdAt: new Date(),
    } as any).returning();
    } else {
      term = existingTerms[0];
    }

    // 5. Create Subjects
    console.log("📚 Creating subjects...");
    for (const sub of DEMO_SUBJECTS) {
      const existingSubjects = await db.query.subjects.findMany({
        where: eq(subjects.code, sub.code),
      });
      if (existingSubjects.length === 0) {
        await db.insert(subjects).values({
          ...sub,
          schoolId: school.id,
          createdAt: new Date(),
        } as any);
      }
    }

    // 6. Create Users (Parent first, then Student)
    console.log("👥 Creating users...");

    let parentUser = await db.query.users.findMany({
      where: eq(users.email, DEMO_USERS.parent.email),
    });

    if (parentUser.length === 0) {
      [parentUser] = [await db.insert(users).values({
        id: nanoid(),
        tenantId: tenant.id,
        schoolId: school.id,
        ...DEMO_USERS.parent,
        clerkUserId: `parent_demo_${Date.now()}`,
        onboardingComplete: true,
        createdAt: new Date(),
      }).returning()];
      console.log("  ✅ Created parent:", parentUser[0].firstName, parentUser[0].lastName);
    } else {
      parentUser = [parentUser[0]];
    }

    // Create Student
    let studentUser = await db.query.users.findMany({
      where: eq(users.email, DEMO_USERS.student.email),
    });

    if (studentUser.length === 0) {
      [studentUser] = [await db.insert(users).values({
        id: nanoid(),
        tenantId: tenant.id,
        schoolId: school.id,
        ...DEMO_USERS.student,
        parentId: parentUser[0].id,
        clerkUserId: `student_demo_${Date.now()}`,
        onboardingComplete: true,
        createdAt: new Date(),
      }).returning()];
      console.log("  ✅ Created student:", studentUser[0].firstName, studentUser[0].lastName);
    } else {
      studentUser = [studentUser[0]];
    }

    // Create Teacher
    let teacherUser = await db.query.users.findMany({
      where: eq(users.email, DEMO_USERS.teacher.email),
    });

    if (teacherUser.length === 0) {
      [teacherUser] = [await db.insert(users).values({
        id: nanoid(),
        tenantId: tenant.id,
        schoolId: school.id,
        ...DEMO_USERS.teacher,
        clerkUserId: `teacher_demo_${Date.now()}`,
        onboardingComplete: true,
        createdAt: new Date(),
      }).returning()];
      console.log("  ✅ Created teacher:", teacherUser[0].firstName, teacherUser[0].lastName);
    } else {
      teacherUser = [teacherUser[0]];
    }

    // 7. Create Class
    console.log("🏫 Creating class...");
    const mathSubject = await db.query.subjects.findMany({
      where: eq(subjects.code, "MATH-10"),
    });

    let classRecord = await db.query.classes.findMany();

    if (classRecord.length === 0 && mathSubject.length > 0 && teacherUser.length > 0) {
      [classRecord] = [await db.insert(classes).values({
        id: nanoid(),
        schoolId: school.id,
        teacherId: teacherUser[0].id,
        subjectId: mathSubject[0].id,
        ...DEMO_CLASSES[0],
        students: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning()];
      console.log("  ✅ Created class:", classRecord[0].name);
    } else if (classRecord.length > 0) {
      classRecord = [classRecord[0]];
    }

    // 8. Create Enrollment
    console.log("📝 Creating enrollment...");
    if (classRecord.length > 0 && studentUser.length > 0) {
      const existingEnrollment = await db.query.enrollments.findMany({
        where: eq(enrollments.studentId, studentUser[0].id),
      });

      if (existingEnrollment.length === 0) {
        await db.insert(enrollments).values({
          id: nanoid(),
          studentId: studentUser[0].id,
          classId: classRecord[0].id,
          schoolYear: "2024-2025",
          status: "active",
          rollNumber: 15,
          enrolledAt: new Date(),
          createdAt: new Date(),
        } as any);
        console.log("  ✅ Created enrollment for student");
      }
    }

    // 9. Create Homework
    console.log("📄 Creating homework...");
    if (classRecord.length > 0 && teacherUser.length > 0) {
      for (const hw of DEMO_HOMEWORK) {
        const existingHw = await db.query.homework.findMany({
          where: eq(homework.title, hw.title),
        });

        if (existingHw.length === 0) {
          await db.insert(homework).values({
            id: nanoid(),
            schoolId: school.id,
            classId: classRecord[0].id,
            subjectId: mathSubject[0].id,
            teacherId: teacherUser[0].id,
            termId: term.id,
            ...hw,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any);
          console.log(`  ✅ Created homework: ${hw.title}`);
        }
      }
    }

    // 10. Create Attendance Records
    console.log("📋 Creating attendance records...");
    if (classRecord.length > 0 && studentUser.length > 0) {
      const attendanceRecords = generateAttendanceRecords(studentUser[0].id, classRecord[0].id, school.id);

      for (const record of attendanceRecords) {
        await db.insert(attendance).values(record);
      }
      console.log(`  ✅ Created ${attendanceRecords.length} attendance records`);
    }

    // 11. Create Exam Results
    console.log("📊 Creating exam results...");
    const existingResult = await db.query.examResultsEnhanced.findMany({
      where: eq(examResultsEnhanced.studentId, studentUser[0].id),
    });

    if (existingResult.length === 0) {
      await db.insert(examResultsEnhanced).values({
        id: nanoid(),
        schoolId: school.id,
        studentId: studentUser[0].id,
        termId: term.id,
        ...DEMO_EXAM_RESULTS,
        isVerified: true,
        enteredBy: teacherUser[0].id,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      console.log("  ✅ Created exam results");
    }

    console.log("");
    console.log("✅ Database seed completed successfully!");
    console.log("");
    console.log("📝 Demo Login Credentials:");
    console.log("   Student: tashi.dorji@tmss.edu.bt");
    console.log("   Teacher: karma.dorji@tmss.edu.bt");
    console.log("   Parent: dorji.wangyal@gmail.com");
    console.log("");
    console.log("⚠️  Note: These users have demo clerkUserId format.");
    console.log("   For real login, create actual Clerk users and update clerkUserId.");

    console.log("");

  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("✅ Seed script completed");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Seed script failed:", error);
      process.exit(1);
    });
}
