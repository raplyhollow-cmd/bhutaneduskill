import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { studentFees, users, feePayments, feeStructures } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/student/fees - Get own fee details
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['student', 'parent', 'admin']);
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status });
  }

  const { user: currentUser } = authResult;

  try {
    const fees = await db.query.studentFees.findMany({
      where: eq(studentFees.studentId, currentUser.id),
      with: {
        structure: true,
      },
      orderBy: [desc(studentFees.createdAt)],
    });

    // Calculate total outstanding
    const totalOutstanding = fees.reduce((sum, fee) => sum + (fee.amountPending || 0), 0);
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);

    // Get recent payments
    const studentFeeIds = fees.map(f => f.id);
    const payments = studentFeeIds.length > 0 ? await db.query.feePayments.findMany({
      where: eq(feePayments.studentFeeId, studentFeeIds[0]), // Note: This needs to be updated for multiple fee IDs
      orderBy: [desc(feePayments.collectedAt)],
      limit: 10,
    }) : [];

    return NextResponse.json({
      fees,
      summary: {
        totalOutstanding,
        totalPaid,
        pendingFees: fees.filter(f => f.status === "pending" || f.status === "partial").length,
      },
      recentPayments: payments,
    });
  } catch (error) {
    logger.error("Student fees fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}
