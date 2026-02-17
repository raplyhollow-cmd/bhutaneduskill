import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, classes, enrollments, teacherAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/teacher/attendance - Get classes for attendance marking
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['teacher']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    // Get classes assigned to this teacher
    const assignments = await db.query.teacherAssignments.findMany({
      where: and(
        eq(teacherAssignments.teacherId, user.id),
        eq(teacherAssignments.isActive, true)
      ),
      with: {
        class: true,
      },
    });

    const classesWithStudents = await Promise.all(
      assignments.map(async (assignment) => {
        // Get enrolled students for this class
        const classEnrollments = await db.query.enrollments.findMany({
          where: and(
            eq(enrollments.classId, assignment.classId),
            eq(enrollments.status, "active")
          ),
          with: {
            student: true,
          },
        });

        return {
          ...assignment.class,
          students: classEnrollments.map(e => e.student),
          role: assignment.role,
        };
      })
    );

    return NextResponse.json({ classes: classesWithStudents });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/attendance", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
