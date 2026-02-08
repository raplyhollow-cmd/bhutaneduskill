import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, classes, enrollments, teacherAssignments } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// GET /api/teacher/attendance - Get classes for attendance marking
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden - Teachers only" }, { status: 403 });
    }

    // Get classes assigned to this teacher
    const assignments = await db.query.teacherAssignments.findMany({
      where: and(
        eq(teacherAssignments.teacherId, currentUser.id),
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
    console.error("Attendance classes fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 });
  }
}
