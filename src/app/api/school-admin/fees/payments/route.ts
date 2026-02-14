import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { feePayments, studentFees, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";

const paymentSchema = z.object({
  studentFeeId: z.string(),
  amount: z.number(),
  paymentMethod: z.enum(["cash", "bank_transfer", "check", "online", "upi"]),
  transactionId: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/school-admin/fees/payments - List all payments
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const limit = parseInt(searchParams.get("limit") || "50");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const payments = await db.query.feePayments.findMany({
      where: studentId ? eq(feePayments.studentFeeId, studentId) : undefined,
      with: {
        student: true,
      },
      orderBy: [desc(feePayments.collectedAt)],
      limit,
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Payments fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

// POST /api/school-admin/fees/payments - Record payment
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = paymentSchema.parse(body);

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get student fee record
    const studentFee = await db.query.studentFees.findFirst({
      where: eq(studentFees.id, validatedData.studentFeeId),
    });

    if (!studentFee) {
      return NextResponse.json({ error: "Student fee record not found" }, { status: 404 });
    }

    const newAmountPaid = (studentFee.amountPaid || 0) + validatedData.amount;
    const amountPending = studentFee.totalAmount - newAmountPaid;

    // Generate receipt number
    const receiptNumber = `REC${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

    // Create payment record
    const [payment] = await db.insert(feePayments).values({
      id: `pay_${Date.now()}`,
      studentFeeId: validatedData.studentFeeId,
      amount: validatedData.amount,
      paidDate: new Date().toISOString().split('T')[0],
      method: validatedData.paymentMethod,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
      receiptNumber,
      status: "paid",
      isRecurring: false,
      dueDate: studentFee.dueDate,
      paidAt: new Date(),
      schoolId: currentUser.schoolId,
      collectedAt: new Date(),
      lastPaymentDate: new Date().toISOString().split('T')[0],
      amountPending: Math.max(0, studentFee.totalAmount - (studentFee.amountPaid || 0) - validatedData.amount),
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Update student fee record
    const newStatus = amountPending <= 0 ? "paid" : newAmountPaid > 0 ? "partial" : "pending";

    await db.update(studentFees)
      .set({
        amountPaid: newAmountPaid,
        amountPending: Math.max(0, amountPending),
        status: newStatus,
        lastPaymentDate: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(studentFees.id, validatedData.studentFeeId));

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.issues }, { status: 400 });
    }
    console.error("Payment creation error:", error);
    return NextResponse.json({ error: "Failed to record payment" }, { status: 500 });
  }
}
