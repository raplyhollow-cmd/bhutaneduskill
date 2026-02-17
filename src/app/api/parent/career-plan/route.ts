import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { careerPlans, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

/**
 * GET /api/parent/career-plan?childId={id}
 *
 * Get career plan for a specific child (parent's child)
 * Parents can only view career plans for their own children
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["parent"]);
  if ("error" in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify the child belongs to this parent
    const [childCheck] = await db
      .select()
      .from(users)
      .where(eq(users.id, childId))
      .limit(1);

    if (!childCheck) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (childCheck.parentId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this child's data" },
        { status: 403 }
      );
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
