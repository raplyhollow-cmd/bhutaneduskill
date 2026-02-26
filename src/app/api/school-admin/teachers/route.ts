/**
 * TEACHERS API (School Admin)
 *
 * GET /api/school-admin/teachers - List all teachers for the school
 *
 * MIGRATED: Now uses createApiRoute wrapper for cleaner code
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

// ============================================================================
// GET /api/school-admin/teachers - List all teachers for the school
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return successResponse({ teachers: [] }); // Return empty for unauthorized instead of error
    }

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const subject = searchParams.get("subject");
    const status = searchParams.get("status");

    // Get school ID from current user
    const currentUserResult = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    const schoolId = currentUserResult[0]?.schoolId;

    // Build conditions
    const conditions = [
      eq(users.type, "teacher"),
    ];

    if (schoolId) {
      conditions.push(eq(users.schoolId, schoolId));
    }

    // Filter by status if provided
    if (status === "active") {
      conditions.push(eq(users.isActive, true));
    }

    if (search) {
      const searchCondition = or(
        like(users.firstName, `%${search}%`),
        like(users.lastName, `%${search}%`),
        like(users.email, `%${search}%`)
      );
      if (searchCondition) conditions.push(searchCondition);
    }

    // Fetch teachers using db.select
    const teachersList = await db
      .select()
      .from(users)
      .where(and(...conditions))
      .orderBy(desc(users.createdAt));

    // Transform for frontend
    const transformedTeachers = teachersList.map((teacher) => {
      let subjectsArray: string[] = [];
      try {
        if (teacher.subjects) {
          subjectsArray = typeof teacher.subjects === 'string'
            ? JSON.parse(teacher.subjects)
            : teacher.subjects;
        }
      } catch {
        subjectsArray = [];
      }

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
        isActive: teacher.isActive ?? true,
      };
    });

    logger.info("Teachers fetched successfully", { count: transformedTeachers.length });

    return successResponse({ teachers: transformedTeachers });
  },
  ['admin', 'school-admin']
);
