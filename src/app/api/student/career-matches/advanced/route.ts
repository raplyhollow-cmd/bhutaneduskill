/**
 * Advanced Career Matching API
 *
 * Multi-factor career matching using:
 * - 40% Assessments (RIASEC, MBTI, DISC, Work Values)
 * - 25% Academic Performance
 * - 20% Skills
 * - 15% Interests & Goals
 *
 * GET /api/student/career-matches/advanced - Get career matches for student
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import {
  getQuickCareerMatches,
  buildStudentCareerProfile,
  calculateCareerMatches,
  type CareerMatchResult,
} from "@/lib/services/advanced-career-matching.service";

/**
 * GET /api/student/career-matches/advanced
 *
 * Query parameters:
 * - studentId: string (optional, defaults to authenticated user)
 * - maxResults: number (optional, default 15)
 * - minScore: number (optional, default 30)
 * - includeDeclining: boolean (optional, default false)
 */
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || userId;
    const maxResults = parseInt(searchParams.get("maxResults") || "15", 10);
    const minScore = parseInt(searchParams.get("minScore") || "30", 10);
    const includeDeclining = searchParams.get("includeDeclining") === "true";

    // Check authorization (counselors/teachers can view other students' matches)
    if (studentId !== userId) {
      // TODO: Add proper role check for counselor/teacher
      // For now, only allow own data
      return NextResponse.json(
        { error: "Forbidden: Can only view own matches" },
        { status: 403 }
      );
    }

    // Get quick matches (uses profile from database)
    const matches = await getQuickCareerMatches(studentId, {
      maxResults,
    });

    // Filter by minScore if needed
    const filteredMatches = matches.filter((m) => m.matchScore >= minScore);

    // Filter out declining careers if requested
    const finalMatches = includeDeclining
      ? filteredMatches
      : filteredMatches.filter((m) => m.bhutanOutlook !== "Declining");

    return NextResponse.json({
      success: true,
      studentId,
      matches: finalMatches,
      summary: {
        total: finalMatches.length,
        highConfidence: finalMatches.filter((m) => m.confidence === "high").length,
        mediumConfidence: finalMatches.filter((m) => m.confidence === "medium").length,
        lowConfidence: finalMatches.filter((m) => m.confidence === "low").length,
      },
    });
  } catch (error) {
    console.error("Career matching error:", error);
    return NextResponse.json(
      { error: "Failed to calculate career matches", message: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/student/career-matches/advanced
 *
 * Calculate matches with custom profile data
 * Useful for "what if" scenarios or testing
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Parse options
    const maxResults = body.maxResults || 15;
    const minScore = body.minScore || 30;
    const includeDeclining = body.includeDeclining || false;

    // Build profile from request body or database
    let profile;
    if (body.useDatabaseProfile) {
      profile = await buildStudentCareerProfile(userId);
    } else {
      profile = body.profile;
    }

    if (!profile) {
      return NextResponse.json(
        { error: "No profile data provided" },
        { status: 400 }
      );
    }

    // Calculate matches
    const matches = await calculateCareerMatches(profile, {
      maxResults,
      minScore,
      includeDeclining,
    });

    return NextResponse.json({
      success: true,
      profile: {
        studentId: profile.studentId,
        name: profile.name,
        grade: profile.grade,
      },
      matches,
      summary: {
        total: matches.length,
        highConfidence: matches.filter((m) => m.confidence === "high").length,
        averageScore: matches.length > 0
          ? Math.round(matches.reduce((sum, m) => sum + m.matchScore, 0) / matches.length)
          : 0,
      },
    });
  } catch (error) {
    console.error("Career matching error:", error);
    return NextResponse.json(
      { error: "Failed to calculate career matches", message: String(error) },
      { status: 500 }
    );
  }
}
