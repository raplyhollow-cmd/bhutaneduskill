/**
 * TEACHER PAYSLIPS API
 *
 * GET /api/teacher/payslips - List payslips for the authenticated teacher
 */

import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { payrollRecords } from "@/lib/db/payroll-schema";
import { eq, desc, and } from "drizzle-orm";

// GET /api/teacher/payslips - List teacher's payslips
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["teacher"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const limit = parseInt(searchParams.get("limit") || "24");

    // Build conditions
    const conditions = [eq(payrollRecords.employeeId, user.id)];

    if (year) {
      conditions.push(eq(payrollRecords.payrollYear, parseInt(year)));
    }
    if (month) {
      conditions.push(eq(payrollRecords.payrollMonth, parseInt(month)));
    }

    // Fetch payslips
    const records = await db.query.payrollRecords.findMany({
      where: and(...conditions),
      orderBy: [desc(payrollRecords.payrollYear), desc(payrollRecords.payrollMonth)],
      limit,
    });

    // Calculate summary
    const totalNetPay = records.reduce((sum, r) => sum + (r.netPay || 0), 0);
    const totalEarnings = records.reduce((sum, r) => sum + (r.totalEarnings || 0), 0);
    const totalDeductions = records.reduce((sum, r) => sum + (r.totalDeductions || 0), 0);

    // Group by year
    const byYear: Record<number, any[]> = {};
    for (const record of records) {
      const year = record.payrollYear;
      if (!byYear[year]) byYear[year] = [];
      byYear[year].push(record);
    }

    return NextResponse.json({
      success: true,
      payslips: records,
      summary: {
        totalRecords: records.length,
        totalNetPay,
        totalEarnings,
        totalDeductions,
        averageNetPay: records.length > 0 ? Math.floor(totalNetPay / records.length) : 0,
      },
      byYear,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/teacher/payslips", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch payslips" }, { status: 500 });
  }
}
