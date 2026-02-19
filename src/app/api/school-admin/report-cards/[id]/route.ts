/**
 * SINGLE REPORT CARD API
 * Fetch detailed report card by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { reportCards } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/school-admin/report-cards/:id
 * Get a single report card with full details
 */
export async function GET(
  req: NextRequest,
  context: RouteContext
) {
  try {
    const authResult = await requireAuth(["school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Report card ID is required" }, { status: 400 });
    }

    const [reportCard] = await db
      .select()
      .from(reportCards)
      .where(eq(reportCards.id, id))
      .limit(1);

    if (!reportCard) {
      return NextResponse.json({ error: "Report card not found" }, { status: 404 });
    }

    logger.info("Fetched report card details", { userId, reportCardId: id });

    return NextResponse.json({
      success: true,
      data: reportCard,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/report-cards/[id]", method: "GET" });
    return NextResponse.json({
      error: "Failed to fetch report card",
    }, { status: 500 });
  }
}
