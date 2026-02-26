import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { careerPlans, users, parents, parentToStudent } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";

/**
 * GET /api/parent/career-plan?childId={id}
 *
 * Get career plan for a specific child (parent's child)
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Parents can only view career plans for their verified children
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["parent"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return NextResponse.json({ error: "Parent record not found" }, { status: 403 });
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, childId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        childId,
        route: "/api/parent/career-plan",
      });
      return NextResponse.json(
        { error: "You are not authorized to view this child's data" },
        { status: 403 }
      );
    }

    // Verify the child exists
    const [childCheck] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, childId), eq(users.type, "student")))
      .limit(1);

    if (!childCheck) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    // Fetch career plan for the child
    const [plan] = await db
      .select()
      .from(careerPlans)
      .where(eq(careerPlans.studentId, childId))
      .orderBy(desc(careerPlans.updatedAt))
      .limit(1);

    if (!plan) {
      return NextResponse.json({
        plan: null,
        message: "No career plan found for this child",
      });
    }

    return NextResponse.json({
      plan,
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch career plan", plan: null },
      { status: 500 }
    );
  }
}
