import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { learningModules, moduleProgress, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/modules/[id] - Get module details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const module = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
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

    // Get enrollment stats
    const enrollments = await db.query.moduleProgress.findMany({
      where: eq(moduleProgress.moduleId, id),
    });

    const stats = {
      totalEnrollments: enrollments.length,
      completed: enrollments.filter(e => e.isCompleted).length,
      inProgress: enrollments.filter(e => !e.isCompleted).length,
      averageProgress: enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, e) => sum + (e.progressPercentage || 0), 0) / enrollments.length)
        : 0,
    };

    return NextResponse.json({ module, stats });
  } catch (error) {
    console.error("Module fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch module" }, { status: 500 });
  }
}

// PUT /api/teacher/modules/[id] - Update module
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, lessons, quiz, isPublished, isPublic, enrollable, maxEnrollments } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // Verify ownership
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 });
    }

    if (existing.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(learningModules)
      .set({
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(lessons !== undefined && { lessons }),
        ...(quiz !== undefined && { quiz }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isPublic !== undefined && { isPublic }),
        ...(enrollable !== undefined && { enrollable }),
        ...(maxEnrollments !== undefined && { maxEnrollments }),
        updatedAt: new Date(),
      })
      .where(eq(learningModules.id, id))
      .returning();

    return NextResponse.json({ module: updated });
  } catch (error) {
    console.error("Module update error:", error);
    return NextResponse.json({ error: "Failed to update module" }, { status: 500 });
  }
}

// DELETE /api/teacher/modules/[id] - Delete module
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    // Verify ownership
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing || existing.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check for enrollments
    const enrollments = await db.query.moduleProgress.findMany({
      where: eq(moduleProgress.moduleId, id),
    });

    if (enrollments.length > 0) {
      return NextResponse.json({ error: "Cannot delete module with enrollments" }, { status: 400 });
    }

    await db.delete(learningModules).where(eq(learningModules.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Module delete error:", error);
    return NextResponse.json({ error: "Failed to delete module" }, { status: 500 });
  }
}

// POST /api/teacher/modules/[id] - Module actions
export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.query.learningModules.findFirst({
      where: eq(learningModules.id, id),
    });

    if (!existing || existing.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (action === "publish") {
      const [updated] = await db.update(learningModules)
        .set({ isPublished: true, updatedAt: new Date() })
        .where(eq(learningModules.id, id))
        .returning();

      return NextResponse.json({ module: updated });
    }

    if (action === "duplicate") {
      const [duplicated] = await db.insert(learningModules)
        .values({
          ...existing,
          id: `mod_${Date.now()}`,
          title: `${existing.title} (Copy)`,
          isPublished: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({ module: duplicated }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Module action error:", error);
    return NextResponse.json({ error: "Failed to perform action" }, { status: 500 });
  }
}
