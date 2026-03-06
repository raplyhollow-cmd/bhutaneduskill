/**
 * Career Exploration Summary API
 *
 * GET /api/student/career-interests/summary - Get exploration activity summary
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCareerExplorationSummary } from "@/lib/services/career-interest-tracker.service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || userId;
    const daysBack = parseInt(searchParams.get("daysBack") || "30", 10);

    if (studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const summary = await getCareerExplorationSummary(studentId, daysBack);

    return NextResponse.json({
      success: true,
      studentId,
      period: `Last ${daysBack} days`,
      ...summary,
    });
  } catch (error) {
    console.error("Get summary error:", error);
    return NextResponse.json(
      { error: "Failed to get summary", message: String(error) },
      { status: 500 }
    );
  }
}
