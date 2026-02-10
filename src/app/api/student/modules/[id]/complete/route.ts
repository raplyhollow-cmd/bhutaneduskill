import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { moduleProgress, learningModules, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// POST /api/student/modules/[id]/complete - Mark module as completed
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { quizScore } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
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

    // Generate certificate URL (placeholder)
    const certificateUrl = `/certificates/modules/${id}/${currentUser.id}.pdf`;

    const [updated] = await db.update(moduleProgress)
      .set({
        progressPercentage: 100,
        isCompleted: true,
        completedAt: now,
        quizScore,
        certificateUrl,
        lastAccessedAt: now,
      })
      .where(eq(moduleProgress.id, progress.id))
      .returning();

    return NextResponse.json({ progress: updated });
  } catch (error) {
    console.error("Module completion error:", error);
    return NextResponse.json({ error: "Failed to complete module" }, { status: 500 });
  }
}
