import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { feeStructures, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const feeStructureSchema = z.object({
  name: z.string().min(1),
  grade: z.number(),
  academicYear: z.string(),
  fees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    frequency: z.enum(["monthly", "quarterly", "semester", "annual", "one_time"]),
    isOptional: z.number(),
    dueDate: z.string().optional(),
  })),
  totalAnnualAmount: z.number(),
  applicableScholarships: z.array(z.string()).optional(),
});

// GET /api/school-admin/fees/structures - List fee structures
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const academicYear = searchParams.get("academicYear");

    const currentUser = user;

    let conditions = [eq(feeStructures.schoolId, currentUser.schoolId)];
    // Note: feeStructures might not have schoolId in all queries, adjust as needed

    const structures = await db.query.feeStructures.findMany({
      orderBy: [desc(feeStructures.createdAt)],
    });

    return NextResponse.json({ structures });
  } catch (error) {
    console.error("Fee structures fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fee structures" }, { status: 500 });
  }
}

// POST /api/school-admin/fees/structures - Create fee structure
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const validatedData = feeStructureSchema.parse(body);

    const currentUser = user;

    // Transform fees data to match schema
    const transformedFees = validatedData.fees.map(fee => ({
      feeType: fee.name,
      amount: fee.amount,
      frequency: fee.frequency,
    }));

    const [newStructure] = await db.insert(feeStructures).values({
      id: `fee_struct_${Date.now()}`,
      schoolId: currentUser.schoolId,
      name: validatedData.name,
      description: "Fee structure",
      academicYear: validatedData.academicYear,
      grade: validatedData.grade,
      totalFees: validatedData.totalAnnualAmount || 0,
      breakdown: transformedFees,
      fees: transformedFees,
      isRecurring: false,
      currency: "BTN",
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    return NextResponse.json({ structure: newStructure }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Fee structure creation error:", error);
    return NextResponse.json({ error: "Failed to create fee structure" }, { status: 500 });
  }
}
