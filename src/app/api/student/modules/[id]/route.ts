import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// GET /api/student/modules/[id] - Get module details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, params.id),
      with: {
        subject: true,
        teacher: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!module) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    // Get student's progress
    const progress = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, params.id),
        eq(moduleProgress.studentId, currentUser.id)
      ),
    });

    return NextResponse.json({ module, progress });
  } catch (error) {
    console.error("Module fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}
