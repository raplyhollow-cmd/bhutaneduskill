import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// GET /api/school-admin/subjects/[id] - Get subject details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, params.id),
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    return NextResponse.json({ subject });
  } catch (error) {
    console.error("Subject fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch subject" }, { status: 500 });
  }
}

// PUT /api/school-admin/subjects/[id] - Update subject
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, name, nameDzongkha, grade, description, icon, color, isActive } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || !["admin", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(subjects)
      .set({
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(nameDzongkha !== undefined && { nameDzongkha }),
        ...(grade !== undefined && { grade }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive: isActive ? 1 : 0 }),
      })
      .where(eq(subjects.id, params.id))
      .returning();

    return NextResponse.json({ subject: updated });
  } catch (error) {
    console.error("Subject update error:", error);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}

// DELETE /api/school-admin/subjects/[id] - Soft delete subject
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || !["admin", "teacher"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.update(subjects)
      .set({ isActive: false })
      .where(eq(subjects.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subject delete error:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
