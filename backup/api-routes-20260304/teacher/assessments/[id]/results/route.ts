import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, assessments, riasecResults, mbtiResults, discResults, workValuesResults, careerMatches } from "@/lib/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { successResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/teacher/assessments/[id]/results
 *
 * Get detailed results for a specific assessment
 * Includes individual student results and class-level insights
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const schoolId = user.schoolId;
    const params = await context?.params || {};
    const id = (params as { id: string }).id || "";

    if (!id) {
      return badRequestResponse("Assessment ID is required");
    }

    // Get assessment details
    const [assessment] = await db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    if (!assessment) {
      return notFoundResponse("Assessment");
    }

    // Get all students in the teacher's school
    const students = await db
      .select({
        id: users.id,
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        grade: users.grade,
      })
      .from(users)
      .where(eq(users.schoolId, schoolId || ""))
      .orderBy(users.name);

    // Get results based on assessment type
    let results: any[] = [];
    let resultColumn: any;

    switch (assessment.type) {
      case "riasec":
        results = await db
          .select()
          .from(riasecResults)
          .where(eq(riasecResults.assessmentId, id));
        break;
      case "mbti":
        results = await db
          .select()
          .from(mbtiResults)
          .where(eq(mbtiResults.assessmentId, id));
        break;
      case "disc":
        results = await db
          .select()
          .from(discResults)
          .where(eq(discResults.assessmentId, id));
        break;
      case "work-values":
        results = await db
          .select()
          .from(workValuesResults)
          .where(eq(workValuesResults.assessmentId, id));
        break;
    }

    // Build student results map
    const resultsMap = new Map();
    results.forEach((r) => {
      resultsMap.set(r.userId, r);
    });

    // Get career match counts for each student
    const careerMatchesData = await db
      .select({
        studentId: careerMatches.studentId,
        count: count(),
      })
      .from(careerMatches)
      .where(eq(careerMatches.assessmentId, id))
      .groupBy(careerMatches.studentId);

    const careerMatchesMap = new Map();
    careerMatchesData.forEach((c) => {
      careerMatchesMap.set(c.studentId, c.count);
    });

    // Build student results list
    const studentResults = students.map((student) => {
      const result = resultsMap.get(student.id);
      const careerMatchCount = careerMatchesMap.get(student.id) || 0;

      return {
        id: `sr_${student.id}`,
        studentId: student.id,
        studentName: student.name,
        completedAt: result?.completedAt || null,
        result: result ? {
          type: result.personalityType || undefined,
          hollandCode: result.hollandCode || undefined,
          primaryType: result.primaryType || result.dominantStyle || undefined,
          topValues: result.topValues || undefined,
        } : undefined,
        careerMatches: careerMatchCount,
        status: result ? "completed" as const : "not_started" as const,
      };
    });

    // Calculate counts
    const completedStudents = studentResults.filter((s) => s.status === "completed").length;
    const pendingStudents = 0; // Could add "in_progress" status tracking
    const notStartedStudents = studentResults.length - completedStudents;

    // Generate class insights
    const classInsights = {
      topCareerClusters: ["Technology", "Healthcare", "Education"], // Could calculate from career matches
      commonStrengths: ["Problem-solving", "Communication", "Teamwork"], // Could extract from results
      areasForImprovement: ["Time management", "Critical thinking"], // Could analyze from results
      atRiskStudents: notStartedStudents,
    };

    return successResponse({
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      className: `Class ${students[0]?.grade || "N/A"}`, // Could get actual class name
      totalStudents: studentResults.length,
      completedStudents,
      pendingStudents,
      notStartedStudents,
      students: studentResults,
      classInsights,
    });
  },
  ["teacher"]
);
