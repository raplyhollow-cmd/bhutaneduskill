import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { users, riasecResults, mbtiResults, discResults, workValuesResults } from "@/lib/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/school-admin/assessments/[type]
 *
 * Get detailed analytics for a specific assessment type
 * Includes class breakdown and individual student results
 */
export const GET = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const schoolId = user.schoolId;
    const params = await context?.params || {};
    const type = (params as { type: string }).type || "";

    if (!schoolId) {
      return badRequestResponse("School ID required");
    }

    if (!type || !["riasec", "mbti", "disc", "work-values"].includes(type)) {
      return badRequestResponse("Invalid assessment type");
    }

    // Get all students in the school
    const allStudents = await db
      .select({
        id: users.id,
        name: users.name,
        grade: users.grade,
        section: users.section,
      })
      .from(users)
      .where(eq(users.schoolId, schoolId))
      .orderBy(users.grade, users.section, users.name);

    // Get completed results based on type
    let results: any[] = [];
    let resultTable: any;

    switch (type) {
      case "riasec":
        resultTable = riasecResults;
        results = await db
          .select()
          .from(riasecResults)
          .innerJoin(users, eq(riasecResults.userId, users.id))
          .where(eq(users.schoolId, schoolId));
        break;
      case "mbti":
        resultTable = mbtiResults;
        results = await db
          .select()
          .from(mbtiResults)
          .innerJoin(users, eq(mbtiResults.userId, users.id))
          .where(eq(users.schoolId, schoolId));
        break;
      case "disc":
        resultTable = discResults;
        results = await db
          .select()
          .from(discResults)
          .innerJoin(users, eq(discResults.userId, users.id))
          .where(eq(users.schoolId, schoolId));
        break;
      case "work-values":
        resultTable = workValuesResults;
        results = await db
          .select()
          .from(workValuesResults)
          .innerJoin(users, eq(workValuesResults.userId, users.id))
          .where(eq(users.schoolId, schoolId));
        break;
    }

    // Build results map
    const resultsMap = new Map();
    results.forEach((r) => {
      resultsMap.set(r.riasecResults?.userId || r.mbtiResults?.userId || r.discResults?.userId || r.workValuesResults?.userId, r);
    });

    // Calculate completion stats
    const totalStudents = allStudents.length;
    const completedStudents = results.length;
    const pendingStudents = allStudents.length - results.length;

    // Group by class for class breakdown
    const classGroups = new Map<string, any[]>();
    allStudents.forEach((student) => {
      const key = `${student.grade}-${student.section || ""}`;
      if (!classGroups.has(key)) {
        classGroups.set(key, []);
      }
      classGroups.get(key)!.push(student);
    });

    const classes = Array.from(classGroups.entries()).map(([className, students]) => {
      const classCompleted = students.filter((s) => resultsMap.has(s.id)).length;
      return {
        classId: className,
        className,
        totalStudents: students.length,
        completedStudents: classCompleted,
        completionRate: Math.round((classCompleted / students.length) * 100),
      };
    });

    // Build student results with class names
    const studentResults = allStudents.map((student) => {
      const result = resultsMap.get(student.id);
      return {
        ...student,
        status: result ? "completed" : "pending",
        completedAt: result?.completedAt || null,
      };
    });

    // Find at-risk students (not completed)
    const atRiskStudents = allStudents
      .filter((s) => !resultsMap.has(s.id))
      .map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        section: s.section,
      }));

    return successResponse({
      assessmentType: type,
      totalStudents,
      completedStudents,
      pendingStudents,
      notStartedStudents: pendingStudents,
      completionRate: Math.round((completedStudents / totalStudents) * 100),
      classes,
      students: studentResults,
      topCareerClusters: [], // Would need more complex analysis
      atRiskStudents: atRiskStudents.length,
    });
  },
  ["school-admin"]
);
