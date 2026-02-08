import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { studentFees, users, feeStructures } from "@/lib/db/schema";
import { eq, and, lte, desc } from "drizzle-orm";

// GET /api/school-admin/fees/defaulters - List fee defaulters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const overdueOnly = searchParams.get("overdueOnly") === "true";

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
      with: {
        student: true,
        structure: true,
      },
    });

    // Filter by status and calculate outstanding
    const defaulterList = defaulters
      .filter(df => df.status === "pending" || df.status === "partial")
      .map(df => ({
        studentId: df.studentId,
        studentName: `${df.student.firstName} ${df.student.lastName}`,
        grade: df.structure?.grade,
        totalAmount: df.totalAmount,
        amountPaid: df.amountPaid || 0,
        amountPending: df.amountPending || (df.totalAmount - (df.amountPaid || 0)),
        dueDate: df.dueDate,
        overdueDays: df.dueDate ? Math.floor((Date.now() - new Date(df.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
      }))
      .sort((a, b) => b.overdueDays - a.overdueDays);

    // Calculate summary
    const summary = {
      totalDefaulters: defaulterList.length,
      totalPending: defaulterList.reduce((sum, d) => sum + d.amountPending, 0),
      overdueCount: defaulterList.filter(d => d.overdueDays > 0).length,
    };

    return NextResponse.json({ defaulters: defaulterList, summary });
  } catch (error) {
    console.error("Defaulters fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch defaulters" }, { status: 500 });
  }
}
