import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subjects, users } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/school-admin/subjects/[id] - Get subject details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { id } = await params;
    const subject = await db.query.subjects.findFirst({
      where: eq(subjects.id, id),
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
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await request.json();
    const { code, name, nameDzongkha, grade, description, icon, color, isActive } = body;

    const { id } = await params;
    const [updated] = await db.update(subjects)
      .set({
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(nameDzongkha !== undefined && { nameDzongkha }),
        ...(grade !== undefined && { grade }),
        ...(description !== undefined && { description }),
        ...(icon !== undefined && { icon }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive: !!isActive }),
      })
      .where(eq(subjects.id, id))
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
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { id } = await params;
    await db.update(subjects)
      .set({ isActive: false })
      .where(eq(subjects.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Subject delete error:", error);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
