/**
 * STUDENT MODULE COMPLETION API
 * Mark module as completed and generate certificate
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

interface Params {
  params: Promise<{ id: string }>;
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
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const body = await request.json();
    const validationResult = completeModuleSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const { quizScore } = validationResult.data;
    const { id } = await params;

    // Get progress record
    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, id),
        eq(moduleProgress.studentId, userId)
      ),
    });

    if (!progress) {
      return NextResponse.json(
        { error: "Not enrolled in this module" },
        { status: 400 }
      );
    }

    if (progress.isCompleted) {
      return NextResponse.json(
        {
          error: "Module already completed",
          progress,
        },
        { status: 400 }
      );
    }

    // Get module details
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
      with: {
        teacher: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json(
        { error: "Module not found" },
        { status: 404 }
      );
    }

    // Get student details for certificate
    const student = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        schoolId: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
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

    return NextResponse.json({
      progress: updated,
      certificate: {
        number: certificateNumber,
        url: certificateUrl,
        grade,
        score: quizScore,
        completionDate: now,
        moduleTitle: module.title,
        studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
        instructorName: `${(module.teacher as any)?.firstName || ""} ${(module.teacher as any)?.lastName || ""}`.trim(),
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]/complete", method: "POST" });
    return NextResponse.json(
      { error: "Failed to complete module" },
      { status: 500 }
    );
  }
}
