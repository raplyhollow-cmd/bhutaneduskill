/**
 * BCSE SCHOLARSHIPS API
 *
 * Platform admin manages government scholarship programs
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { bcseResults, users, bcseRegistrations } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { badRequestResponse } from "@/lib/api/response-helpers";

// ============================================================================
// GET /api/bcse/scholarships
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");
    const examType = searchParams.get("examType") as "BCSE_10" | "BCSE_12" | null;
    const examYear = searchParams.get("examYear");
    const minPercentage = searchParams.get("minPercentage");
    const schoolId = searchParams.get("schoolId");

    // Get scholarship statistics
    if (action === "stats") {
      const conditions: ReturnType<typeof eq | typeof sql>[] = [];

      if (examType) {
        conditions.push(eq(bcseResults.examType, examType));
      }

      if (examYear) {
        conditions.push(eq(bcseResults.examYear, parseInt(examYear, 10)));
      }

      if (schoolId) {
        conditions.push(eq(bcseResults.schoolId, schoolId));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get all results matching filters
      const allResults = await db
        .select({
          id: bcseResults.id,
          studentId: bcseResults.studentId,
          schoolId: bcseResults.schoolId,
          examType: bcseResults.examType,
          examYear: bcseResults.examYear,
          percentage: bcseResults.percentage,
          division: bcseResults.division,
          passed: bcseResults.passed,
        })
        .from(bcseResults)
        .where(whereClause);

      // Calculate statistics
      const totalStudents = allResults.length;
      const passedStudents = allResults.filter((r) => r.passed).length;
      const firstDivision = allResults.filter((r) =>
        r.division?.includes("First")
      ).length;
      const secondDivision = allResults.filter((r) =>
        r.division?.includes("Second")
      ).length;
      const thirdDivision = allResults.filter((r) =>
        r.division?.includes("Third")
      ).length;

      // Scholarship eligibility thresholds (Bhutan government standards)
      const fullMeritEligible = allResults.filter(
        (r) => r.passed && (r.percentage / 100) >= 75
      ).length;
      const partialMeritEligible = allResults.filter(
        (r) => r.passed && (r.percentage / 100) >= 65 && (r.percentage / 100) < 75
      ).length;
      const stemEligible = allResults.filter(
        (r) => r.passed && (r.percentage / 100) >= 70
      ).length;

      const stats = {
        overview: {
          totalStudents,
          passedStudents,
          passPercentage: totalStudents > 0
            ? Math.round((passedStudents / totalStudents) * 100)
            : 0,
        },
        divisions: {
          firstDivision,
          secondDivision,
          thirdDivision,
          failed: totalStudents - passedStudents,
        },
        scholarshipEligibility: {
          fullMerit: fullMeritEligible,
          partialMerit: partialMeritEligible,
          stemExcellence: stemEligible,
        },
        examBreakdown: examType || "All",
        year: examYear || new Date().getFullYear().toString(),
      };

      return {
        success: true,
        data: stats,
      };
    }

    // Get eligible students list
    if (action === "eligible-students") {
      const minPct = minPercentage ? parseInt(minPercentage, 10) : 65;

      const conditions: ReturnType<typeof eq | typeof sql>[] = [
        eq(bcseResults.passed, true),
        sql`${bcseResults.percentage} >= ${minPct * 100}`, // Stored in hundredths
      ];

      if (examType) {
        conditions.push(eq(bcseResults.examType, examType));
      }

      if (examYear) {
        conditions.push(eq(bcseResults.examYear, parseInt(examYear, 10)));
      }

      if (schoolId) {
        conditions.push(eq(bcseResults.schoolId, schoolId));
      }

      const eligibleStudents = await db
        .select({
          id: bcseResults.id,
          studentId: bcseResults.studentId,
          schoolId: bcseResults.schoolId,
          examType: bcseResults.examType,
          examYear: bcseResults.examYear,
          percentage: bcseResults.percentage,
          division: bcseResults.division,
          aggregateMarks: bcseResults.aggregateMarks,
          indexNumber: bcseResults.indexNumber,
          subjectResults: bcseResults.subjectResults,
        })
        .from(bcseResults)
        .where(and(...conditions))
        .orderBy(desc(bcseResults.percentage));

      // Fetch student names
      const studentIds = eligibleStudents.map((s) => s.studentId);
      const students = await db
        .select({
          id: users.id,
          name: users.name,
          cidNumber: users.cidNumber,
        })
        .from(users)
        .where(sql`${users.id} = ANY(${studentIds})`);

      const studentMap = new Map(students.map((s) => [s.id, s]));

      const studentsWithNames = eligibleStudents.map((result) => ({
        ...result,
        studentName: studentMap.get(result.studentId)?.name || "Unknown",
        cidNumber: studentMap.get(result.studentId)?.cidNumber || "",
        percentage: result.percentage / 100, // Convert to actual percentage
      }));

      return {
        success: true,
        data: {
          students: studentsWithNames,
          total: studentsWithNames.length,
          minPercentage: minPct,
        },
      };
    }

    return {
      error: "Invalid action. Use 'stats' or 'eligible-students'",
      status: 400,
    };
  },
  ['admin']
);

// ============================================================================
// POST /api/bcse/scholarships
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { action, scholarshipData } = body;

    if (action === "allocate-seats") {
      const { studentIds, programName, collegeName, academicYear } = body;

      // Government seat allocation logic
      // This would typically interface with RUB (Royal University of Bhutan)
      // For now, we'll log the allocation

      logger.info("Government seats allocated", {
        userId,
        studentIds: studentIds.length,
        programName,
        collegeName,
        academicYear,
      });

      return {
        success: true,
        data: {
          allocated: studentIds.length,
          programName,
          collegeName,
          message: `${studentIds.length} government seats allocated successfully`,
        },
      };
    }

    return {
      error: "Invalid action",
      status: 400,
    };
  },
  ['admin']
);
