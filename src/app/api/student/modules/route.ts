import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users, enrollments } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/student/modules - List available modules
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const enrolled = searchParams.get("enrolled"); // "true" or "false"

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    if (enrolled === "true") {
      // Get enrolled modules
      const myProgress = await db.query.moduleProgress.findMany({
        where: eq(moduleProgress.studentId, currentUser.id),
        with: {
          module: {
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
          },
        },
        orderBy: [desc(moduleProgress.lastAccessedAt)],
      });

      return NextResponse.json({ modules: myProgress.map(p => ({ ...p.module, progress: p })) });
    }

    // Get available modules from student's school and public modules
    const modules = await db.query.learningModules.findMany({
      where: and(
        eq(learningModules.isPublished, true),
      ),
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
      orderBy: [desc(learningModules.createdAt)],
    });

    // Filter by school or public
    const availableModules = modules.filter(m =>
      m.schoolId === currentUser.schoolId || m.isPublic
    );

    // Get progress for each module
    const moduleIds = availableModules.map(m => m.id);
    const progressList = await db.query.moduleProgress.findMany({
      where: and(
        eq(moduleProgress.studentId, currentUser.id),
      ),
    });

    const progressMap = new Map(progressList.map(p => [p.moduleId, p]));

    const enrichedModules = availableModules.map(m => ({
      ...m,
      progress: progressMap.get(m.id),
      isEnrolled: progressMap.has(m.id),
    }));

    return NextResponse.json({ modules: enrichedModules });
  } catch (error) {
    console.error("Modules fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch modules" }, { status: 500 });
  }
}

// POST /api/student/modules - Enroll in module
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { moduleId } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

    // Check if already enrolled
    const existing = await db.query.moduleProgress.findFirst({
      where: and(
        eq(moduleProgress.moduleId, moduleId),
        eq(moduleProgress.studentId, currentUser.id)
      ),
    });

    if (existing) {
      return NextResponse.json({ error: "Already enrolled" }, { status: 400 });
    }

    // Check module exists and is published
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, moduleId),
    });

    if (!module || !module.isPublished) {
      return NextResponse.json({ error: "Module not available" }, { status: 404 });
    }

    // Check enrollment limit
    if (module.maxEnrollments) {
      const currentEnrollments = await db.query.moduleProgress.findMany({
        where: eq(moduleProgress.moduleId, moduleId),
      });

      if (currentEnrollments.length >= module.maxEnrollments) {
        return NextResponse.json({ error: "Module is full" }, { status: 400 });
      }
    }

    const now = new Date();
    const [progress] = await db.insert(moduleProgress).values({
      id: `prog_${Date.now()}`,
      moduleId,
      studentId: currentUser.id,
      completedLessons: [],
      progressPercentage: 0,
      enrolledAt: now,
      lastAccessedAt: now,
      createdAt: now,
    }).returning();

    return NextResponse.json({ progress }, { status: 201 });
  } catch (error) {
    console.error("Module enrollment error:", error);
    return NextResponse.json({ error: "Failed to enroll in module" }, { status: 500 });
  }
}
