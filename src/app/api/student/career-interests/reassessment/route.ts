/**
 * Reassessment Triggers API
 *
 * GET /api/student/career-interests/reassessment - Get reassessment triggers
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateReassessmentTriggers } from "@/lib/services/career-interest-tracker.service";

export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || userId;

    if (studentId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const triggers = await generateReassessmentTriggers(studentId);

    return NextResponse.json({
      success: true,
      studentId,
      triggers,
      hasUrgentTriggers: triggers.some((t) => t.priority === "high"),
    });
  } catch (error) {
    console.error("Get triggers error:", error);
    return NextResponse.json(
      { error: "Failed to get triggers", message: String(error) },
      { status: 500 }
    );
  }
}
