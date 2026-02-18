/**
 * PARENT REPORT CARDS API
 * Parents can view their child's report cards
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { reportCards, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/parent/report-cards
 * Get report cards for parent's children
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json({
        error: "Student ID is required",
      }, { status: 400 });
    }

    // Verify the student belongs to this parent
    const [student] = await db
      .select()
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (!student || student.parentId !== userId) {
      return NextResponse.json({
        error: "Student not found or access denied",
      }, { status: 404 });
    }

    // Fetch report cards
    const cards = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.studentId, studentId))
      .orderBy(reportCards.generatedAt);

    // Update viewed status
    await db
      .update(reportCards)
      .set({ parentViewedAt: new Date() })
      .where(
        and(
          eq(reportCards.studentId, studentId),
          eq(reportCards.status, "sent")
        )
      );

    logger.info("Parent fetched report cards", { userId, studentId });

    return NextResponse.json({
      data: cards,
    } satisfies ApiSuccess<any>);
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/report-cards", method: "GET" });
    return NextResponse.json({
      error: "Failed to fetch report cards",
    }, { status: 500 });
  }
}
