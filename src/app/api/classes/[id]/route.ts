import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { classes, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/classes/[id] - Get single class
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, params.id),
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
    console.error("Class fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch class" }, { status: 500 });
  }
}

// PUT /api/classes/[id] - Update class
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check permissions - must be admin or the class teacher
    const classData = await db.query.classes.findFirst({
      where: eq(classes.id, params.id),
    });

    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (currentUser.type !== "admin" && classData.teacherId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedClass] = await db
      .update(classes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(classes.id, params.id))
      .returning();

    return NextResponse.json({ class: updatedClass });
  } catch (error) {
    console.error("Class update error:", error);
    return NextResponse.json({ error: "Failed to update class" }, { status: 500 });
  }
}

// DELETE /api/classes/[id] - Delete class
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.delete(classes).where(eq(classes.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Class delete error:", error);
    return NextResponse.json({ error: "Failed to delete class" }, { status: 500 });
  }
}
