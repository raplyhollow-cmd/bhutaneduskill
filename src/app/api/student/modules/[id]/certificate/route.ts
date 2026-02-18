/**
 * STUDENT CERTIFICATE API
 * Fetch module completion data and certificate information
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { moduleProgress, learningModules, users, schools } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

/**
 * Generate certificate number
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

// GET /api/student/modules/[id]/certificate
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(["student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { id: moduleId } = await params;

    // Fetch module progress with related data
    const progressData = await db
      .select({
        // Module progress fields
        progressId: moduleProgress.id,
        progress: moduleProgress.progress,
        isCompleted: moduleProgress.isCompleted,
        completedAt: moduleProgress.completedAt,
        certificateUrl: moduleProgress.certificateUrl,
        timeSpent: moduleProgress.timeSpent,
        completedLessons: moduleProgress.completedLessons,

        // Module fields
        moduleId: learningModules.id,
        moduleTitle: learningModules.title,
        moduleDescription: learningModules.description,
        moduleCategory: learningModules.category,
        moduleLevel: learningModules.level,
        moduleDuration: learningModules.duration,
        teacherId: learningModules.teacherId,

        // Student fields
        studentId: users.id,
        studentName: users.name,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentSchoolId: users.schoolId,

        // School fields
        schoolId: schools.id,
        schoolName: schools.name,
        schoolLogo: schools.logo,
      })
      .from(moduleProgress)
      .innerJoin(learningModules, eq(moduleProgress.moduleId, learningModules.id))
      .innerJoin(users, eq(moduleProgress.studentId, users.id))
      .leftJoin(schools, eq(users.schoolId, schools.id))
      .where(
        and(
          eq(moduleProgress.moduleId, moduleId),
          eq(moduleProgress.studentId, userId)
        )
      )
      .limit(1);

    if (!progressData || progressData.length === 0) {
      return NextResponse.json(
        { error: "Not enrolled in this module" },
        { status: 404 }
      );
    }

    const progress = progressData[0];

    // Check if eligible for certificate (completed)
    const isEligibleForCertificate = progress.isCompleted === true || progress.progress === 100;

    if (!isEligibleForCertificate) {
      return NextResponse.json(
        { error: "Module not completed yet", isEligible: false },
        { status: 400 }
      );
    }

    // Fetch teacher name if teacherId exists
    let instructorName: string | undefined;
    if (progress.teacherId) {
      const teacher = await db.query.users.findFirst({
        where: eq(users.id, progress.teacherId),
        columns: {
          name: true,
        },
      });
      instructorName = teacher?.name;
    }

    // Generate or retrieve certificate number
    let certificateNumber = progress.certificateUrl;
    if (!certificateNumber) {
      certificateNumber = generateCertificateNumber();
      // Update progress with certificate number
      await db
        .update(moduleProgress)
        .set({ certificateUrl: certificateNumber })
        .where(eq(moduleProgress.id, progress.progressId));
    }

    // Count completed lessons
    const completedLessons = Array.isArray(progress.completedLessons)
      ? progress.completedLessons.length
      : 0;

    // Calculate grade from progress
    const grade = calculateGrade(progress.progress);

    // Calculate duration in hours
    const estimatedHours = Math.round(progress.moduleDuration / 60);

    const data = {
      // Student info
      studentName: progress.studentName,
      studentId: progress.studentId,

      // Module info
      moduleId: progress.moduleId,
      moduleTitle: progress.moduleTitle,
      moduleDescription: progress.moduleDescription,
      category: progress.moduleCategory,
      level: progress.moduleLevel,

      // Completion data
      progress: progress.progress,
      isCompleted: progress.isCompleted,
      completedAt: progress.completedAt?.toISOString() || null,
      timeSpent: progress.timeSpent, // in seconds
      certificateUrl: progress.certificateUrl,

      // Certificate
      certificateNumber,
      instructorName,
      schoolName: progress.schoolName || undefined,
      schoolLogo: progress.schoolLogo || undefined,

      // Additional stats
      completedLessons,
      estimatedHours,
      grade,
      score: progress.progress,
      isEligibleForCertificate,
    };

    logger.info("Certificate data fetched", {
      moduleId,
      userId,
      certificateNumber,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]/certificate", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch certificate data" },
      { status: 500 }
    );
  }
}
