/**
 * Class Enrollment API
 *
 * DELETE /api/classes/[classId]/enrollments/[studentId] - Remove student from class
 * PATCH /api/classes/[classId]/enrollments/[studentId] - Update enrollment details
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { enrollments, users, classes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, notFoundResponse, badRequestResponse } from "@/lib/api/response-helpers";

type RouteContext = {
  params: Promise<{ classId: string; studentId: string }>;
};

// ============================================================================
// DELETE /api/classes/[classId]/enrollments/[studentId]
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth, context: RouteContext) => {
    const { userId } = auth;
    const { classId, studentId } = await context.params;

    // Verify both class and student exist
    const [classRecord, studentRecord] = await Promise.all([
      db.select().from(classes).where(eq(classes.id, classId)).limit(1).then(r => r[0]),
      db.select().from(users).where(eq(users.id, studentId)).limit(1).then(r => r[0]),
    ]);

    if (!classRecord) {
      return notFoundResponse("Class");
    }

    if (!studentRecord) {
      return notFoundResponse("Student");
    }

    if (studentRecord.type !== "student") {
      return errorResponse("User is not a student", 400);
    }

    // Find the enrollment record
    const [enrollmentRecord] = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ))
      .limit(1);

    if (!enrollmentRecord) {
      return notFoundResponse("Enrollment");
    }

    // Delete the enrollment
    await db
      .delete(enrollments)
      .where(eq(enrollments.id, enrollmentRecord.id));

    logger.info("Deleted enrollment", { classId, studentId, userId });

    return successResponse({
      success: true,
      message: "Student removed from class successfully",
    });
  },
  ['school-admin', 'admin']
);

// ============================================================================
// PATCH /api/classes/[classId]/enrollments/[studentId]
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth, context: RouteContext) => {
    const { userId } = auth;
    const { classId, studentId } = await context.params;
    const body = await req.json();

    // Find the enrollment record
    const [enrollmentRecord] = await db
      .select()
      .from(enrollments)
      .where(and(
        eq(enrollments.classId, classId),
        eq(enrollments.studentId, studentId)
      ))
      .limit(1);

    if (!enrollmentRecord) {
      return notFoundResponse("Enrollment");
    }

    // Update allowed fields
    const allowedUpdates = ["rollNumber", "section", "status"];
    const updates: Record<string, unknown> = {};
    for (const field of allowedUpdates) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    if (Object.keys(updates).length === 0) {
      return badRequestResponse("No valid fields to update");
    }

    const [updatedEnrollment] = await db
      .update(enrollments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(enrollments.id, enrollmentRecord.id))
      .returning();

    logger.info("Updated enrollment", { classId, studentId, updates, userId });

    return successResponse({
      success: true,
      enrollment: updatedEnrollment,
      message: "Enrollment updated successfully",
    });
  },
  ['school-admin', 'admin']
);
