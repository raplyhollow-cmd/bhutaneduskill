import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { feePayments, users, studentFees } from "@/lib/db/schema";
import { eq, gte, lte, desc, sql } from "drizzle-orm";

// GET /api/reports/fees/collection - Fee collection report
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;

    // Check RBAC permission for viewing reports
    const permCheck = await requirePermission(userId, "reports.view");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(req.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const currentUserRecords = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const currentUser = currentUserRecords[0];

    if (!currentUser || currentUser.type !== "admin") {
      return { error: "Forbidden", status: 403 };
    }

    let conditions = [eq(feePayments.schoolId, currentUser.schoolId)];

    if (startDate) {
      conditions.push(gte(feePayments.collectedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(feePayments.collectedAt, new Date(endDate)));
    }

    // Build where condition
    let whereClause = conditions.length > 1
      ? sql`${conditions.join(' AND ')}`
      : conditions[0];

    const payments = await db
      .select({
        id: feePayments.id,
        studentFeeId: feePayments.studentFeeId,
        amount: feePayments.amount,
        paymentMethod: feePayments.paymentMethod,
        transactionId: feePayments.transactionId,
        receiptNumber: feePayments.receiptNumber,
        paidAt: feePayments.paidAt,
        collectedAt: feePayments.collectedAt,
        status: feePayments.status,
        schoolId: feePayments.schoolId,
        createdAt: feePayments.createdAt,
        student: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(feePayments)
      .leftJoin(studentFees, eq(feePayments.studentFeeId, studentFees.id))
      .leftJoin(users, eq(studentFees.studentId, users.id))
      .where(whereClause)
      .orderBy(desc(feePayments.paidAt));

    // Calculate summary
    const summary = {
      totalCollected: payments.reduce((sum, p) => sum + Number(p.amount || 0), 0),
      transactionCount: payments.length,
      byMethod: {
        cash: payments.filter(p => p.paymentMethod === "cash").reduce((sum, p) => sum + Number(p.amount || 0), 0),
        bank_transfer: payments.filter(p => p.paymentMethod === "bank_transfer").reduce((sum, p) => sum + Number(p.amount || 0), 0),
        check: payments.filter(p => p.paymentMethod === "check").reduce((sum, p) => sum + Number(p.amount || 0), 0),
        online: payments.filter(p => p.paymentMethod === "online").reduce((sum, p) => sum + Number(p.amount || 0), 0),
        upi: payments.filter(p => p.paymentMethod === "upi").reduce((sum, p) => sum + Number(p.amount || 0), 0),
      },
    };

    // Daily breakdown
    const dailyBreakdown: Record<string, number> = {};
    payments.forEach(payment => {
      const date = new Date(payment.collectedAt || new Date()).toISOString().split('T')[0];
      dailyBreakdown[date] = (dailyBreakdown[date] || 0) + Number(payment.amount || 0);
    });

    return {
      data: {
        summary,
        payments,
        dailyBreakdown: Object.entries(dailyBreakdown).map(([date, amount]) => ({ date, amount })),
      }
    };
  }
);
