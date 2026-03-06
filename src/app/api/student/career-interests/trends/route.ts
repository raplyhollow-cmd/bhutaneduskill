/**
 * Career Interest Trends API
 *
 * GET /api/student/career-interests/trends - Get interest trends
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { analyzeInterestTrends } from "@/lib/services/career-interest-tracker.service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || userId;
    const daysBack = parseInt(searchParams.get("daysBack") || "90", 10);

    if (studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const trends = await analyzeInterestTrends(studentId, daysBack);

    return NextResponse.json({
      success: true,
      studentId,
      ...trends,
    });
  } catch (error) {
    console.error("Get trends error:", error);
    return NextResponse.json(
      { error: "Failed to get trends", message: String(error) },
      { status: 500 }
    );
  }
}
