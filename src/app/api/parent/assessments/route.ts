import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import {
  users,
  riasecResults,
  mbtiResults,
  discResults,
  workValuesResults,
  learningStylesResults,
  enrollments,
  classes,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";

/**
 * GET /api/parent/assessments?childId={id}
 *
 * Get assessment results for a specific child (parent's child) with:
 * - All assessment types (RIASEC, MBTI, DISC, Work Values, Learning Styles)
 * - Class average comparisons
 * - Historical progress over time
 * - Parents can only view assessments for their own children
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
      return NextResponse.json({ error: "Child ID is required" }, { status: 400 });
    }

    // Verify the child belongs to this parent
    const [childCheck] = await db
      .select()
      .from(users)
      .where(eq(users.id, childId))
      .limit(1);

    if (!childCheck) {
      return NextResponse.json({ error: "Child not found" }, { status: 404 });
    }

    if (childCheck.parentId !== user.id) {
      return NextResponse.json(
        { error: "You are not authorized to view this child's data" },
        { status: 403 }
      );
    }

    // Get child's current class for comparison
    const childEnrollment = await db.query.enrollments.findFirst({
      where: and(
        eq(enrollments.studentId, childId),
        eq(enrollments.status, "active")
      ),
      orderBy: [desc(enrollments.createdAt)],
    });

    const classId = childEnrollment?.classId || null;
    const classGrade = childCheck.classGrade || null;

    // Helper function to get classmate IDs
    async function getClassmateIds(currentClassId: string | null, grade: number | null): Promise<string[]> {
      if (!currentClassId) return [];

      const classmates = await db
        .select({ userId: enrollments.studentId })
        .from(enrollments)
        .where(and(eq(enrollments.classId, currentClassId), eq(enrollments.status, "active")));

      return classmates.map((c) => c.userId);
    }

    const classmateIds = await getClassmateIds(classId, classGrade);

    // Fetch all assessment types in parallel
    const [riasecData, mbtiData, discData, workValuesData, learningStylesData] = await Promise.all([
      // RIASEC Results
      (async () => {
        const results = await db.query.riasecResults.findMany({
          where: eq(riasecResults.userId, childId),
          orderBy: [desc(riasecResults.createdAt)],
        });

        // Get class averages
        let classAverage: { [key: string]: number } | null = null;
        if (classmateIds.length > 0 && results.length > 0) {
          const classResults = await db
            .select()
            .from(riasecResults)
            .where(sql`${riasecResults.userId} = ANY(${classmateIds})`);

          if (classResults.length > 0) {
            const averages = { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 };
            classResults.forEach((r) => {
              const scores = r.scores as { realistic: number; investigative: number; artistic: number; social: number; enterprising: number; conventional: number } | null;
              if (scores) {
                averages.realistic += scores.realistic;
                averages.investigative += scores.investigative;
                averages.artistic += scores.artistic;
                averages.social += scores.social;
                averages.enterprising += scores.enterprising;
                averages.conventional += scores.conventional;
              }
            });
            Object.keys(averages).forEach((key) => {
              averages[key as keyof typeof averages] = Math.round(averages[key as keyof typeof averages] / classResults.length);
            });
            classAverage = averages;
          }
        }

        return {
          type: "riasec" as const,
          results: results.map((r) => ({
            ...r,
            scores: r.scores as {
              realistic: number;
              investigative: number;
              artistic: number;
              social: number;
              enterprising: number;
              conventional: number;
            } | null,
          })),
          classAverage,
          totalCompleted: results.length,
        };
      })(),

      // MBTI Results
      (async () => {
        const results = await db.query.mbtiResults.findMany({
          where: eq(mbtiResults.userId, childId),
          orderBy: [desc(mbtiResults.createdAt)],
        });

        // Get class distribution
        let classDistribution: { [key: string]: number } | null = null;
        if (classmateIds.length > 0) {
          const classResults = await db
            .select({ personalityType: mbtiResults.personalityType })
            .from(mbtiResults)
            .where(sql`${mbtiResults.userId} = ANY(${classmateIds})`);

          if (classResults.length > 0) {
            const distribution: { [key: string]: number } = {};
            classResults.forEach((r) => {
              distribution[r.personalityType] = (distribution[r.personalityType] || 0) + 1;
            });
            classDistribution = distribution;
          }
        }

        return {
          type: "mbti" as const,
          results,
          classDistribution,
          totalCompleted: results.length,
        };
      })(),

      // DISC Results
      (async () => {
        const results = await db.query.discResults.findMany({
          where: eq(discResults.userId, childId),
          orderBy: [desc(discResults.createdAt)],
        });

        // Get class averages
        let classAverage: { d: number; i: number; s: number; c: number } | null = null;
        if (classmateIds.length > 0 && results.length > 0) {
          const classResults = await db
            .select()
            .from(discResults)
            .where(sql`${discResults.userId} = ANY(${classmateIds})`);

          if (classResults.length > 0) {
            const averages = { d: 0, i: 0, s: 0, c: 0 };
            classResults.forEach((r) => {
              const scores = r.scores as { d: number; i: number; s: number; c: number } | null;
              if (scores) {
                averages.d += scores.d;
                averages.i += scores.i;
                averages.s += scores.s;
                averages.c += scores.c;
              }
            });
            Object.keys(averages).forEach((key) => {
              averages[key as keyof typeof averages] = Math.round(averages[key as keyof typeof averages] / classResults.length);
            });
            classAverage = averages;
          }
        }

        return {
          type: "disc" as const,
          results: results.map((r) => ({
            ...r,
            scores: r.scores as { d: number; i: number; s: number; c: number } | null,
          })),
          classAverage,
          totalCompleted: results.length,
        };
      })(),

      // Work Values Results
      (async () => {
        const results = await db.query.workValuesResults.findMany({
          where: eq(workValuesResults.userId, childId),
          orderBy: [desc(workValuesResults.createdAt)],
        });

        return {
          type: "work_values" as const,
          results,
          totalCompleted: results.length,
        };
      })(),

      // Learning Styles Results
      (async () => {
        const results = await db.query.learningStylesResults.findMany({
          where: eq(learningStylesResults.userId, childId),
          orderBy: [desc(learningStylesResults.createdAt)],
        });

        // Get class averages
        let classAverage: { visual: number; auditory: number; kinesthetic: number } | null = null;
        if (classmateIds.length > 0 && results.length > 0) {
          const classResults = await db
            .select()
            .from(learningStylesResults)
            .where(sql`${learningStylesResults.userId} = ANY(${classmateIds})`);

          if (classResults.length > 0) {
            const averages = { visual: 0, auditory: 0, kinesthetic: 0 };
            classResults.forEach((r) => {
              averages.visual += r.visualScore;
              averages.auditory += r.auditoryScore;
              averages.kinesthetic += r.kinestheticScore;
            });
            Object.keys(averages).forEach((key) => {
              averages[key as keyof typeof averages] = Math.round(averages[key as keyof typeof averages] / classResults.length);
            });
            classAverage = averages;
          }
        }

        return {
          type: "learning_styles" as const,
          results,
          classAverage,
          totalCompleted: results.length,
        };
      })(),
    ]);

    // Calculate overall stats
    const totalCompleted = riasecData.totalCompleted + mbtiData.totalCompleted + discData.totalCompleted + workValuesData.totalCompleted + learningStylesData.totalCompleted;

    // Find most recent assessment date
    const allDates = [
      ...riasecData.results.map((r) => new Date(r.createdAt).getTime()),
      ...mbtiData.results.map((r) => new Date(r.createdAt).getTime()),
      ...discData.results.map((r) => new Date(r.createdAt).getTime()),
      ...workValuesData.results.map((r) => new Date(r.createdAt).getTime()),
      ...learningStylesData.results.map((r) => new Date(r.createdAt).getTime()),
    ];
    const lastAssessmentDate = allDates.length > 0 ? new Date(Math.max(...allDates)).toISOString() : null;

    return NextResponse.json({
      assessments: {
        riasec: riasecData,
        mbti: mbtiData,
        disc: discData,
        workValues: workValuesData,
        learningStyles: learningStylesData,
      },
      summary: {
        totalCompleted,
        lastAssessmentDate,
        classInfo: classId
          ? {
              id: classId,
              grade: classGrade,
              classmatesCount: classmateIds.length,
            }
          : null,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      {
        error: "Failed to fetch assessments",
        assessments: {
          riasec: { type: "riasec", results: [], classAverage: null, totalCompleted: 0 },
          mbti: { type: "mbti", results: [], classDistribution: null, totalCompleted: 0 },
          disc: { type: "disc", results: [], classAverage: null, totalCompleted: 0 },
          workValues: { type: "work_values", results: [], totalCompleted: 0 },
          learningStyles: { type: "learning_styles", results: [], classAverage: null, totalCompleted: 0 },
        },
        summary: {
          totalCompleted: 0,
          lastAssessmentDate: null,
          classInfo: null,
        },
      },
      { status: 500 }
    );
  }
}
