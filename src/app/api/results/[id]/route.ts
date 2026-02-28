/**
 * EXAM RESULTS [id] API
 *
 * Handles individual exam result operations (get, update, delete, verify)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, examResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { canAccessSchool } from "@/lib/db/tenant";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/results/[id] - Get single exam result
// ============================================================================

export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const currentUser = auth.user;

    const [result] = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, id))
      .limit(1);

    if (!result) {
      return notFoundResponse("Result");
    }

    // Get the user to check school access
    const [resultUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, result.userId))
      .limit(1);

    // Check access permissions
    if (result.userId !== currentUser.id) {
      // Counselors, teachers, and admins can view other students' results
      if (!["counselor", "teacher", "admin"].includes(currentUser.type)) {
        return forbiddenResponse("Access denied");
      }

      // Verify school access
      if (resultUser?.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, resultUser.schoolId)) {
        return forbiddenResponse("Access denied");
      }
    }

    return successResponse({ result });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// ============================================================================
// PUT /api/results/[id] - Update exam result
// ============================================================================

export const PUT = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const currentUser = auth.user;

    const [existingResult] = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, id))
      .limit(1);

    if (!existingResult) {
      return notFoundResponse("Result");
    }

    // Get the user to check school access
    const [resultUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingResult.userId))
      .limit(1);

    // Check permissions - only counselor, teacher, and admin can edit
    if (!["counselor", "teacher", "admin"].includes(currentUser.type)) {
      return forbiddenResponse("Access denied");
    }

    // Verify school access
    if (resultUser?.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, resultUser.schoolId)) {
      return forbiddenResponse("Access denied");
    }

    const body = await request.json();
    const { examType, examYear, subjects } = body;

    // Recalculate total percentage and division
    const totalPercentage = Math.round(
      subjects.reduce((sum: number, s: { marks: number }) => sum + s.marks, 0) /
        subjects.reduce((sum: number, s: { totalMarks: number }) => sum + s.totalMarks, 0) * 100
    );

    let division = "Third";
    if (totalPercentage >= 60) division = "Second";
    if (totalPercentage >= 75) division = "First";
    if (totalPercentage >= 85) division = "Distinction";

    const [updatedResult] = await db
      .update(examResults)
      .set({
        examType: examType ?? existingResult.examType,
        examYear: examYear ?? existingResult.examYear,
        subjects: subjects ?? existingResult.subjects,
        percentage: totalPercentage,
        totalPercentage: totalPercentage,
        division,
      })
      .where(eq(examResults.id, id))
      .returning();

    logger.info("Exam result updated", { resultId: id, userId: auth.userId });

    return successResponse({ success: true, result: updatedResult });
  },
  ['teacher', 'admin', 'school-admin', 'counselor']
);

// ============================================================================
// DELETE /api/results/[id] - Delete exam result
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const currentUser = auth.user;

    const [existingResult] = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, id))
      .limit(1);

    if (!existingResult) {
      return notFoundResponse("Result");
    }

    // Get the user to check school access
    const [resultUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingResult.userId))
      .limit(1);

    // Check permissions - only admin and counselor can delete
    if (!["admin", "counselor"].includes(currentUser.type)) {
      return forbiddenResponse("Access denied");
    }

    // Verify school access
    if (resultUser?.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, resultUser.schoolId)) {
      return forbiddenResponse("Access denied");
    }

    await db.delete(examResults).where(eq(examResults.id, id));

    logger.info("Exam result deleted", { resultId: id, userId: auth.userId });

    return successResponse({ success: true });
  },
  ['admin', 'counselor']
);

// ============================================================================
// PATCH /api/results/[id] - Verify exam result
// ============================================================================

export const PATCH = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { id } = await context!.params!;
    const currentUser = auth.user;

    const [existingResult] = await db
      .select()
      .from(examResults)
      .where(eq(examResults.id, id))
      .limit(1);

    if (!existingResult) {
      return notFoundResponse("Result");
    }

    // Get the user to check school access
    const [resultUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, existingResult.userId))
      .limit(1);

    // Only counselors and admins can verify results
    if (!["counselor", "admin"].includes(currentUser.type)) {
      return forbiddenResponse("Access denied");
    }

    // Verify school access
    if (resultUser?.schoolId && !canAccessSchool({ type: currentUser.type, schoolId: currentUser.schoolId }, resultUser.schoolId)) {
      return forbiddenResponse("Access denied");
    }

    const [updatedResult] = await db
      .update(examResults)
      .set({
        isVerified: true,
      })
      .where(eq(examResults.id, id))
      .returning();

    logger.info("Exam result verified", { resultId: id, userId: auth.userId });

    return successResponse({ success: true, result: updatedResult });
  },
  ['admin', 'counselor']
);
