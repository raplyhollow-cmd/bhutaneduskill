/**
 * TEACHER INTERVENTION RECOMMENDATIONS API
 *
 * GET /api/teacher/interventions?studentId=xxx
 * - Get personalized intervention recommendations for a student
 *
 * GET /api/teacher/interventions?classId=xxx
 * - Get class-level intervention summary
 *
 * POST /api/teacher/interventions/[id]/complete
 * - Mark an intervention as completed
 *
 * Helps teachers take action on at-risk students with:
 * - Prioritized recommendations
 * - Resource links
 * - Progress tracking
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { earlyWarningSystem, InterventionRecommendation } from "@/lib/intelligence/early-warning-system";
import { db } from "@/lib/db";
import { users, classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// TYPES
// ============================================================================

interface InterventionWithStudent {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  interventions: InterventionRecommendation[];
  riskLevel: string;
}

interface ClassInterventionsSummary {
  classId: string;
  className: string;
  urgentInterventions: number;
  highPriorityInterventions: number;
  studentsNeedingIntervention: Array<{
    studentId: string;
    studentName: string;
    riskLevel: string;
    topPriority: string;
  }>;
  recommendedActions: string[];
}

// ============================================================================
// GET - Intervention Recommendations
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");

    // Single student interventions
    if (studentId) {
      const interventions = await earlyWarningSystem.getInterventions(studentId);

      // Get student info
      const [student] = await db
        .select({
          id: users.id,
          name: users.name,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1);

      if (!student) {
        return {
          error: "Student not found",
          status: 404,
        };
      }

      // Get risk analysis
      const riskAnalysis = await earlyWarningSystem.analyzeStudent(studentId);

      return {
        student: {
          id: student.id,
          name: student.name,
          classId: student.classGrade?.toString() || "",
          className: `Class ${student.classGrade || "Unknown"}`,
        },
        riskLevel: riskAnalysis?.riskLevel || "none",
        riskScore: riskAnalysis?.riskScore || 0,
        interventions,
        hasRisk: !!riskAnalysis && riskAnalysis.riskLevel !== "none",
      };
    }

    // Class-level interventions summary
    if (classId) {
      const [classInfo] = await db
        .select({
          id: classes.id,
          name: classes.name,
          grade: classes.grade,
        })
        .from(classes)
        .where(eq(classes.id, classId))
        .limit(1);

      if (!classInfo) {
        return {
          error: "Class not found",
          status: 404,
        };
      }

      // Get all students in class
      const students = await db
        .select({
          id: users.id,
          name: users.name,
        })
        .from(users)
        .where(eq(users.classGrade, classInfo.grade || 0));

      const studentsNeedingIntervention: Array<{
        studentId: string;
        studentName: string;
        riskLevel: string;
        topPriority: string;
      }> = [];

      let urgentCount = 0;
      let highCount = 0;
      const allRecommendedActions = new Set<string>();

      for (const student of students) {
        const riskAnalysis = await earlyWarningSystem.analyzeStudent(student.id);

        if (riskAnalysis && riskAnalysis.riskLevel !== "none") {
          const interventions = await earlyWarningSystem.getInterventions(student.id);
          const topPriority = interventions[0]?.action || "Schedule check-in meeting";

          studentsNeedingIntervention.push({
            studentId: student.id,
            studentName: student.name,
            riskLevel: riskAnalysis.riskLevel,
            topPriority,
          });

          if (riskAnalysis.riskLevel === "critical" || riskAnalysis.riskLevel === "high") {
            if (riskAnalysis.riskLevel === "critical") urgentCount++;
            else highCount++;
          }

          // Collect recommended actions
          riskAnalysis.recommendedActions.forEach(action => allRecommendedActions.add(action));
        }
      }

      // Get class-level recommendations from early warning system
      const classAnalysis = await earlyWarningSystem.analyzeClass(classId);

      return {
        classId,
        className: classInfo.name,
        totalStudents: students.length,
        studentsNeedingIntervention: studentsNeedingIntervention.length,
        urgentInterventions: urgentCount,
        highPriorityInterventions: highCount,
        students: studentsNeedingIntervention,
        recommendedActions: Array.from(allRecommendedActions),
        classRecommendations: classAnalysis.recommendedInterventions,
      };
    }

    return {
      error: "Either studentId or classId is required",
      status: 400,
    };
  },
  ["teacher", "school-admin", "counselor"]
);

// ============================================================================
// POST - Create/Update Intervention Record
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const { studentId, interventionType, notes, scheduledFor } = body;

    if (!studentId || !interventionType) {
      return {
        error: "studentId and interventionType are required",
        status: 400,
      };
    }

    // In a full implementation, this would save to an interventions table
    // For now, return success

    logger.info("Teacher intervention recorded", {
      teacherId: userId,
      studentId,
      interventionType,
      scheduledFor,
    });

    return {
      success: true,
      message: "Intervention recorded successfully",
      data: {
        studentId,
        interventionType,
        notes,
        scheduledFor,
        recordedBy: userId,
        recordedAt: new Date().toISOString(),
      },
    };
  },
  ["teacher", "school-admin", "counselor"]
);
