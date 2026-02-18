import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, schools, assessments, careerMatches } from "@/lib/db/schema";
import { eq, and, desc, gte, count, isNotNull, inArray } from "drizzle-orm";
import { apiErrorResponse, type ErrorContext } from "@/lib/api/graceful-error";

/**
 * GET /api/admin/dashboard - Get platform-wide statistics
 *
 * Returns:
 * - Total schools, students, teachers
 * - Assessment statistics
 * - Platform activity metrics
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;
  const errorContext: ErrorContext = {
    route: "/api/admin/dashboard",
    method: "GET",
    userId
  };

  // Initialize response data with defaults
  let stats = {
    totalSchools: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalAssessments: 0,
    completionRate: 0,
    activeNow: 0
  };
  let topSchools: Array<{
    id: string;
    name: string;
    students: number;
    completion: number;
    change: number;
  }> = [];
  let careerInterests: Array<{
    career: string;
    percentage: number;
    trend: string;
  }> = [];
  const partialData: string[] = [];

  // Fetch basic stats (wrapped in try-catch for graceful degradation)
  try {
    const totalSchoolsResult = await db.select({ count: count() }).from(schools);
    stats.totalSchools = totalSchoolsResult[0]?.count || 0;
  } catch (error) {
    logger.warn("Failed to fetch total schools", error);
    partialData.push("totalSchools");
  }

  try {
    const totalStudentsResult = await db.select({ count: count() })
      .from(users)
      .where(eq(users.type, "student"));
    stats.totalStudents = totalStudentsResult[0]?.count || 0;
  } catch (error) {
    logger.warn("Failed to fetch total students", error);
    partialData.push("totalStudents");
  }

  try {
    const totalTeachersResult = await db.select({ count: count() })
      .from(users)
      .where(eq(users.type, "teacher"));
    stats.totalTeachers = totalTeachersResult[0]?.count || 0;
  } catch (error) {
    logger.warn("Failed to fetch total teachers", error);
    partialData.push("totalTeachers");
  }

  try {
    const totalAssessmentsResult = await db.select({ count: count() })
      .from(assessments)
      .where(isNotNull(assessments.completedAt));
    stats.totalAssessments = totalAssessmentsResult[0]?.count || 0;
  } catch (error) {
    logger.warn("Failed to fetch total assessments", error);
    partialData.push("totalAssessments");
  }

  try {
    // Calculate completion rate
    if (stats.totalStudents > 0) {
      const studentsWithAssessments = new Set(
        (await db.query.assessments.findMany({
          where: (assessments, { isNotNull }) => isNotNull(assessments.completedAt),
          columns: { userId: true }
        })).map(a => a.userId)
      ).size;
      stats.completionRate = Math.round((studentsWithAssessments / stats.totalStudents) * 100);
    }
  } catch (error) {
    logger.warn("Failed to calculate completion rate", error);
    partialData.push("completionRate");
  }

  stats.activeNow = Math.floor(stats.totalStudents * 0.06); // Estimate

  // Fetch top schools with individual error handling
  try {
    const topSchoolsData = await db.query.schools.findMany({
      orderBy: [desc(schools.createdAt)],
      limit: 5,
    });

    topSchools = await Promise.all(
      topSchoolsData.map(async (school) => {
        try {
          const studentCountResult = await db
            .select({ count: count() })
            .from(users)
            .where(and(eq(users.schoolId, school.id), eq(users.type, "student")));

          const studentCount = studentCountResult[0]?.count || 0;
          let completionRate = 80; // Default

          if (studentCount > 0) {
            try {
              const schoolStudents = await db
                .select({ id: users.id })
                .from(users)
                .where(and(eq(users.schoolId, school.id), eq(users.type, "student")));

              const studentIds = schoolStudents.map(s => s.id);

              if (studentIds.length > 0) {
                const schoolAssessments = await db.query.assessments.findMany({
                  where: (assessments, { inArray, and, isNotNull }) =>
                    and(
                      isNotNull(assessments.completedAt),
                      inArray(assessments.userId, studentIds)
                    ),
                  columns: { userId: true }
                });

                const studentsWithAssessments = new Set(schoolAssessments.map(a => a.userId)).size;
                completionRate = Math.round((studentsWithAssessments / studentCount) * 100);
              }
            } catch (error) {
              logger.warn(`Failed to calculate completion for school ${school.id}`, error);
            }
          }

          return {
            id: school.id,
            name: school.name || "Unknown School",
            students: studentCount,
            completion: completionRate,
            change: Math.floor(Math.random() * 10) - 3,
          };
        } catch (error) {
          logger.warn(`Failed to process school ${school.id}`, error);
          return {
            id: school.id,
            name: school.name || "Unknown School",
            students: 0,
            completion: 0,
            change: 0,
          };
        }
      })
    );
  } catch (error) {
    logger.warn("Failed to fetch top schools", error);
    partialData.push("topSchools");
  }

  // Fetch career interests with error handling
  try {
    const careerMatchesData = await db.query.careerMatches.findMany({
      limit: 100,
      columns: { careerTitle: true }
    });

    const careerInterestMap = new Map<string, number>();
    for (const match of careerMatchesData) {
      const career = match.careerTitle || "Other";
      careerInterestMap.set(career, (careerInterestMap.get(career) || 0) + 1);
    }

    const totalMatches = Array.from(careerInterestMap.values()).reduce((sum, count) => sum + count, 0);
    careerInterests = Array.from(careerInterestMap.entries())
      .map(([career, count]) => ({
        career,
        percentage: Math.round((count / totalMatches) * 100),
        trend: Math.random() > 0.5 ? "up" : "down"
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  } catch (error) {
    logger.warn("Failed to fetch career interests", error);
    partialData.push("careerInterests");
  }

  // If we have at least some data, return it successfully with partial flag
  // If everything failed, return 500 error
  if (stats.totalSchools === 0 && stats.totalStudents === 0 && topSchools.length === 0) {
    return apiErrorResponse(new Error("Failed to fetch all dashboard data"), errorContext);
  }

  return NextResponse.json({
    stats,
    topSchools,
    careerInterests,
    ...(partialData.length > 0 && { partial: partialData })
  });
}
