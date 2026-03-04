/**
 * ASSESSMENT SUBMISSIONS API
 *
 * GET /api/assessment-submissions - Get submissions
 * POST /api/assessment-submissions - Create submission
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 * FIXED: Removed db.query usage (disabled in neon-http driver)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { assessmentSubmissions } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, forbiddenResponse, createdResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/assessment-submissions - Get submissions
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const assessmentId = searchParams.get("assessmentId");
    const userId_param = searchParams.get("userId");
    const assignedBy = searchParams.get("assignedBy");
    const status = searchParams.get("status");

    type QueryCondition =ReturnType<typeof eq>;
    const conditions: QueryCondition[] = [];
    if (assessmentId) {
      conditions.push(eq(assessmentSubmissions.assessmentId, assessmentId));
    }
    if (userId_param) {
      conditions.push(eq(assessmentSubmissions.userId, userId_param));
    }
    if (assignedBy) {
      conditions.push(eq(assessmentSubmissions.assignedBy, assignedBy));
    }
    if (status) {
      conditions.push(eq(assessmentSubmissions.status, status));
    }

    // Students can only see their own submissions
    if (user.type === "student") {
      conditions.push(eq(assessmentSubmissions.userId, userId));
    }

    // Teachers can only see submissions they assigned
    if (user.type === "teacher") {
      conditions.push(eq(assessmentSubmissions.assignedBy, userId));
    }

    // Using db.select() instead of db.query (neon-http driver)
    const submissions = await db
      .select()
      .from(assessmentSubmissions)
      .where(conditions.length > 0 ? (conditions.length === 1 ? conditions[0] : and(...conditions)) : undefined)
      .orderBy(desc(assessmentSubmissions.createdAt));

    return successResponse({ submissions });
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// ============================================================================
// POST /api/assessment-submissions - Create submission
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;
    const body = await request.json();
    const { assessmentId, userId: targetUserId, assignedBy } = body;

    // Only teachers and admins can assign assessments to others
    if (user.type === "student") {
      return forbiddenResponse("Students cannot create assessment submissions");
    }

    const [submission] = await db
      .insert(assessmentSubmissions)
      .values({
        id: `sub_${Date.now()}`,
        assessmentId,
        userId: targetUserId,
        assignedBy: assignedBy || userId,
        status: "pending" as const,
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        createdAt: new Date(),
        updatedAt: new Date(),
      } as typeof assessmentSubmissions.$inferInsert)
      .returning();

    return createdResponse({ submission });
  },
  ['teacher', 'admin', 'school-admin']
);
