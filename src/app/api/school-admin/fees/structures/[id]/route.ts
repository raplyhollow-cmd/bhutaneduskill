import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { feeStructures, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: { id: string };
}

// GET /api/school-admin/fees/structures/[id] - Get structure details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const structure = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.id, params.id),
    });

    if (!structure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    return NextResponse.json({ structure });
  } catch (error) {
    console.error("Fee structure fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fee structure" }, { status: 500 });
  }
}

// PUT /api/school-admin/fees/structures/[id] - Update structure
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, grade, academicYear, fees, totalAnnualAmount, applicableScholarships, isActive } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [updated] = await db.update(feeStructures)
      .set({
        ...(name !== undefined && { name }),
        ...(grade !== undefined && { grade }),
        ...(academicYear !== undefined && { academicYear }),
        ...(fees !== undefined && { fees }),
        ...(totalAnnualAmount !== undefined && { totalAnnualAmount }),
        ...(applicableScholarships !== undefined && { applicableScholarships }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(feeStructures.id, params.id))
      .returning();

    return NextResponse.json({ structure: updated });
  } catch (error) {
    console.error("Fee structure update error:", error);
    return NextResponse.json({ error: "Failed to update fee structure" }, { status: 500 });
  }
}

// DELETE /api/school-admin/fees/structures/[id] - Delete structure (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
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

    await db.update(feeStructures)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(feeStructures.id, params.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Fee structure delete error:", error);
    return NextResponse.json({ error: "Failed to delete fee structure" }, { status: 500 });
  }
}
