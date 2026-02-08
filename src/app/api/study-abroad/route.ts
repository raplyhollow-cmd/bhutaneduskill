import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { STUDY_ABROAD_REQUIREMENTS } from "@/lib/tenant";

// Calculate study abroad readiness score
function calculateReadinessScore(
  userStats: {
    hasIELTS?: boolean;
    ieltsScore?: number;
    hasSAT?: boolean;
    satScore?: number;
    gpa?: number;
    hasRecommendations?: boolean;
    hasPortfolio?: boolean;
  },
  country: keyof typeof STUDY_ABROAD_REQUIREMENTS
): number {
  const countryReq = STUDY_ABROAD_REQUIREMENTS[country];
  let score = 0;
  const maxScore = 100;

  // Academic readiness (30 points)
  if (userStats.gpa && userStats.gpa >= 60) {
    score += Math.min(30, (userStats.gpa / 100) * 30);
  }

  // Language requirement (40 points)
  if (countryReq.ielts) {
    if (userStats.hasIELTS && userStats.ieltsScore) {
      if (userStats.ieltsScore >= countryReq.ielts) {
        score += 40;
      } else {
        score += (userStats.ieltsScore / countryReq.ielts) * 30;
      }
    }
  } else if (country.country === "usa" && countryReq.sat) {
    if (userStats.hasSAT && userStats.satScore) {
      if (userStats.satScore >= countryReq.sat) {
        score += 40;
      } else {
        score += (userStats.satScore / countryReq.sat) * 30;
      }
    }
  }

  // Documentation (20 points)
  if (userStats.hasRecommendations) score += 10;
  if (userStats.hasPortfolio) score += 10;

  // Base score (10 points)
  score += 10;

  return Math.min(maxScore, Math.round(score));
}

// GET /api/study-abroad - Get study abroad readiness
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mock user stats - would come from database
    const userStats = {
      hasIELTS: false,
      ieltsScore: 0,
      hasSAT: false,
      satScore: 0,
      gpa: 75,
      hasRecommendations: false,
      hasPortfolio: false,
    };

    const readinessScores: Record<string, number> = {};
    Object.keys(STUDY_ABROAD_REQUIREMENTS).forEach((country) => {
      readinessScores[country] = calculateReadinessScore(
        userStats,
        country as keyof typeof STUDY_ABROAD_REQUIREMENTS
      );
    });

    const averageScore = Math.round(
      Object.values(readinessScores).reduce((a, b) => a + b, 0) /
        Object.values(readinessScores).length
    );

    return NextResponse.json({
      readinessScores,
      averageScore,
      userStats,
      requirements: STUDY_ABROAD_REQUIREMENTS,
    });
  } catch (error) {
    console.error("Error fetching study abroad data:", error);
    return NextResponse.json(
      { error: "Failed to fetch study abroad data" },
      { status: 500 }
    );
  }
}

// POST /api/study-abroad - Update study abroad stats
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { hasIELTS, ieltsScore, hasSAT, satScore, gpa, hasRecommendations, hasPortfolio } = body;

    // Here you would update the user's study abroad stats in the database
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: "Study abroad stats updated",
    });
  } catch (error) {
    console.error("Error updating study abroad stats:", error);
    return NextResponse.json(
      { error: "Failed to update study abroad stats" },
      { status: 500 }
    );
  }
}
