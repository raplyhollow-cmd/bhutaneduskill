/**
 * SCHOOL ADMIN CLASS ASSIGN TEACHER API
 *
 * POST /api/school-admin/classes/[id]/assign-teacher - Assign a teacher to a class
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

export const POST = createApiRoute(
  async (request: NextRequest, auth, context: { params: Promise<{ id: string }> }) => {
    const { userId } = auth;
    const { id: classId } = await context.params;
    const body = await request.json();
    const { teacherId } = body;

    if (!teacherId) {
      return badRequestResponse("Teacher ID is required");
    }

    // Verify the teacher exists and is a teacher using db.select()
    const teacherCheck = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);

    if (teacherCheck.length === 0) {
      return notFoundResponse("Teacher");
    }

    if (teacherCheck[0].type !== "teacher") {
      return badRequestResponse("Selected user is not a teacher");
    }

    // Update the class with the new teacher
    await db
      .update(classes)
      .set({ teacherId, updatedAt: new Date() })
      .where(eq(classes.id, classId));

    // Log success
    logger.info("Teacher assigned to class", { userId, classId, teacherId });

    // Return success response
    return successResponse({ message: "Teacher assigned successfully" });
  },
  ['school-admin', 'admin']
);
