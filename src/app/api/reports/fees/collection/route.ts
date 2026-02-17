import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { db } from "@/lib/db";
import { feePayments, users, studentFees } from "@/lib/db/schema";
import { eq, gte, lte, desc, sql } from "drizzle-orm";

// GET /api/reports/fees/collection - Fee collection report
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    // Check RBAC permission for viewing reports
    const permCheck = await requirePermission(userId, "reports.view");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let conditions = [eq(feePayments.schoolId, currentUser.schoolId)];

    if (startDate) {
      conditions.push(gte(feePayments.collectedAt, new Date(startDate)));
    }
    if (endDate) {
      conditions.push(lte(feePayments.collectedAt, new Date(endDate)));
    }

    const payments = await db.query.feePayments.findMany({
      where: conditions.length > 1 ? sql`${conditions.join(' AND ')}` : conditions[0],
      with: {
        student: true,
      },
      orderBy: [desc(feePayments.collectedAt)],
    });

    // Calculate summary
    const summary = {
      totalCollected: payments.reduce((sum, p) => sum + p.amount, 0),
      transactionCount: payments.length,
      byMethod: {
        cash: payments.filter(p => p.paymentMethod === "cash").reduce((sum, p) => sum + p.amount, 0),
        bank_transfer: payments.filter(p => p.paymentMethod === "bank_transfer").reduce((sum, p) => sum + p.amount, 0),
        check: payments.filter(p => p.paymentMethod === "check").reduce((sum, p) => sum + p.amount, 0),
        online: payments.filter(p => p.paymentMethod === "online").reduce((sum, p) => sum + p.amount, 0),
        upi: payments.filter(p => p.paymentMethod === "upi").reduce((sum, p) => sum + p.amount, 0),
      },
    };

    // Daily breakdown
    const dailyBreakdown: Record<string, number> = {};
    payments.forEach(payment => {
      const date = new Date(payment.collectedAt).toISOString().split('T')[0];
      dailyBreakdown[date] = (dailyBreakdown[date] || 0) + payment.amount;
    });

    return NextResponse.json({
      summary,
      payments,
      dailyBreakdown: Object.entries(dailyBreakdown).map(([date, amount]) => ({ date, amount })),
    });
  } catch (error) {
    logger.error("Fee collection report error:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
