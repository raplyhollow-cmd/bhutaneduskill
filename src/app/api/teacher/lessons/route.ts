/**
 * TEACHER LESSON PLANNING API
 *
 * POST /api/teacher/lessons - Create a new lesson plan
 * GET /api/teacher/lessons - Get lesson plans for teacher's classes
 * PATCH /api/teacher/lessons/:id - Update a lesson plan
 * DELETE /api/teacher/lessons/:id - Delete a lesson plan
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { lessonPlans, syllabusProgress } from "@/lib/db/lesson-plan-schema";
import { users, classes } from "@/lib/db/schema";
import { eq, desc, and, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

/**
 * GET - Retrieve lesson plans
 * Query params:
 * - classId: Filter by class
 * - status: Filter by status (planned, completed, etc.)
 * - upcoming: Get upcoming lessons only
 * - limit: Number of records (default: 50)
 */
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['teacher', 'admin', 'school-admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId, user: currentUser } = authResult;

  try {
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
        return NextResponse.json({
          success: true,
          data: [],
          count: 0,
        });
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
        // For scheduled dates >= today
        // Note: This is a simple comparison, would need proper date handling
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

    return NextResponse.json({
      success: true,
      data: enrichedPlans,
      count: enrichedPlans.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/lessons", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch lesson plans" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new lesson plan
 */
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['teacher']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { userId } = authResult;

  try {
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
      return NextResponse.json(
        { error: "Missing required fields: classId, title, chapter" },
        { status: 400 }
      );
    }

    // Verify teacher teaches this class
    const classRecord = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classRecord || classRecord.teacherId !== userId) {
      return NextResponse.json(
        { error: "You do not teach this class" },
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        ...newLesson,
        objectives: objectives || [],
        resources: resources || [],
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/lessons", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create lesson plan" },
      { status: 500 }
    );
  }
}
