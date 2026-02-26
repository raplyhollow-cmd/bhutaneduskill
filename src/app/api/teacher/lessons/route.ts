/**
 * TEACHER LESSON PLANNING API
 *
 * POST /api/teacher/lessons - Create a new lesson plan
 * GET /api/teacher/lessons - Get lesson plans for teacher's classes
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { lessonPlans, syllabusProgress } from "@/lib/db/lesson-plan-schema";
import { users, classes } from "@/lib/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute, type AuthenticatedRequest, type AuthContext } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * GET - Retrieve lesson plans
 * Query params:
 * - classId: Filter by class
 * - status: Filter by status (planned, completed, etc.)
 * - upcoming: Get upcoming lessons only
 * - limit: Number of records (default: 50)
 */
export const GET = createApiRoute(
  ['teacher', 'admin', 'school-admin'],
  async (request: AuthenticatedRequest, auth: AuthContext) => {
    const { userId, user: currentUser } = auth;

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const status = searchParams.get('status');
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get teacher's classes
    let teacherClassIds: string[] = [];
    if (currentUser.type === 'teacher') {
      const teacherClasses = await db.query.classes.findMany({
        where: eq(classes.teacherId, userId),
        columns: { id: true },
      });
      teacherClassIds = teacherClasses.map((c) => c.id);

      if (teacherClassIds.length === 0) {
        return successResponse([], 200);
      }
    }

    // Build conditions
    const conditions = [];

    if (currentUser.type === 'teacher') {
      conditions.push(inArray(lessonPlans.classId, teacherClassIds));
    }

    if (classId) {
      conditions.push(eq(lessonPlans.classId, classId));
    }

    if (status && ['planned', 'completed', 'skipped', 'cancelled'].includes(status)) {
      conditions.push(eq(lessonPlans.status, status));
    }

    if (upcoming) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(or(
        eq(lessonPlans.scheduledDate, today),
      ));
    }

    // Fetch lesson plans
    const plans = await db.query.lessonPlans.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(lessonPlans.scheduledDate)],
      limit,
    });

    // Enrich with class and teacher names
    const enrichedPlans = await Promise.all(
      plans.map(async (plan) => {
        const [cls, teacher] = await Promise.all([
          db.query.classes.findFirst({
            where: eq(classes.id, plan.classId),
            columns: { id: true, name: true, grade: true, section: true },
          }),
          db.query.users.findFirst({
            where: eq(users.id, plan.teacherId),
            columns: { id: true, firstName: true, lastName: true },
          }),
        ]);

        return {
          ...plan,
          // Parse JSON fields
          objectives: plan.objectives ? JSON.parse(plan.objectives || '[]') : [],
          resources: plan.resources ? JSON.parse(plan.resources || '[]') : [],
          className: cls?.name || 'Unknown',
          classGrade: cls?.grade,
          classSection: cls?.section,
          teacherName: teacher ? `${teacher.firstName} ${teacher.lastName || ''}`.trim() : 'Unknown',
        };
      })
    );

    return successResponse({
      data: enrichedPlans,
      count: enrichedPlans.length,
    }, 200);
  }
);

/**
 * POST - Create a new lesson plan
 */
export const POST = createApiRoute(
  ['teacher'],
  async (request: AuthenticatedRequest, auth: AuthContext) => {
    const { userId, user: currentUser } = auth;

    const body = await request.json();
    const {
      classId,
      subjectId,
      title,
      chapter,
      chapterNumber,
      objectives,
      activities,
      resources,
      scheduledDate,
      duration,
      notes,
      homeworkAssigned,
    } = body;

    // Validate required fields
    if (!classId || !title || !chapter) {
      return errorResponse("Missing required fields: classId, title, chapter", 400);
    }

    // Verify teacher teaches this class
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classRecord || classRecord.teacherId !== userId) {
      return errorResponse("You do not teach this class", 403);
    }

    const lessonId = `lesson-${nanoid()}`;
    const now = new Date();

    // Create lesson plan
    const [newLesson] = await db.insert(lessonPlans).values({
      id: lessonId,
      teacherId: userId,
      classId,
      subjectId: subjectId || null,
      title,
      chapter,
      chapterNumber: chapterNumber || null,
      objectives: objectives ? JSON.stringify(objectives) : null,
      activities: activities || null,
      resources: resources ? JSON.stringify(resources) : null,
      scheduledDate: scheduledDate || null,
      duration: duration || null,
      status: 'planned',
      notes: notes || null,
      homeworkAssigned: homeworkAssigned || null,
      createdAt: now,
      updatedAt: now,
    }).returning();

    // Update or create syllabus progress
    const existingProgress = await db.query.syllabusProgress.findFirst({
      where: and(
        eq(syllabusProgress.classId, classId),
        eq(syllabusProgress.teacherId, userId),
        eq(syllabusProgress.subjectId, subjectId || ''),
      ),
    });

    if (existingProgress) {
      // Update total chapters count
      await db.update(syllabusProgress)
        .set({
          totalChapters: (existingProgress.totalChapters || 0) + 1,
          lastUpdated: now,
        })
        .where(eq(syllabusProgress.id, existingProgress.id));
    } else {
      // Create new progress record
      const academicYear = new Date().getFullYear().toString();
      await db.insert(syllabusProgress).values({
        id: `progress-${nanoid()}`,
        classId,
        subjectId: subjectId || null,
        teacherId: userId,
        totalChapters: 1,
        completedChapters: 0,
        progressPercentage: 0,
        academicYear,
        lastUpdated: now,
        createdAt: now,
      });
    }

    logger.info("Lesson plan created", {
      lessonId,
      teacherId: userId,
      classId,
      title,
    });

    return successResponse({
      data: {
        ...newLesson,
        objectives: objectives || [],
        resources: resources || [],
      },
    }, 201);
  }
);