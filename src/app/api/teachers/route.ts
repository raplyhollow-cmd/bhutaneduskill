/**
 * TEACHERS API ROUTE
 *
 * Provides a list of teachers for:
 * - Substitute teacher selection in leave requests
 * - General teacher directory
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 *
 * Endpoints:
 * - GET: List all teachers (accessible by teachers, students, admins)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { parseJsonArray } from "@/lib/db/json-helpers";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

interface TeacherResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  name: string;
  email: string;
  employeeId?: string | null;
  subjects: string[];
}

// ============================================================================
// GET /api/teachers
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subject = searchParams.get("subject");

    // Get school ID from current user (for school scope)
    const currentUserData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const schoolId = currentUserData[0]?.schoolId;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [
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
    const teachersList = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

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

    return successResponse({ teachers });
  },
  ['teacher', 'student', 'admin', 'school-admin']
);
