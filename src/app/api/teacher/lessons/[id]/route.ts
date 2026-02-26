/**
 * INDIVIDUAL LESSON PLAN API
 *
 * GET /api/teacher/lessons/:id - Get a lesson plan
 * PATCH /api/teacher/lessons/:id - Update a lesson plan
 * DELETE /api/teacher/lessons/:id - Delete a lesson plan
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { lessonPlans, syllabusProgress } from "@/lib/db/lesson-plan-schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";

interface LessonStats {
  total: number;
  completed: number;
  pending: number;
}

/**
 * GET - Get a lesson plan
 */
export const GET = createApiRoute(
  async (
    request: NextRequest,
    auth,
    context?: { params: Promise<{ id: string }> }
  ) => {
    const { userId } = auth;
    const { id } = await context!.params;

    // Get lesson details
    const lesson = await db.query.lessonPlans.findFirst({
      where: eq(lessonPlans.id, id),
      with: {
        class: true,
        subject: true,
      },
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    // Teachers can only view their own lessons
    if (lesson.teacherId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Calculate statistics
    const stats: LessonStats = {
      total: 1,
      completed: lesson.status === 'completed' ? 1 : 0,
      pending: lesson.status === 'completed' ? 0 : 1,
    };

    return successResponse({
      success: true,
      data: {
        ...lesson,
        objectives: lesson.objectives ? JSON.parse(lesson.objectives) : [],
        resources: lesson.resources ? JSON.parse(lesson.resources) : [],
        stats,
      },
    });
  },
  ['teacher']
);

/**
 * PATCH - Update a lesson plan (including marking as complete)
 */
export const PATCH = createApiRoute(
  async (
    request: NextRequest,
    auth,
    context?: { params: Promise<{ id: string }> }
  ) => {
    const { userId } = auth;
    const { id } = await context!.params;

    // Verify lesson exists and belongs to teacher
    const existingLesson = await db.query.lessonPlans.findFirst({
      where: eq(lessonPlans.id, id),
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (existingLesson.teacherId !== userId) {
      return NextResponse.json({ error: "You can only edit your own lesson plans" }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      chapter,
      chapterNumber,
      objectives,
      activities,
      resources,
      scheduledDate,
      duration,
      status,
      coveragePercentage,
      notes,
      homeworkAssigned,
    } = body;

    const now = new Date();
    interface LessonUpdateData {
      updatedAt: Date;
      title?: string;
      chapter?: string;
      chapterNumber?: number;
      objectives?: string;
      activities?: string;
      resources?: string;
      scheduledDate?: string;
      duration?: number;
      notes?: string;
      homeworkAssigned?: boolean;
      status?: string;
      completedAt?: Date;
      coveragePercentage?: number;
    }
    const updateData: LessonUpdateData = {
      updatedAt: now,
    };

    // Build update object with only provided fields
    if (title !== undefined) updateData.title = title;
    if (chapter !== undefined) updateData.chapter = chapter;
    if (chapterNumber !== undefined) updateData.chapterNumber = chapterNumber;
    if (objectives !== undefined) updateData.objectives = JSON.stringify(objectives);
    if (activities !== undefined) updateData.activities = activities;
    if (resources !== undefined) updateData.resources = JSON.stringify(resources);
    if (scheduledDate !== undefined) updateData.scheduledDate = scheduledDate;
    if (duration !== undefined) updateData.duration = duration;
    if (notes !== undefined) updateData.notes = notes;
    if (homeworkAssigned !== undefined) updateData.homeworkAssigned = homeworkAssigned;

    // Handle status changes
    let newStatus = status;
    if (status !== undefined) {
      updateData.status = status;

      // If marking as complete, set completion timestamp
      if (status === 'completed' && existingLesson.status !== 'completed') {
        updateData.completedAt = now;
        newStatus = 'completed';
      }
    }

    if (coveragePercentage !== undefined) {
      updateData.coveragePercentage = coveragePercentage;
    }

    // Update the lesson
    const [updatedLesson] = await db.update(lessonPlans)
      .set(updateData)
      .where(eq(lessonPlans.id, id))
      .returning();

    // Update syllabus progress if status changed to completed
    if (newStatus === 'completed' && existingLesson.status !== 'completed') {
      const progressRecord = await db.query.syllabusProgress.findFirst({
        where: and(
          eq(syllabusProgress.classId, existingLesson.classId),
          eq(syllabusProgress.teacherId, userId),
          eq(syllabusProgress.subjectId, existingLesson.subjectId || ''),
        ),
      });

      if (progressRecord) {
        const newCompletedCount = (progressRecord.completedChapters || 0) + 1;
        const newProgressPercentage = progressRecord.totalChapters > 0
          ? Math.round((newCompletedCount / progressRecord.totalChapters) * 100)
          : 0;

        await db.update(syllabusProgress)
          .set({
            completedChapters: newCompletedCount,
            progressPercentage: newProgressPercentage,
            currentChapter: existingLesson.chapter,
            currentChapterNumber: existingLesson.chapterNumber,
            lastUpdated: now,
          })
          .where(eq(syllabusProgress.id, progressRecord.id));
      }

      logger.info("Lesson marked as complete", {
        lessonId: id,
        teacherId: userId,
        classId: existingLesson.classId,
      });
    }

    return successResponse({
      success: true,
      data: {
        ...updatedLesson,
        objectives: updatedLesson.objectives ? JSON.parse(updatedLesson.objectives) : [],
        resources: updatedLesson.resources ? JSON.parse(updatedLesson.resources) : [],
      },
    });
  },
  ['teacher']
);

/**
 * DELETE - Delete a lesson plan
 */
export const DELETE = createApiRoute(
  async (
    request: NextRequest,
    auth,
    context?: { params: Promise<{ id: string }> }
  ) => {
    const { userId } = auth;
    const { id } = await context!.params;

    // Verify lesson exists and belongs to teacher
    const existingLesson = await db.query.lessonPlans.findFirst({
      where: eq(lessonPlans.id, id),
    });

    if (!existingLesson) {
      return NextResponse.json({ error: "Lesson plan not found" }, { status: 404 });
    }

    if (existingLesson.teacherId !== userId) {
      return NextResponse.json({ error: "You can only delete your own lesson plans" }, { status: 403 });
    }

    // Delete the lesson
    await db.delete(lessonPlans).where(eq(lessonPlans.id, id));

    // Update syllabus progress
    const progressRecord = await db.query.syllabusProgress.findFirst({
      where: and(
        eq(syllabusProgress.classId, existingLesson.classId),
        eq(syllabusProgress.teacherId, userId),
        eq(syllabusProgress.subjectId, existingLesson.subjectId || ''),
      ),
    });

    if (progressRecord && progressRecord.totalChapters > 0) {
      const newTotal = Math.max(0, (progressRecord.totalChapters || 0) - 1);
      const newCompleted = existingLesson.status === 'completed'
        ? Math.max(0, (progressRecord.completedChapters || 0) - 1)
        : (progressRecord.completedChapters || 0);
      const newProgressPercentage = newTotal > 0
        ? Math.round((newCompleted / newTotal) * 100)
        : 0;

      await db.update(syllabusProgress)
        .set({
          totalChapters: newTotal,
          completedChapters: newCompleted,
          progressPercentage: newProgressPercentage,
          lastUpdated: new Date(),
        })
        .where(eq(syllabusProgress.id, progressRecord.id));
    }

    logger.info("Lesson plan deleted", {
      lessonId: id,
      teacherId: userId,
    });

    return successResponse({
      success: true,
      message: "Lesson plan deleted successfully",
    });
  },
  ['teacher']
);