import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homeworkSubmissions, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// POST /api/student/homework/[id]/draft - Save or create draft
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { answers, attachments, textAnswers } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for existing submission
    const existingSubmission = await db.query.homeworkSubmissions.findFirst({
      where: and(
        eq(homeworkSubmissions.homeworkId, params.id),
        eq(homeworkSubmissions.studentId, currentUser.id)
      ),
    });

    const now = new Date();

    if (existingSubmission) {
      // Update existing draft
      if (existingSubmission.status !== "draft") {
        return NextResponse.json({ error: "Cannot update submitted homework" }, { status: 400 });
      }

      const [updated] = await db.update(homeworkSubmissions)
        .set({
          answers: answers || {},
          attachments: attachments || [],
          textAnswers,
          updatedAt: now,
        })
        .where(eq(homeworkSubmissions.id, existingSubmission.id))
        .returning();

      return NextResponse.json({ submission: updated });
    } else {
      // Create new draft
      const [created] = await db.insert(homeworkSubmissions)
        .values({
          id: `sub_${Date.now()}`,
          homeworkId: params.id,
          studentId: currentUser.id,
          answers: answers || {},
          attachments: attachments || [],
          textAnswers,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return NextResponse.json({ submission: created }, { status: 201 });
    }
  } catch (error) {
    console.error("Draft save error:", error);
    return NextResponse.json({ error: "Failed to save draft" }, { status: 500 });
  }
}
