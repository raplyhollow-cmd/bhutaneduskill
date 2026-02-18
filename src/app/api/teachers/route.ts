/**
 * TEACHERS API ROUTE
 *
 * Provides a list of teachers for:
 * - Substitute teacher selection in leave requests
 * - General teacher directory
 *
 * Endpoints:
 * - GET: List all teachers (accessible by teachers, students, admins)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { parseJsonArray } from "@/lib/db/json-helpers";

interface TeacherResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  employeeId?: string | null;
  subjects: string[];
}

/**
 * GET /api/teachers
 * List all teachers for substitute selection
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['teacher', 'student', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subject = searchParams.get("subject");

    // Get school ID from current user (for school scope)
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
    const teachers: TeacherResponse[] = teachersList.map((teacher) => {
      const subjectsArray = parseJsonArray<string>(teacher.subjects);

      return {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        name: teacher.name || `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim(),
        email: teacher.email,
        employeeId: teacher.employeeId,
        subjects: Array.isArray(subjectsArray)
          ? subjectsArray.map((s) =>
              typeof s === "string"
                ? s
                : (s as { name?: string })?.name ||
                  (s as { subjectName?: string })?.subjectName ||
                  String(s)
            )
          : [],
      };
    });

    logger.info("Teachers list fetched", {
      route: "/api/teachers",
      method: "GET",
      userId: user.id,
      count: teachers.length,
    });

    return NextResponse.json({ teachers });
  } catch (error) {
    logger.apiError(error, { route: "/api/teachers", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch teachers" },
      { status: 500 }
    );
  }
}
