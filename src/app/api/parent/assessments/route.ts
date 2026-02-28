import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  users,
  parents,
  parentToStudent,
  riasecResults,
  mbtiResults,
  discResults,
  workValuesResults,
  learningStylesResults,
  enrollments,
  classes,
} from "@/lib/db/schema";
import { eq, and, desc, sql, gt } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, forbiddenResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

/**
 * GET /api/parent/assessments?childId={id}
 *
 * Get assessment results for a specific child (parent's child) with:
 * - All assessment types (RIASEC, MBTI, DISC, Work Values, Learning Styles)
 * - Class average comparisons
 * - Historical progress over time
 * - Parents can only view assessments for their own children
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;

    const { searchParams } = new URL(request.url);
    const childId = searchParams.get("childId");

    if (!childId) {
      return badRequestResponse("Child ID is required");
    }

    try {
      // FERPA COMPLIANCE: Verify parent-child relationship via parent_to_student table
      // First get the parent record for this user
      const [parentRecord] = await db
        .select()
        .from(parents)
        .where(eq(parents.userId, user.id))
        .limit(1);

      if (!parentRecord) {
        logger.warn("No parent record found for user", { userId: user.id });
        return forbiddenResponse("Parent record not found");
      }

      // Then verify the child is linked to this parent via parent_to_student join table
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
        logger.warn("Parent-child relationship not verified", {
          parentId: parentRecord.id,
          childId,
        });
        return forbiddenResponse("You are not authorized to view this child's data");
      }

      // Verify the child exists and is a student
      const [childCheck] = await db
        .select()
        .from(users)
        .where(and(eq(users.id, childId), eq(users.type, "student")))
        .limit(1);

      if (!childCheck) {
        return notFoundResponse("Child");
      }

      // Get child's current class for comparison
      const [childEnrollment] = await db
        .select()
        .from(enrollments)
        .where(and(
          eq(enrollments.studentId, childId),
          eq(enrollments.status, "active")
        ))
        .orderBy(desc(enrollments.createdAt))
        .limit(1);

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
          const results = await db
            .select()
            .from(riasecResults)
            .where(eq(riasecResults.userId, childId))
            .orderBy(desc(riasecResults.completedAt));

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
          const results = await db
            .select()
            .from(mbtiResults)
            .where(eq(mbtiResults.userId, childId))
            .orderBy(desc(mbtiResults.completedAt));

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
          const results = await db
            .select()
            .from(discResults)
            .where(eq(discResults.userId, childId))
            .orderBy(desc(discResults.completedAt));

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
          const results = await db
            .select()
            .from(workValuesResults)
            .where(eq(workValuesResults.userId, childId))
            .orderBy(desc(workValuesResults.completedAt));

          return {
            type: "work_values" as const,
            results,
            totalCompleted: results.length,
          };
        })(),

        // Learning Styles Results
        (async () => {
          const results = await db
            .select()
            .from(learningStylesResults)
            .where(eq(learningStylesResults.userId, childId))
            .orderBy(desc(learningStylesResults.completedAt));

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

      return successResponse({
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
      logger.apiError(error, { route: "/api/parent/assessments", method: "GET" });
      return errorResponse("Failed to fetch assessments", 500);
    }
  },
  ['parent']
);
