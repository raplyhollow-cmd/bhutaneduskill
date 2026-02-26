import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { careerMatches, users, careers, parents, parentToStudent } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET /api/parent/career-matches?childId={id}
 *
 * Get career matches for a specific child (parent's child)
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Parents can only view career matches for their verified children
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

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return NextResponse.json(
        { error: "Child ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return NextResponse.json(
        { error: "Parent record not found", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student join table
    const [relationship] = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentRecord.id),
          eq(parentToStudent.studentId, childId)
        )
      )
      .limit(1);

    if (!relationship) {
      logger.security("ferpa_violation_attempt", {
        parentId: parentRecord.id,
        childId,
        route: "/api/parent/career-matches",
      });
      return NextResponse.json(
        { error: "You are not authorized to view this child's data", status: 403 } satisfies ApiErrorResponse,
        { status: 403 }
      );
    }

    // Verify the child exists
    const [childCheck] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, childId), eq(users.type, "student")))
      .limit(1);

    if (!childCheck) {
      return NextResponse.json(
        { error: "Child not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
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
