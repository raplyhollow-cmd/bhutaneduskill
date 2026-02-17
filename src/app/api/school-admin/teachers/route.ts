import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";

// GET /api/school-admin/teachers - List all teachers for the school
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subject = searchParams.get("subject");

    // Get school ID from current user
    const currentUserData = await db.query.users.findFirst({
      where: eq(users.id, user.id),
      columns: { schoolId: true },
    });

    const schoolId = currentUserData?.schoolId;

    // Build conditions
    const conditions = [
      eq(users.type, "teacher"),
    ];

    if (schoolId) {
      conditions.push(eq(users.schoolId, schoolId));
    }

    if (search) {
      const searchCondition = or(
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`),
        like(users.email, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    // Fetch teachers
    const teachersList = await db.query.users.findMany({
      where: and(...conditions),
      orderBy: [desc(users.createdAt)],
    });

    // Transform for frontend
    const transformedTeachers = teachersList.map((teacher) => {
      const subjectsArray = teacher.subjects
        ? typeof teacher.subjects === 'string'
          ? JSON.parse(teacher.subjects)
          : teacher.subjects
        : [];

      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
        email: teacher.email,
        employeeId: teacher.employeeId,
        subjects: Array.isArray(subjectsArray)
          ? subjectsArray.map((s: unknown) => typeof s === 'string' ? s : (s as { name?: string })?.name || (s as { subjectName?: string })?.subjectName || String(s))
          : [],
        classGrade: teacher.classGrade,
        section: teacher.section,
        isActive: teacher.isActive,
      };
    });

    return NextResponse.json({ teachers: transformedTeachers });
  } catch (error) {
    logger.error("Teachers fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}
