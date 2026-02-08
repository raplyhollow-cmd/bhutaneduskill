import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { schools, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/schools/[id] - Get single school
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, params.id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    console.error("School fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

// PUT /api/schools/[id] - Update school
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

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updatedSchool] = await db
      .update(schools)
      .set(body)
      .where(eq(schools.id, params.id))
      .returning();

    return NextResponse.json({ school: updatedSchool });
  } catch (error) {
    console.error("School update error:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

// DELETE /api/schools/[id] - Delete school
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

    await db.delete(schools).where(eq(schools.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("School delete error:", error);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}
