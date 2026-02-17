/**
 * STUDENT SEARCH API
 *
 * Allows counselors and teachers to search for students
 * Used in the counselor resources sharing functionality
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { or, like, and, eq } from "drizzle-orm";
import { logger } from "@/lib/logger";

// GET /api/students/search - Search for students by name or email
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin', 'counselor', 'teacher', 'school-admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  // Minimum query length to prevent returning all students
  if (query.length < 2) {
    return NextResponse.json({ students: [] });
  }

  try {
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
            like(users.email as any, searchTerm)
          )!
        )
      )
      .limit(limit);

    logger.info("Student search performed", {
      query,
      resultCount: students.length,
      searchedBy: userId,
    });

    return NextResponse.json({
      students: students.map((student) => ({
        id: student.id,
        name: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim(),
        email: student.email || "",
        classGrade: student.classGrade || null,
      })),
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/students/search", method: "GET" });
    return NextResponse.json({ error: "Failed to search students", students: [] }, { status: 500 });
  }
}
