import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";

// GET /api/schools/[id] - Get single school
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth();
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.read permission
    const permCheck = await requirePermission(userId, "schools.read");
    if (permCheck) return permCheck;

    const school = await db.query.schools.findFirst({
      where: eq(schools.id, id),
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    return NextResponse.json({ school });
  } catch (error) {
    logger.error("School fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch school" }, { status: 500 });
  }
}

// PUT /api/schools/[id] - Update school
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.update permission
    const permCheck = await requirePermission(userId, "schools.update");
    if (permCheck) return permCheck;

    const body = await request.json();

    const [updatedSchool] = await db
      .update(schools)
      .set(body)
      .where(eq(schools.id, id))
      .returning();

    return NextResponse.json({ school: updatedSchool });
  } catch (error) {
    logger.error("School update error:", error);
    return NextResponse.json({ error: "Failed to update school" }, { status: 500 });
  }
}

// DELETE /api/schools/[id] - Delete school
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check schools.delete permission
    const permCheck = await requirePermission(userId, "schools.delete");
    if (permCheck) return permCheck;

    await db.delete(schools).where(eq(schools.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("School delete error:", error);
    return NextResponse.json({ error: "Failed to delete school" }, { status: 500 });
  }
}
