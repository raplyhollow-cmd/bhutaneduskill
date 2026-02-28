/**
 * STUDENT MODULE COMPLETION API
 * Mark module as completed and generate certificate
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";

interface ModuleCompletionParams extends Record<string, unknown> {
  id: string;
}

/**
 * Generate a unique certificate number
 */
function generateCertificateNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${timestamp}-${random}`;
}

/**
 * Calculate grade based on score
 */
function calculateGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B+";
  if (score >= 60) return "B";
  if (score >= 50) return "C";
  return "D";
}

const completeModuleSchema = z.object({
  quizScore: z.number().min(0).max(100).optional(),
});

// POST /api/student/modules/[id]/complete - Mark module as completed
export const POST = createApiRoute<ModuleCompletionParams>(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;

    const body = await request.json();
    const validationResult = completeModuleSchema.safeParse(body);

    if (!validationResult.success) {
      return {
        error: "Validation failed",
        details: validationResult.error.issues,
        status: 400,
      };
    }

    const { quizScore } = validationResult.data;
    const { id } = await context!.params!;

    // Get progress record using db.select (neon-http compatible)
    const progressResult = await db
      .select()
      .from(moduleProgress)
      .where(
        and(
          eq(moduleProgress.moduleId, id),
          eq(moduleProgress.studentId, userId)
        )
      )
      .limit(1);

    const progress = progressResult[0];

    if (!progress) {
      return { error: "Not enrolled in this module", status: 400 };
    }

    if (progress.isCompleted) {
      return {
        error: "Module already completed",
        progress,
        status: 400,
      };
    }

    // Get module details using db.select (neon-http compatible)
    const moduleResult = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id))
      .limit(1);

    const module = moduleResult[0];

    if (!module) {
      return { error: "Module not found", status: 404 };
    }

    // Get teacher details if teacherId exists
    let teacherData: { firstName?: string; lastName?: string } | null = null;
    if (module.teacherId) {
      const teacherResult = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(users)
        .where(eq(users.id, module.teacherId))
        .limit(1);
      teacherData = teacherResult[0] || null;
    }

    // Get student details for certificate using db.select (neon-http compatible)
    const studentResult = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const student = studentResult[0];

    if (!student) {
      return { error: "Student not found", status: 404 };
    }

    const now = new Date();
    const certificateNumber = generateCertificateNumber();
    const grade = quizScore !== undefined ? calculateGrade(quizScore) : undefined;

    // Generate certificate URL (in production, this would be a real PDF)
    const certificateUrl = `/certificates/modules/${id}/${userId}/${certificateNumber}.pdf`;

    // Update progress record
    const [updated] = await db
      .update(moduleProgress)
      .set({
        progress: 100,
        isCompleted: true,
        status: "completed",
        completedAt: now,
        lastAccessedAt: now,
        updatedAt: now,
        certificateUrl,
      })
      .where(eq(moduleProgress.id, progress.id))
      .returning();

    logger.info("Student completed module", {
      moduleId: id,
      userId,
      certificateNumber,
      quizScore,
      grade,
    });

    return {
      progress: updated,
      certificate: {
        number: certificateNumber,
        url: certificateUrl,
        grade,
        score: quizScore,
        completionDate: now,
        moduleTitle: module.title,
        studentName: `${student!.firstName} ${student!.lastName || ""}`.trim(),
        instructorName: teacherData ? `${teacherData.firstName || ""} ${teacherData.lastName || ""}`.trim() : undefined,
      },
    };
  },
  ["student"]
);
