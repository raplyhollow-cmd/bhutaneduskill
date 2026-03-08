/**
 * PAYROLL RECORDS API
 *
 * GET /api/school-admin/payroll/records
 *
 * List and filter payroll records with analytics
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { payrollRecords, payrollRuns } from "@/lib/db/schema";
import { eq, and, desc, sql, gte, lte, or } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse } from "@/lib/api/response-helpers";

/**
 * GET /api/school-admin/payroll/records
 *
 * Query parameters:
 * - month: Filter by month (1-12)
 * - year: Filter by year
 * - employeeId: Filter by employee
 * - status: Filter by payment status
 * - limit: Number of records to return
 * - offset: Offset for pagination
 * - analytics: Include analytics data (true/false)
 */
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const { searchParams } = new URL(request.url);
      const month = searchParams.get("month");
      const year = searchParams.get("year");
      const employeeId = searchParams.get("employeeId");
      const status = searchParams.get("status");
      const limit = parseInt(searchParams.get("limit") || "50");
      const offset = parseInt(searchParams.get("offset") || "0");
      const includeAnalytics = searchParams.get("analytics") === "true";

      // Build query conditions
      const conditions = [eq(payrollRecords.schoolId, user.schoolId)];

      if (month) {
        conditions.push(eq(payrollRecords.payrollMonth, parseInt(month)));
      }
      if (year) {
        conditions.push(eq(payrollRecords.payrollYear, parseInt(year)));
      }
      if (employeeId) {
        conditions.push(eq(payrollRecords.employeeId, employeeId));
      }
      if (status) {
        conditions.push(eq(payrollRecords.paymentStatus, status));
      }

      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)`.as("count") })
        .from(payrollRecords)
        .where(and(...conditions));

      // Get payroll records with join to payroll runs
      const records = await db
        .select({
          // Payroll record fields
          id: payrollRecords.id,
          employeeId: payrollRecords.employeeId,
          employeeName: payrollRecords.employeeName,
          employeeCode: payrollRecords.employeeCode,
          designation: payrollRecords.designation,
          department: payrollRecords.department,
          payrollMonth: payrollRecords.payrollMonth,
          payrollYear: payrollRecords.payrollYear,
          basicSalary: payrollRecords.basicSalary,
          grossEarnings: payrollRecords.grossEarnings,
          totalAllowances: payrollRecords.totalAllowances,
          totalEarnings: payrollRecords.totalEarnings,
          totalDeductions: payrollRecords.totalDeductions,
          netPay: payrollRecords.netPay,
          paymentMethod: payrollRecords.paymentMethod,
          paymentStatus: payrollRecords.paymentStatus,
          paidAt: payrollRecords.paidAt,
          transactionId: payrollRecords.transactionId,
          payslipGenerated: payrollRecords.payslipGenerated,
          payslipUrl: payrollRecords.payslipUrl,
          isLocked: payrollRecords.isLocked,
          createdAt: payrollRecords.createdAt,
          updatedAt: payrollRecords.updatedAt,
          // Payroll run fields
          runType: payrollRuns.runType,
        })
        .from(payrollRecords)
        .leftJoin(payrollRuns, eq(payrollRecords.payrollRunId, payrollRuns.id))
        .where(and(...conditions))
        .orderBy(desc(payrollRecords.createdAt))
        .limit(limit)
        .offset(offset);

      // Convert cents to BTN for display
      const formattedRecords = records.map((record) => ({
        ...record,
        basicSalary: record.basicSalary / 100,
        grossEarnings: record.grossEarnings / 100,
        totalAllowances: record.totalAllowances / 100,
        totalEarnings: record.totalEarnings / 100,
        totalDeductions: record.totalDeductions / 100,
        netPay: record.netPay / 100,
      }));

      // Include analytics if requested
      let analytics: any = null;
      if (includeAnalytics) {
        const analyticsResult = await db
          .select({
            totalNetPay: sql<number>`sum(${payrollRecords.netPay})`.as("totalNetPay"),
            avgNetPay: sql<number>`avg(${payrollRecords.netPay})`.as("avgNetPay"),
            minNetPay: sql<number>`min(${payrollRecords.netPay})`.as("minNetPay"),
            maxNetPay: sql<number>`max(${payrollRecords.netPay})`.as("maxNetPay"),
            count: sql<number>`count(*)`.as("count"),
            paidCount: sql<number>`count(*) filter (where ${payrollRecords.paymentStatus} = 'paid')`.as("paidCount"),
            pendingCount: sql<number>`count(*) filter (where ${payrollRecords.paymentStatus} = 'pending')`.as("pendingCount"),
          })
          .from(payrollRecords)
          .where(and(...conditions));

        analytics = {
          totalNetPay: (analyticsResult[0]?.totalNetPay || 0) / 100,
          avgNetPay: (analyticsResult[0]?.avgNetPay || 0) / 100,
          minNetPay: (analyticsResult[0]?.minNetPay || 0) / 100,
          maxNetPay: (analyticsResult[0]?.maxNetPay || 0) / 100,
          totalEmployees: analyticsResult[0]?.count || 0,
          paidEmployees: analyticsResult[0]?.paidCount || 0,
          pendingEmployees: analyticsResult[0]?.pendingCount || 0,
        };
      }

      return successResponse({
        records: formattedRecords,
        pagination: {
          total: countResult?.count || 0,
          limit,
          offset,
          hasMore: (countResult?.count || 0) > offset + limit,
        },
        analytics,
      });
    } catch (error) {
      console.error("Failed to fetch payroll records", error);
      return badRequestResponse("Failed to fetch payroll records");
    }
  },
  ["school-admin", "admin", "teacher"]
);
