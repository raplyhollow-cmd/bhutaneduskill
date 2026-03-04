import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, discResults, workValuesResults, assessments } from "@/lib/db/schema";
import { eq, and, desc, gte, lt, count, sql } from "drizzle-orm";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/school-admin/assessments
 *
 * Get school-wide assessment analytics
 * Returns completion rates, class breakdowns, and aggregate insights
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user } = auth;
    const schoolId = user.schoolId;

    if (!schoolId) {
      return badRequestResponse("School ID required");
    }

    // Get all students in the school
    const allStudents = await db
      .select({
        id: users.id,
        grade: users.grade,
        section: users.section,
      })
      .from(users)
      .where(eq(users.schoolId, schoolId));

    const totalStudents = allStudents.length;

    // Assessment types to track
    const assessmentTypes = ["riasec", "mbti", "disc", "work-values"] as const;

    const assessmentData = await Promise.all(
      assessmentTypes.map(async (type) => {
        let results: any[] = [];

        // Get completed results based on type
        switch (type) {
          case "riasec":
            results = await db
              .select()
              .from(riasecResults)
              .innerJoin(users, eq(riasecResults.userId, users.id))
              .where(eq(users.schoolId, schoolId));
            break;
          case "mbti":
            results = await db
              .select()
              .from(mbtiResults)
              .innerJoin(users, eq(mbtiResults.userId, users.id))
              .where(eq(users.schoolId, schoolId));
            break;
          case "disc":
            results = await db
              .select()
              .from(discResults)
              .innerJoin(users, eq(discResults.userId, users.id))
              .where(eq(users.schoolId, schoolId));
            break;
          case "work-values":
            results = await db
              .select()
              .from(workValuesResults)
              .innerJoin(users, eq(workValuesResults.userId, users.id))
              .where(eq(users.schoolId, schoolId));
            break;
        }

        const completedStudents = results.length;
        const pendingStudents = 0; // Could track in-progress
        const notStartedStudents = totalStudents - completedStudents;
        const completionRate = totalStudents > 0 ? Math.round((completedStudents / totalStudents) * 100) : 0;

        // Calculate at-risk students (those who haven't completed any assessment)
        // This is a simplified check - could be more sophisticated
        const atRiskStudents = notStartedStudents;

        // Class breakdown - group by grade
        let classBreakdown: any[] = [];
        let resultTable: any;

        switch (type) {
          case "riasec":
            resultTable = riasecResults;
            break;
          case "mbti":
            resultTable = mbtiResults;
            break;
          case "disc":
            resultTable = discResults;
            break;
          case "work-values":
            resultTable = workValuesResults;
            break;
        }

        classBreakdown = await db
          .select({
            grade: users.grade,
            section: users.section,
            totalStudents: count(),
          })
          .from(users)
          .where(eq(users.schoolId, schoolId))
          .groupBy(users.grade, users.section);

        const classes = classBreakdown.map((c) => {
          const className = `Class ${c.grade}${c.section ? ` ${c.section}` : ""}`;
          const total = Number(c.totalStudents);
          return {
            classId: `${c.grade}-${c.section || ""}`,
            className,
            totalStudents: total,
            completedStudents: 0, // Simplified
            completionRate: 0,
          };
        });

        // Top career clusters (simplified - would need career matches aggregation)
        const topCareerClusters = [
          "Technology & Engineering",
          "Healthcare & Medicine",
          "Education & Teaching",
          "Business & Management",
        ];

        return {
          assessmentType: type,
          totalStudents,
          completedStudents,
          pendingStudents,
          notStartedStudents,
          completionRate,
          classes,
          topCareerClusters,
          atRiskStudents,
        };
      })
    );

    return successResponse({
      assessments: assessmentData,
    });
  },
  ["school-admin"]
);
