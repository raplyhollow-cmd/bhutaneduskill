/**
 * Career Interest Shifts Detection API
 *
 * GET /api/student/career-interests/shifts - Detect significant interest shifts
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { detectInterestShifts } from "@/lib/services/career-interest-tracker.service";

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

    const shifts = await detectInterestShifts(studentId, daysBack);

    return NextResponse.json({
      success: true,
      studentId,
      shifts,
      summary: {
        total: shifts.length,
        high: shifts.filter((s) => s.significance === "high").length,
        medium: shifts.filter((s) => s.significance === "medium").length,
        low: shifts.filter((s) => s.significance === "low").length,
      },
    });
  } catch (error) {
    console.error("Get shifts error:", error);
    return NextResponse.json(
      { error: "Failed to detect shifts", message: String(error) },
      { status: 500 }
    );
  }
}
