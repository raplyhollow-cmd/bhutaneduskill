/**
 * STUDENT LEARNING MODULE [id] API
 * Get details of a specific module with student's progress
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

interface ModuleContentData {
  lessons: unknown[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

// GET /api/student/modules/[id] - Get module details with progress
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

    const { id } = await params;

    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
      with: {
        subject: {
          columns: {
            id: true,
            name: true,
          },
        },
        teacher: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
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

    // Check if module is published
    if (!module.isPublished) {
      return NextResponse.json(
        { error: "Module is not available" },
        { status: 403 }
      );
    }

    // Get student's progress for this module
    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, id),
        eq(moduleProgress.studentId, userId)
      ),
    });

    // Get lessons count from content
    const content = module.content as ModuleContentData | null;
    const lessonsCount = content?.lessons?.length || 0;

    const enrichedModule = {
      ...module,
      lessonsCount,
      objectives: content?.objectives || [],
      prerequisites: content?.prerequisites || [],
      tags: content?.tags || [],
    };

    logger.info("Student module fetched", { moduleId: id, userId, hasProgress: !!progress });

    return NextResponse.json({
      module: enrichedModule,
      progress: progress || null,
      isEnrolled: !!progress,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/student/modules/[id]", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    );
  }
}
