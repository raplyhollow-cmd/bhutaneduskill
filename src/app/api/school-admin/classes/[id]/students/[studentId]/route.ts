/**
 * REMOVE STUDENT FROM CLASS
 *
 * DELETE /api/school-admin/classes/[id]/students/[studentId]
 *
 * Removes a student from a class by deactivating their enrollment.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { enrollments, classes, students } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface RouteContext {
  params: Promise<{ id: string; studentId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(["school-admin", "admin"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: 401 });
  }

  const { id: classId, studentId } = await context.params;

  try {
    console.log("[Remove Student] Removing student from class:", { classId, studentId });

    // Verify class exists
    const classRecord = await db
      .select()
      .from(classes)
      .where(eq(classes.id, classId))
      .limit(1);

    if (classRecord.length === 0) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    // Find and deactivate the enrollment
    const result = await db
      .update(enrollments)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(
        and(
          eq(enrollments.classId, classId),
          eq(enrollments.studentId, studentId)
        )
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Also clear the student's currentClass field
    await db
      .update(students)
      .set({ currentClass: null, updatedAt: new Date() })
      .where(eq(students.userId, studentId));

    console.log("[Remove Student] Student removed from class");

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error: any) {
    console.error("[Remove Student] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to remove student" },
      { status: 500 }
    );
  }
}
