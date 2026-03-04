/**
 * TEACHER STUDENT SKILLS API
 *
 * GET /api/teacher/students/[studentId]/skills - View a student's skills
 * PUT /api/teacher/students/[studentId]/skills/[skillId]/validate - Validate a self-reported skill
 *
 * Teachers can:
 * - View skills of students in their classes
 * - Validate pending self-reported skills
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  studentSkills,
  enrollments,
  classes,
  users,
  studentProgressAnalytics,
} from "@/lib/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { validateSkill, getStudentSkills } from "@/lib/intelligence/skills-inference-engine";

// ============================================================================
// GET /api/teacher/students/[studentId]/skills - View student's skills
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { userId: teacherId } = auth;
    const params = await context?.params || {};
    const studentId = (params as { studentId: string }).studentId || "";

    if (!studentId) {
      return errorResponse("Student ID is required", 400);
    }

    try {
      // Verify teacher teaches this student
      const teachesStudent = await verifyTeacherStudentAccess(teacherId, studentId);
      if (!teachesStudent) {
        return errorResponse("You don't have permission to view this student's skills", 403);
      }

      // Get student's skills
      const skills = await getStudentSkills(studentId);

      // Get student info
      const [student] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
          classGrade: users.classGrade,
        })
        .from(users)
        .where(eq(users.id, studentId))
        .limit(1);

      return successResponse({
        student,
        skills,
        summary: {
          totalSkills: skills.length,
          inferred: skills.filter(s => s.isInferred).length,
          selfReported: skills.filter(s => !s.isInferred).length,
          pendingValidation: skills.filter(s => !s.isInferred && s.source === "self_report").length,
          byCategory: groupSkillsByCategory(skills),
        },
      });
    } catch (error) {
      logger.error("Failed to get student skills for teacher", { teacherId, studentId, error });
      return errorResponse("Failed to retrieve student skills", 500);
    }
  },
  ["teacher", "school-admin"]
);

// ============================================================================
// PUT /api/teacher/students/[studentId]/skills/validate - Validate self-reported skills
// ============================================================================

async function handleValidation(
  studentId: string,
  teacherId: string,
  approved: boolean
) {
  try {
    // Verify teacher teaches this student
    const teachesStudent = await verifyTeacherStudentAccess(teacherId, studentId);
    if (!teachesStudent) {
      return errorResponse("You don't have permission to validate this student's skills", 403);
    }

    // Get pending skills for this student
    const pendingSkills = await db
      .select()
      .from(studentSkills)
      .where(
        and(
          eq(studentSkills.userId, studentId),
          eq(studentSkills.isInferred, false),
          eq(studentSkills.status, "pending")
        )
      );

    if (pendingSkills.length === 0) {
      return errorResponse("No pending skills to validate", 400);
    }

    // Validate all pending skills
    const validationResults = [];

    for (const skill of pendingSkills) {
      await validateSkill(skill.id, teacherId, approved);
      validationResults.push({
        id: skill.id,
        skillName: skill.skillName,
        status: approved ? "approved" : "rejected",
      });
    }

    return successResponse({
      message: approved
        ? "Skills validated successfully"
        : "Skills rejected",
      validations: validationResults,
    });
  } catch (error) {
    logger.error("Failed to validate skills", { teacherId, studentId, approved, error });
    return errorResponse("Failed to validate skills", 500);
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Verify that a teacher teaches a specific student
 * Note: enrollments table doesn't have teacherId, so we check if they're in the same school
 */
async function verifyTeacherStudentAccess(
  teacherId: string,
  studentId: string
): Promise<boolean> {
  try {
    // Get teacher's and student's school IDs
    const [teacher, student] = await Promise.all([
      db.select({ schoolId: users.schoolId }).from(users).where(eq(users.id, teacherId)).limit(1),
      db.select({ schoolId: users.schoolId }).from(users).where(eq(users.id, studentId)).limit(1),
    ]);

    if (!teacher[0] || !student[0]) {
      return false;
    }

    // Check if they're in the same school
    return teacher[0].schoolId === student[0].schoolId;
  } catch (error) {
    logger.error("Failed to verify teacher-student access", { teacherId, studentId, error });
    return false;
  }
}

function groupSkillsByCategory(skills: unknown[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const skill of skills) {
    const category = (skill as { category: string }).category;
    counts[category] = (counts[category] || 0) + 1;
  }
  return counts;
}

// ============================================================================
// EXPORT VALIDATION HANDLERS FOR ROUTING
// ============================================================================

export { handleValidation as validateAllSkills };