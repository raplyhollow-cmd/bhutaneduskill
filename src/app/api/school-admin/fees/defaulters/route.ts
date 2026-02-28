import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { db } from "@/lib/db";
import { studentFees, users, feeStructures } from "@/lib/db/schema";
import { eq, and, lte, desc, sql } from "drizzle-orm";

// GET /api/school-admin/fees/defaulters - List fee defaulters
export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user } = auth;

    const { searchParams } = new URL(req.url);
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    let conditions = [
      eq(studentFees.schoolId, user.schoolId),
    ];

    // Add overdue condition if requested
    if (overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(lte(studentFees.dueDate, today));
    }

    // Get pending/partial fee records
    const defaulters = await db
      .select()
      .from(studentFees)
      .where(and(...conditions, eq(studentFees.schoolId, user.schoolId)));

    // Get student names separately
    const studentIds = [...new Set(defaulters.map((df) => df.studentId))];
    const studentRecords = studentIds.length > 0
      ? await db
          .select()
          .from(users)
          .where(sql`${users.id} = ANY(${studentIds})`)
      : [];

    // Create a map for quick lookup
    const studentMap = new Map(studentRecords.map((s) => [s.id, s]));

    // Filter by status and calculate outstanding
    const defaulterList = defaulters
      .filter((df) => df.status === "pending" || df.status === "partial")
      .map((df) => {
        const student = studentMap.get(df.studentId);
        return {
          studentId: df.studentId,
          studentName: student?.name || "Unknown",
          grade: student?.classGrade || null,
          totalAmount: df.totalAmount,
          amountPaid: df.amountPaid || 0,
          amountPending: df.amountPending || (df.totalAmount - (df.amountPaid || 0)),
          dueDate: df.dueDate,
          overdueDays: df.dueDate ? Math.floor((Date.now() - new Date(df.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
        };
      })
      .sort((a, b) => b.overdueDays - a.overdueDays);

    // Calculate summary
    const summary = {
      totalDefaulters: defaulterList.length,
      totalPending: defaulterList.reduce((sum, d) => sum + d.amountPending, 0),
      overdueCount: defaulterList.filter(d => d.overdueDays > 0).length,
    };

    return { defaulters: defaulterList, summary };
  },
  ["admin", "school-admin"]
);
