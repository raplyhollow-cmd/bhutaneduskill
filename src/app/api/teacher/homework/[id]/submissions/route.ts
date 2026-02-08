import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { homework, homeworkSubmissions, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// GET /api/teacher/homework/[id]/submissions - Get all submissions
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // submitted, graded, all

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify homework ownership
    const homeworkData = await db.query.homework.findFirst({
      where: eq(homework.id, params.id),
    });

    if (!homeworkData) {
      return NextResponse.json({ error: "Homework not found" }, { status: 404 });
    }

    if (homeworkData.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get submissions
    let submissions;
    if (status && status !== "all") {
      submissions = await db.query.homeworkSubmissions.findMany({
        where: eq(homeworkSubmissions.homeworkId, params.id),
        with: {
          student: true,
        },
        orderBy: [desc(homeworkSubmissions.submittedAt)],
      });
      // Filter by status
      submissions = submissions.filter(s => s.status === status);
    } else {
      submissions = await db.query.homeworkSubmissions.findMany({
        where: eq(homeworkSubmissions.homeworkId, params.id),
        with: {
          student: true,
        },
        orderBy: [desc(homeworkSubmissions.submittedAt)],
      });
    }

    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("Submissions fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}
