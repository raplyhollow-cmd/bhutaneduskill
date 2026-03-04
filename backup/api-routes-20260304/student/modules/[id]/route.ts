/**
 * STUDENT LEARNING MODULE [id] API
 * Get details of a specific module with student's progress
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users, subjects } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

interface ModuleContentData {
  lessons: unknown[];
  objectives?: string[];
  prerequisites?: string[];
  tags?: string[];
}

// GET /api/student/modules/[id] - Get module details with progress
export const GET = createApiRoute<{ id: string }>(
  async (request: NextRequest, auth, context) => {
    const { userId } = auth;
    const { id } = await context!.params!;

    // Get module details using db.select (neon-http compatible)
    const moduleResult = await db
      .select()
      .from(learningModules)
      .where(eq(learningModules.id, id))
      .limit(1);

    const moduleRaw = moduleResult[0];

    if (!moduleRaw) {
      return { error: "Module not found", status: 404 };
    }

    // Check if module is published
    if (!moduleRaw.isPublished) {
      return { error: "Module is not available", status: 403 };
    }

    // Get subject details if subjectId exists
    let subjectData: { id: string; name: string } | null = null;
    if (moduleRaw.subjectId) {
      const subjectResult = await db
        .select({
          id: subjects.id,
          name: subjects.name,
        })
        .from(subjects)
        .where(eq(subjects.id, moduleRaw.subjectId))
        .limit(1);
      subjectData = subjectResult[0] || null;
    }

    // Get teacher details if teacherId exists
    let teacherData: { id: string; firstName?: string; lastName?: string; email?: string } | null = null;
    if (moduleRaw.teacherId) {
      const teacherResult = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        })
        .from(users)
        .where(eq(users.id, moduleRaw.teacherId))
        .limit(1);
      teacherData = teacherResult[0] || null;
    }

    // Get student's progress for this module using db.select (neon-http compatible)
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

    // Get lessons count from content
    const content = moduleRaw.content as ModuleContentData | null;
    const lessonsCount = content?.lessons?.length || 0;

    const enrichedModule = {
      ...moduleRaw,
      lessonsCount,
      objectives: content?.objectives || [],
      prerequisites: content?.prerequisites || [],
      tags: content?.tags || [],
      subject: subjectData,
      teacher: teacherData,
    };

    logger.info("Student module fetched", { moduleId: id, userId, hasProgress: !!progress });

    return {
      module: enrichedModule,
      progress: progress || null,
      isEnrolled: !!progress,
    };
  },
  ["student"]
);
