import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { careerMatches, users, careers } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/parent/career-matches?childId={id}
 *
 * Get career matches for a specific child (parent's child)
 * Parents can only view career matches for their own children
 *
 * Returns enriched career matches with full career details including:
 * - Career description, industry, category
 * - Education requirements
 * - Skills and subjects needed
 * - Salary and growth outlook
 * - Bhutan-specific demand information
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
      return NextResponse.json(
        { error: "Child ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Verify the child belongs to this parent
    const [childCheck] = await db
      .select()
      .from(users)
      .where(eq(users.id, childId))
      .limit(1);

    if (!childCheck) {
      return NextResponse.json(
        { error: "Child not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    if (childCheck.parentId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this child's data", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // Fetch career matches for the child with career details
    const matches = await db
      .select({
        // Career match fields
        id: careerMatches.id,
        studentId: careerMatches.studentId,
        careerId: careerMatches.careerId,
        matchScore: careerMatches.matchScore,
        matchReason: careerMatches.matchReason,
        recommendationText: careerMatches.recommendationText,
        isTopMatch: careerMatches.isTopMatch,
        assessmentType: careerMatches.assessmentType,
        assessmentId: careerMatches.assessmentId,
        createdAt: careerMatches.createdAt,
        // Career details
        careerTitle: careerMatches.careerTitle,
        careerSlug: careers.slug,
        careerDescription: careers.description,
        careerCategory: careers.category,
        careerIndustry: careers.industry,
        careerRiasecCode: careers.riasecCode,
        careerHollandCodes: careers.hollandCodes,
        careerEducationLevel: careers.educationLevel,
        careerTypicalSalary: careers.typicalSalary,
        careerGrowthOutlook: careers.growthOutlook,
        careerSkills: careers.skills,
        careerSubjects: careers.subjects,
        careerWorkEnvironment: careers.workEnvironment,
        careerBhutanSpecific: careers.bhutanSpecific,
        careerBhutanDemand: careers.bhutanDemand,
        careerIcon: careers.icon,
        careerColor: careers.color,
      })
      .from(careerMatches)
      .leftJoin(careers, eq(careerMatches.careerId, careers.id))
      .where(eq(careerMatches.studentId, childId))
      .orderBy(desc(careerMatches.matchScore));

    // Group matches by career to avoid duplicates (if multiple assessments matched same career)
    const uniqueMatches = new Map<string, typeof matches[0]>();
    for (const match of matches) {
      const existing = uniqueMatches.get(match.careerId);
      if (!existing || match.matchScore > existing.matchScore) {
        uniqueMatches.set(match.careerId, match);
      }
    }

    const enrichedMatches = Array.from(uniqueMatches.values());

    return NextResponse.json({
      data: { matches: enrichedMatches, total: enrichedMatches.length },
    } satisfies ApiSuccess<{ matches: typeof enrichedMatches; total: number }>);
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch career matches", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
