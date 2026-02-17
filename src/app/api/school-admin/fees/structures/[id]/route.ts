import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { feeStructures, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/school-admin/fees/structures/[id] - Get structure details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { id } = await params;
    const structure = await db.query.feeStructures.findFirst({
      where: eq(feeStructures.id, id),
    });

    if (!structure) {
      return NextResponse.json({ error: "Fee structure not found" }, { status: 404 });
    }

    return NextResponse.json({ structure });
  } catch (error) {
    logger.error("Fee structure fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fee structure" }, { status: 500 });
  }
}

// PUT /api/school-admin/fees/structures/[id] - Update structure
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const body = await request.json();
    const { name, grade, academicYear, fees, totalAnnualAmount, applicableScholarships, isActive } = body;

    const currentUser = user;

    const { id } = await params;
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
      .where(eq(feeStructures.id, id))
      .returning();

    return NextResponse.json({ structure: updated });
  } catch (error) {
    logger.error("Fee structure update error:", error);
    return NextResponse.json({ error: "Failed to update fee structure" }, { status: 500 });
  }
}

// DELETE /api/school-admin/fees/structures/[id] - Delete structure (soft delete)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const currentUser = user;

    const { id } = await params;
    await db.update(feeStructures)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(feeStructures.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Fee structure delete error:", error);
    return NextResponse.json({ error: "Failed to delete fee structure" }, { status: 500 });
  }
}
