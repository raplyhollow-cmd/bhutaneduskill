/**
 * STUDENT SEARCH API
 *
 * Allows counselors and teachers to search for students
 * Used in the counselor resources sharing functionality
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, like, and, eq, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { successResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/students/search - Search for students by name or email
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    // Minimum query length to prevent returning all students
    if (query.length < 2) {
      return successResponse({ students: [] });
    }

    const searchTerm = `%${query}%`;

    // Search students by name or email
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        classGrade: users.classGrade,
        type: users.type,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(
        and(
          eq(users.type, "student"),
          or(
            like(users.name, searchTerm),
            like(users.firstName, searchTerm),
            like(users.lastName, searchTerm),
            sql`${users.email} LIKE ${searchTerm}`
          )!
        )
      )
      .limit(limit);

    logger.info("Student search performed", {
      query,
      resultCount: students.length,
      searchedBy: userId,
    });

    const transformedStudents = students.map((student) => ({
      id: student.id,
      name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
      email: student.email || "",
      classGrade: student.classGrade || null,
    }));

    return successResponse({ students: transformedStudents });
  },
  ['admin', 'counselor', 'teacher', 'school-admin']
);
