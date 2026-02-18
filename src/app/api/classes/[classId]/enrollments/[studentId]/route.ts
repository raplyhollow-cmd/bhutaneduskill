/**
 * DELETE /api/classes/[classId]/enrollments/[studentId]
 * Remove a student from a class
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { enrollments, users, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * DELETE /api/classes/[classId]/enrollments/[studentId]
 * Remove a specific student from a class
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const { classId, studentId } = await params;

    // Verify both class and student exist
    const [classRecord, studentRecord] = await Promise.all([
      db.query.classes.findFirst({
        where: eq(classes.id, classId),
      }),
      db.query.users.findFirst({
        where: eq(users.id, studentId),
      }),
    ]);

    if (!classRecord) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (!studentRecord) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    if (studentRecord.type !== "student") {
      return NextResponse.json({ error: "User is not a student" }, { status: 400 });
    }

    // Find the enrollment record
    const enrollmentRecord = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ),
    });

    if (!enrollmentRecord) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Delete the enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, enrollmentRecord.id));

    logger.info("Deleted enrollment", { classId, studentId, userId });

    return NextResponse.json({
      success: true,
      message: "Student removed from class successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/enrollments/[studentId]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete enrollment" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/classes/[classId]/enrollments/[studentId]
 * Update enrollment details (e.g., roll number)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string; studentId: string }> }
) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;
    const { classId, studentId } = await params;
    const body = await request.json();

    // Find the enrollment record
    const enrollmentRecord = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ),
    });

    if (!enrollmentRecord) {
      return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });
    }

    // Update allowed fields
    const allowedUpdates = ["rollNumber", "section", "status"];
    const updates: Record<string, any> = {};
    for (const field of allowedUpdates) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentRecord.id))
      .returning();

    logger.info("Updated enrollment", { classId, studentId, updates, userId });

    return NextResponse.json({
      success: true,
      enrollment: updatedEnrollment,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/classes/[classId]/enrollments/[studentId]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update enrollment" },
      { status: 500 }
    );
  }
}
