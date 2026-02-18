import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/classes/[classId] - Get single class
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const authResult = await requireAuth(['admin', 'school-admin', 'teacher', 'counselor', 'student']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Check classes.read permission
    const permCheck = await requirePermission(userId, "classes.read");
    if (permCheck) return permCheck;

    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
      with: {
        teacher: true,
        school: true,
      },
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    return NextResponse.json({ class: classData });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

// PUT /api/classes/[classId] - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const authResult = await requireAuth(['admin', 'school-admin', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user: currentUser, userId } = authResult;

    // Check classes.update permission
    const permCheck = await requirePermission(userId, "classes.update");
    if (permCheck) return permCheck;

    const body = await request.json();

    // Check permissions - must be admin or class teacher
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, classId),
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (currentUser.type !== "admin" && currentUser.type !== "school-admin" && classData.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedClass] = await db
      .update(classes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(classes.id, classId))
      .returning();

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

// DELETE /api/classes/[classId] - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;

    const authResult = await requireAuth(['admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { userId } = authResult;

    // Check classes.delete permission
    const permCheck = await requirePermission(userId, "classes.delete");
    if (permCheck) return permCheck;

    await db.delete(classes).where(eq(classes.id, classId));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
