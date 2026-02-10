import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { moduleProgress, learningModules, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/student/modules/[id]/progress - Update progress
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonId, completed } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // Get existing progress
    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, id),
        eq(moduleProgress.studentId, currentUser.id)
      ),
    });

    if (!progress) {
      return NextResponse.json({ error: "Not enrolled in this module" }, { status: 400 });
    }

    const now = new Date();
    let completedLessons = progress.completedLessons || [];
    let currentLesson = lessonId;

    if (completed && !completedLessons.includes(lessonId)) {
      completedLessons.push(lessonId);
    } else if (!completed && completedLessons.includes(lessonId)) {
      completedLessons = completedLessons.filter(l => l !== lessonId);
    }

    // Get module to calculate progress percentage
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    const totalLessons = module?.lessons?.length || 1;
    const progressPercentage = Math.round((completedLessons.length / totalLessons) * 100);

    const [updated] = await db.update(moduleProgress)
      .set({
        completedLessons,
        currentLesson,
        progressPercentage,
        lastAccessedAt: now,
      })
      .where(eq(moduleProgress.id, progress.id))
      .returning();

    return NextResponse.json({ progress: updated });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Failed to update progress" }, { status: 500 });
  }
}
