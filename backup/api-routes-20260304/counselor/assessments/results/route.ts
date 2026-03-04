import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, assessments, counselorAssignments, schools, careerMatches } from "@/lib/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

interface AssessmentResult {
  id: string;
  studentId: string;
  studentName: string;
  grade: number | null;
  school: string;
  assessmentType: string;
  assessmentName: string;
  completedAt: string;
  topResult: string;
  codes: string[];
  scores: Record<string, unknown>;
  status: string;
  topCareers: string[] | null;
}

/**
 * GET /api/counselor/assessments/results - Get assessment results for counselor's assigned schools
 *
 * Returns:
 * - All assessment results from students at counselor's assigned schools
 * - With student info, assessment type, scores
 * - Summary statistics
 * - Formatted flat structure for easy UI consumption
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");
    const assessmentType = searchParams.get("type"); // riasec, mbti, etc.

    // Get counselor's assigned schools
    let targetSchoolIds: string[] = [];

    if (user.type === "counselor") {
      // Get school assignments for this counselor
      const assignments = await db
        .select({ schoolId: counselorAssignments.schoolId })
        .from(counselorAssignments)
        .where(and(
          eq(counselorAssignments.counselorId, userId),
          eq(counselorAssignments.isActive, true)
        ));
      targetSchoolIds = assignments.map((a) => a.schoolId);
    } else if (user.schoolId) {
      // Admin with a school ID
      targetSchoolIds = [user.schoolId];
    }

    if (targetSchoolIds.length === 0) {
      return successResponse({
        results: [],
        total: 0,
        totalCompleted: 0,
        completionRate: 0,
      });
    }

    // Get all students from assigned schools
    const schoolStudents = await db
      .select()
      .from(users)
      .where(sql`${users.schoolId} IN ${sql.raw(`('${targetSchoolIds.join("','")}')`)}`);

    const studentIds = schoolStudents.map(s => s.id);
    const studentMap = new Map(schoolStudents.map(s => [s.id, s]));
    const schoolMap = new Map(
      targetSchoolIds.map(id => [id, "Assigned School"]) // Will be filled below if needed
    );

    if (studentIds.length === 0) {
      return successResponse({
        results: [],
        total: 0,
        totalCompleted: 0,
        completionRate: 0,
      });
    }

    // Fetch school names
    const schoolsData = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(sql`${schools.id} IN ${sql.raw(`('${targetSchoolIds.join("','")}')`)}`);
    schoolsData.forEach(s => schoolMap.set(s.id, s.name));

    // Build conditions for assessments
    let assessmentConditions = [
      sql`${assessments.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
      sql`${assessments.status} = 'completed'`,
    ];

    if (assessmentType) {
      assessmentConditions.push(sql`${assessments.type} = ${assessmentType}`);
    }

    // Fetch completed assessments with proper select
    const completedAssessments = await db
      .select()
      .from(assessments)
      .where(and(...assessmentConditions.map(c => sql.raw(c.toString()))))
      .orderBy(desc(assessments.completedAt))
      .limit(limit)
      .offset(offset);

    // Get total count
    const allCompleted = await db
      .select()
      .from(assessments)
      .where(and(...assessmentConditions.map(c => sql.raw(c.toString()))));

    // Get career matches for top careers
    const careerMatchesData = await db
      .select()
      .from(careerMatches)
      .where(sql`${careerMatches.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

    // Group career matches by student
    const careersByStudent = new Map<string, typeof careerMatchesData[number]>();
    for (const cm of careerMatchesData) {
      if (!careersByStudent.has(cm.studentId) || cm.matchScore > careersByStudent.get(cm.studentId)!.matchScore) {
        careersByStudent.set(cm.studentId, cm);
      }
    }

    // Format results in flat structure expected by the UI
    const results: AssessmentResult[] = [];

    for (const assessmentItem of completedAssessments) {
      const student = studentMap.get(assessmentItem.userId);
      if (!student) continue;

      // Parse results if available
      let resultsData = null;
      if (assessmentItem.results) {
        try {
          resultsData = typeof assessmentItem.results === "string"
            ? JSON.parse(assessmentItem.results)
            : assessmentItem.results;
        } catch (e) {
          // Skip invalid JSON
        }
      }

      // Extract top career
      const topCareerMatch = careersByStudent.get(assessmentItem.userId);
      const topCareer = topCareerMatch?.careerTitle || resultsData?.topCareer || null;

      // Get top careers list
      const studentCareers = careerMatchesData
        .filter(cm => cm.studentId === assessmentItem.userId)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5)
        .map(cm => cm.careerTitle);

      // Assessment name mapping
      const assessmentNames: Record<string, string> = {
        riasec: "RIASEC Holland Code",
        mbti: "MBTI Personality",
        disc: "DISC Assessment",
        "work-values": "Work Values Inventory",
        "learning-style": "Learning Styles",
      };

      // Get top result (code or type)
      let topResult = assessmentItem.type;
      if (resultsData?.riasecCode) {
        topResult = resultsData.riasecCode;
      } else if (resultsData?.mbtiType) {
        topResult = resultsData.mbtiType;
      } else if (resultsData?.discType) {
        topResult = resultsData.discType;
      }

      results.push({
        id: assessmentItem.id,
        studentId: student.id,
        studentName: student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim() || "Unknown",
        grade: student.classGrade || 0,
        school: schoolMap.get(student.schoolId || "") || "Unknown",
        assessmentType: assessmentItem.type,
        assessmentName: assessmentNames[assessmentItem.type] || assessmentItem.type,
        completedAt: assessmentItem.completedAt?.toISOString() || new Date().toISOString(),
        topResult,
        codes: resultsData?.riasecCode ? [resultsData.riasecCode] : (resultsData?.codes || []),
        scores: resultsData?.scores || {},
        status: assessmentItem.status,
        topCareers: studentCareers.length > 0 ? studentCareers : null,
      });
    }

    // Calculate completion rate
    const totalStudents = studentIds.length;
    const completionRate = totalStudents > 0
      ? Math.round((allCompleted.length / totalStudents) * 100)
      : 0;

    return successResponse({
      results,
      total: results.length,
      totalCompleted: allCompleted.length,
      completionRate,
    });
  },
  ['counselor', 'admin']
);
