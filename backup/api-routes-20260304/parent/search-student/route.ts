import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, students, schools } from "@/lib/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

interface StudentResult {
  id: string;
  name: string | null;
  photo: string | null;
  classGrade: string | null;
  section: string | null;
  schoolName: string | null;
}

// GET /api/parent/search-student - Search for student by CID or Index Number
export const GET = createApiRoute(
  async (req: Request, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code) {
      return { error: "Student code is required", status: 400 };
    }

    // Search for student by CID (using clerkUserId) or studentCode (index number)
    // Note: students table has userId field, not studentId. studentCode is the index number.
    const matchingStudents = await db
      .select({
        id: students.id,
        userId: students.userId,
        studentCode: students.studentCode,
        name: users.name,
        photo: users.photo,
        classGrade: students.currentClass,
        section: students.section,
        schoolName: schools.name,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .innerJoin(schools, eq(students.schoolId, schools.id))
      .where(
        or(
          eq(sql`CAST(${users.clerkUserId} AS TEXT)`, code),
          eq(students.studentCode, code)
        )
      )
      .limit(10);

    if (matchingStudents.length === 0) {
      return { error: "Student not found", status: 404 };
    }

    const student: StudentResult = {
      id: matchingStudents[0].id,
      name: matchingStudents[0].name,
      photo: matchingStudents[0].photo,
      classGrade: matchingStudents[0].classGrade,
      section: matchingStudents[0].section,
      schoolName: matchingStudents[0].schoolName,
    };

    logger.info("Student found for parent linking", { studentId: student.id });

    return { data: student };
  },
  ["parent"]
);
