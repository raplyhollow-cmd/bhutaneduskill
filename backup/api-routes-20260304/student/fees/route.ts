import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { studentFees, users, feePayments, feeStructures } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/student/fees - Get own fee details
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user: currentUser } = auth;

    // Get fees using db.select (neon-http compatible)
    const fees = await db
      .select()
      .from(studentFees)
      .where(eq(studentFees.studentId, currentUser.id))
      .orderBy(desc(studentFees.createdAt));

    // Calculate total outstanding
    const totalOutstanding = fees.reduce((sum, fee) => sum + (fee.amountPending || 0), 0);
    const totalPaid = fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);

    // Get recent payments using db.select (neon-http compatible)
    const studentFeeIds = fees.map(f => f.id);
    const payments = studentFeeIds.length > 0 ? await db
      .select()
      .from(feePayments)
      .where(eq(feePayments.studentFeeId, studentFeeIds[0])) // Note: This needs to be updated for multiple fee IDs
      .orderBy(desc(feePayments.collectedAt))
      .limit(10) : [];

    return {
      fees,
      summary: {
        totalOutstanding,
        totalPaid,
        pendingFees: fees.filter(f => f.status === "pending" || f.status === "partial").length,
      },
      recentPayments: payments,
    };
  },
  ['student', 'parent', 'admin']
);
