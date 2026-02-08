import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { studentFees, users, feePayments, feeStructures } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/student/fees - Get own fee details
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "student") {
      return NextResponse.json({ error: "Forbidden - Students only" }, { status: 403 });
    }

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
    const payments = await db.query.feePayments.findMany({
      where: eq(feePayments.studentId, currentUser.id),
      orderBy: [desc(feePayments.collectedAt)],
      limit: 10,
    });

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
    console.error("Student fees fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch fees" }, { status: 500 });
  }
}
