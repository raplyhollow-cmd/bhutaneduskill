import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, assessments, careerMatches, riasecResults } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { CAREERS_DATABASE } from "@/lib/tenant";

// POST /api/assessments - Save assessment results
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { type = "riasec", answers, results } = body;

    if (!answers || !results) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Create assessment record
    const [assessment] = await db
      .insert(assessments)
      .values({
        id: `assessment-${Date.now()}`,
        tenantId: user.tenantId,
        userId: user.id,
        type,
        status: "completed",
        answers,
        results,
        startedAt: new Date(Date.now() - 300000), // Assume 5 min ago
        completedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    // For RIASEC assessments, save to specialized table
    if (type === "riasec" && results.scores) {
      const scores = results.scores;
      const sortedTraits = Object.entries(scores)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .map(([trait]) => trait);
      const hollandCode = sortedTraits.slice(0, 3).join("").toUpperCase();

      await db.insert(riasecResults).values({
        id: `riasec_res_${Date.now()}`,
        assessmentId: assessment.id,
        userId: user.id,
        realistic: scores.realistic || 0,
        investigative: scores.investigative || 0,
        artistic: scores.artistic || 0,
        social: scores.social || 0,
        enterprising: scores.enterprising || 0,
        conventional: scores.conventional || 0,
        hollandCode,
        traits: results.traits || [],
        careerSuggestions: results.careerSuggestions || [],
      });
    }

    // Calculate career matches based on RIASEC results
    const userScores = results.scores || {};
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
        matchScore: Math.round(avgMatch),
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);

    // Save career matches
    for (const match of matches) {
      await db.insert(careerMatches).values({
        id: `match-${Date.now()}-${match.careerId}`,
        assessmentId: assessment.id,
        careerId: match.careerId,
        matchScore: match.matchScore,
        isTopMatch: match.matchScore > 75 ? 1 : 0,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({
      success: true,
      assessment,
      careerMatches: matches,
    });
  } catch (error) {
    console.error("Error saving assessment:", error);
    return NextResponse.json(
      { error: "Failed to save assessment" },
      { status: 500 }
    );
  }
}

// GET /api/assessments - Get user's assessments
export async function GET(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    console.error("Error fetching assessments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assessments" },
      { status: 500 }
    );
  }
}
