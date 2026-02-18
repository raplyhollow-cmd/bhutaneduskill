import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, assessments, assessmentSubmissions, schools } from "@/lib/db/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

/**
 * GET /api/counselor/assessments/results - Get assessment results for counselor's school
 *
 * Returns:
 * - All assessment results from students at counselor's school
 * - With student info, assessment type, scores
 * - Summary statistics
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['counselor', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const assessmentType = searchParams.get("type"); // riasec, mbti, etc.

    // Get current counselor user (already fetched by requireAuth)
    const currentUser = user;

    // Get counselor's school
    // Admins can view all schools, counselors only their own
    let targetSchoolId = currentUser.schoolId || "";
    if (currentUser.type === "admin" && searchParams.get("schoolId")) {
      targetSchoolId = searchParams.get("schoolId") || "";
    }

    const counselorSchool = await db.query.schools.findFirst({
      where: eq(schools.id, targetSchoolId as string),
    });

    if (!counselorSchool) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    // Get all students from this school
    const schoolStudents = await db.query.users.findMany({
      where: eq(users.schoolId, counselorSchool.id),
    });

    const studentIds = schoolStudents.map(s => s.id);

    if (studentIds.length === 0) {
      return NextResponse.json({
        results: [],
        total: 0,
        totalCompleted: 0,
        completionRate: 0,
      });
    }

    // Build conditions for assessments
    let assessmentConditions = [
      inArray(assessments.userId, studentIds),
      eq(assessments.status, "completed"),
    ];

    if (assessmentType) {
      assessmentConditions.push(eq(assessments.type, assessmentType));
    }

    // Fetch completed assessments
    const completedAssessments = await db.query.assessments.findMany({
      where: and(...assessmentConditions),
      orderBy: [desc(assessments.completedAt)],
      limit,
      offset,
    });

    // Get total count for pagination
    const totalCompleted = await db.query.assessments.findMany({
      where: and(...assessmentConditions),
    });

    // Enrich with student information
    const results = await Promise.all(
      completedAssessments.map(async (assessmentItem) => {
        const student = schoolStudents.find(s => s.id === assessmentItem.userId);

        if (!student) return null;

        // Parse results if available
        let resultsData = null;
        if (assessmentItem.results) {
          try {
            resultsData = typeof assessmentItem.results === "string"
              ? JSON.parse(assessmentItem.results)
              : assessmentItem.results;
          } catch (e) {
            logger.apiError("Failed to parse assessment results:", e);
          }
        }

        // Extract key metrics from results
        const topCareer = resultsData?.topCareer || null;
        const riasecCode = resultsData?.riasecCode || null;
        const matchScore = resultsData?.topMatchScore || null;

        return {
          id: assessmentItem.id,
          student: {
            id: student.id,
            name: `${student.firstName} ${student.lastName || ""}`.trim(),
            firstName: student.firstName,
            lastName: student.lastName,
            classGrade: student.classGrade,
            section: student.section,
            profilePicture: student.profilePicture,
          },
          assessment: {
            id: assessmentItem.id,
            type: assessmentItem.type,
            status: assessmentItem.status,
            startedAt: assessmentItem.startedAt,
            completedAt: assessmentItem.completedAt,
          },
          results: {
            topCareer,
            riasecCode,
            matchScore,
            fullResults: resultsData,
          },
        };
      })
    );

    // Filter out nulls
    const validResults = results.filter(r => r !== null);

    // Calculate completion rate
    const totalStudents = studentIds.length;
    const completionRate = totalStudents > 0
      ? Math.round((totalCompleted.length / totalStudents) * 100)
      : 0;

    return NextResponse.json({
      results: validResults,
      total: validResults.length,
      totalCompleted: totalCompleted.length,
      completionRate,
      school: {
        id: counselorSchool.id,
        name: counselorSchool.name,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/assessments/results", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch assessment results", results: [] }, { status: 500 });
  }
}
