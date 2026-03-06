/**
 * Career Interests Tracking API
 *
 * Track and analyze student career interests over time
 *
 * GET /api/student/career-interests - Get student's career interests
 * POST /api/student/career-interests - Record/update career interest
 * GET /api/student/career-interests/trends - Get interest trends
 * GET /api/student/career-interests/shifts - Detect significant shifts
 * GET /api/student/career-interests/reassessment - Get reassessment triggers
 * GET /api/student/career-interests/summary - Get exploration summary
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  recordCareerInterest,
  getCareerInterestHistory,
  analyzeInterestTrends,
  detectInterestShifts,
  generateReassessmentTriggers,
  getCareerExplorationSummary,
} from "@/lib/services/career-interest-tracker.service";

/**
 * GET /api/student/career-interests
 * Get student's current career interests
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || userId;
    const daysBack = parseInt(searchParams.get("daysBack") || "90", 10);

    // Check authorization
    if (studentId !== userId) {
      // TODO: Add counselor/teacher check
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Get trends
    const { trends, topInterests, emergingInterests, decliningInterests } =
      await analyzeInterestTrends(studentId, daysBack);

    return NextResponse.json({
      success: true,
      studentId,
      interests: {
        current: trends,
        top: topInterests,
        emerging: emergingInterests,
        declining: decliningInterests,
      },
    });
  } catch (error) {
    console.error("Get interests error:", error);
    return NextResponse.json(
      { error: "Failed to get interests", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/career-interests
 * Record or update a career interest
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId, careerId, interestLevel, source } = body;

    // Default to authenticated user
    const targetStudentId = studentId || userId;

    // Check authorization
    if (targetStudentId !== userId) {
      // TODO: Add counselor/teacher check
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    // Validate inputs
    if (!careerId) {
      return NextResponse.json(
        { error: "careerId is required" },
        { status: 400 }
      );
    }

    if (!["high", "medium", "low"].includes(interestLevel)) {
      return NextResponse.json(
        { error: "interestLevel must be high, medium, or low" },
        { status: 400 }
      );
    }

    // Record interest
    await recordCareerInterest({
      studentId: targetStudentId,
      careerId,
      interestLevel,
      source: source || "explicit",
    });

    return NextResponse.json({
      success: true,
      message: "Interest recorded",
    });
  } catch (error) {
    console.error("Record interest error:", error);
    return NextResponse.json(
      { error: "Failed to record interest", message: String(error) },
      { status: 500 }
    );
  }
}
