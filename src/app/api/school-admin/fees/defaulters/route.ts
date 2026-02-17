import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { studentFees, users, feeStructures } from "@/lib/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

// GET /api/school-admin/fees/defaulters - List fee defaulters
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    const currentUser = user;

    let conditions = [
      eq(studentFees.schoolId, currentUser.schoolId),
    ];

    // Add overdue condition if requested
    if (overdueOnly) {
      const today = new Date().toISOString().split('T')[0];
      conditions.push(lte(studentFees.dueDate, today));
    }

    // Get pending/partial fee records
    const defaulters = await db.query.studentFees.findMany({
      where: and(...conditions, eq(studentFees.schoolId, currentUser.schoolId)),
    });

    // Get student names separately
    const studentIds = [...new Set(defaulters.map((df: any) => df.studentId))];
    const studentRecords = studentIds.length > 0 ? await db.query.users.findMany({
      where: eq(users.id, studentIds[0] as any), // Get first student - will need proper IN clause
    }) : [];

    // Create a map for quick lookup
    const studentMap = new Map(studentRecords.map((s: any) => [s.id, s]));

    // Filter by status and calculate outstanding
    const defaulterList = defaulters
      .filter((df: any) => df.status === "pending" || df.status === "partial")
      .map((df: any) => {
        const student: any = studentMap.get(df.studentId);
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

    return NextResponse.json({ defaulters: defaulterList, summary });
  } catch (error) {
    logger.error("Defaulters fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch defaulters" }, { status: 500 });
  }
}
