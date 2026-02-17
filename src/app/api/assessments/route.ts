import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, assessments, careerMatches, riasecResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CAREERS_DATABASE } from "@/lib/tenant";

// POST /api/assessments - Save assessment results
export async function POST(req: NextRequest) {
  try {
    // Authenticate - only students, teachers, admins, and school-admins can create assessments
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user, userId } = authResult;

    // Check RBAC permission for creating assessments
    // Students can create assessments for themselves without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.create");
      if (permCheck) return permCheck;
    }

    const body = await req.json();
    const { type = "riasec", answers, results } = body;

    if (!answers || !results) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create assessment record
    const [assessment] = await db
      .insert(assessments)
      .values({
        ...({
          id: `assessment-${Date.now()}`,
          tenantId: user.tenantId,
        }),
        userId: userId,
        type,
        status: "completed",
        answers,
        results,
        // startedAt: new Date(Date.now() - 300000), // Assume 5 min ago
        completedAt: new Date(),
        createdAt: new Date(),
      } as any)
      .returning();

    // For RIASEC assessments, save to specialized table
    if (type === "riasec" && results.scores) {
      const scores = results.scores;
      const sortedTraits = Object.entries(scores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([trait]) => trait);
      const hollandCode = sortedTraits.slice(0, 3).join("").toUpperCase();

      await db.insert(riasecResults).values({
        ...({
          id: `riasec_res_${Date.now()}`,
          assessmentId: assessment.id,
        }),
        userId: userId,
        realistic: scores.realistic || 0,
        investigative: scores.investigative || 0,
        artistic: scores.artistic || 0,
        social: scores.social || 0,
        enterprising: scores.enterprising || 0,
        conventional: scores.conventional || 0,
        hollandCode,
        traits: results.traits || [],
        careerSuggestions: results.careerSuggestions || [],
        createdAt: new Date(),
      } as any);
    }

    // Calculate career matches based on RIASEC results
    const userScores = results.scores || {};
    const hollandCode = results.scores ? Object.entries(results.scores as Record<string, number>)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait.charAt(0).toUpperCase())
      .join("") : "";

    const matches = CAREERS_DATABASE.map((career) => {
      const careerScores = career.riasecScores || {};
      let totalMatch = 0;
      let count = 0;

      // Calculate match based on overlapping RIASEC traits
      Object.entries(userScores).forEach(([trait, userScore]) => {
        if (careerScores[trait as keyof typeof careerScores]) {
          const careerScore = careerScores[trait as keyof typeof careerScores];
          // Simple match algorithm
          const diff = Math.abs(
            (userScore as number) - (careerScore as number)
          );
          const matchPercent = Math.max(0, 100 - diff);
          totalMatch += matchPercent;
          count++;
        }
      });

      const avgMatch = count > 0 ? totalMatch / count : 50;
      return {
        careerId: career.id,
        careerTitle: career.name,
        matchScore: Math.round(avgMatch),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

    // Save career matches with all required fields
    for (const match of matches) {
      await db.insert(careerMatches).values({
        ...({
          id: `match-${Date.now()}-${match.careerId}`,
          assessmentId: assessment.id,
        }),
        studentId: userId,
        careerId: match.careerId,
        careerTitle: match.careerTitle,
        matchScore: match.matchScore,
        matchReason: `Based on your RIASEC code: ${hollandCode}`,
        assessmentType: type,
        isTopMatch: match.matchScore > 75 ? true : false,
        createdAt: new Date(),
      } as any);
    }

    return NextResponse.json({
      success: true,
      assessment,
      careerMatches: matches,
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to save assessment" },
      { status: 500 }
    );
  }
}

// GET /api/assessments - Get user's assessments
export async function GET(req: NextRequest) {
  try {
    // Authenticate - only students, teachers, admins, and school-admins can read assessments
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    // Check RBAC permission for reading assessments
    // Students can read their own assessments without special permission
    if (user.type !== "student") {
      const permCheck = await requirePermission(userId, "assessments.read");
      if (permCheck) return permCheck;
    }

    const userAssessments = await db.query.assessments.findMany({
      where: (assessments, { eq }) => eq(assessments.userId, userId),
      orderBy: (assessments, { desc }) => [
        desc(assessments.createdAt),
      ],
      limit: 10,
    });

    return NextResponse.json({ assessments: userAssessments });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
