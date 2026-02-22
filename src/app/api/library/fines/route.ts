import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { circulation, libraryMembers, users, books } from "@/lib/db/schema";
import { eq, and, sql, desc, gt } from "drizzle-orm";
import { z } from "zod";

// Fine rate: Nu. 2 per day (Bhutanese Ngultrum)
const FINE_RATE_PER_DAY = 2;

// Helper: Convert decimal/string to number
function toNumber(value: string | number | null | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  return parseFloat(value as string) || 0;
}

// Helper: Calculate fine for overdue books
function calculateFine(dueDate: string, returnDate: string = new Date().toISOString()): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 0;
  return diffDays * FINE_RATE_PER_DAY;
}

const payFineSchema = z.object({
  memberId: z.string().optional(),
  circulationId: z.string().optional(),
  amount: z.number().min(0),
  paymentMethod: z.enum(["cash", "online", "waiver"]).default("cash"),
  notes: z.string().optional(),
});

// GET /api/library/fines - Get fines information
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const unpaidOnly = searchParams.get("unpaid") === "true";
    const memberId = searchParams.get("memberId") || "";
    const myFines = searchParams.get("my") === "true";

    // For students/teachers, only show their own fines
    const userIdFilter = (myFines || user.type === 'student' || user.type === 'teacher')
      ? user.id
      : undefined;

    // Get circulation records with fines
    const circulationConditions = [];

    if (userIdFilter) {
      circulationConditions.push(eq(circulation.borrowerId, userIdFilter));
    }

    if (unpaidOnly) {
      circulationConditions.push(sql`${circulation.fine} > ${circulation.finePaid}`);
    }

    const circulationWhereClause = circulationConditions.length > 0
      ? and(...circulationConditions)
      : undefined;

    const circulationRecords = await db
      .select({
        id: circulation.id,
        bookId: circulation.bookId,
        borrowerId: circulation.borrowerId,
        borrowDate: circulation.borrowDate,
        dueDate: circulation.dueDate,
        returnDate: circulation.returnDate,
        status: circulation.status,
        fine: circulation.fine,
        finePaid: circulation.finePaid,
        bookTitle: books.title,
        bookAuthor: books.author,
        bookIsbn: books.isbn,
        borrowerName: users.name,
        borrowerType: users.type,
      })
      .from(circulation)
      .leftJoin(books, eq(circulation.bookId, books.id))
      .leftJoin(users, eq(circulation.borrowerId, users.id))
      .where(circulationWhereClause)
      .orderBy(desc(circulation.dueDate));

    // Helper to convert decimal to number
    const toNumber = (value: string | number | null | undefined): number => {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      return parseFloat(value as string) || 0;
    };

    // Calculate outstanding fines
    const finesWithCalc = circulationRecords.map((record) => {
      const calculatedFine = record.status === "borrowed"
        ? calculateFine(record.dueDate)
        : toNumber(record.fine);

      const totalFine = calculatedFine;
      const paid = record.finePaid ? toNumber(record.fine) : 0;
      const outstanding = totalFine - paid;

      return {
        circulationId: record.id,
        bookId: record.bookId,
        bookTitle: record.bookTitle || "Unknown",
        borrowerId: record.borrowerId,
        borrowerName: record.borrowerName || "Unknown",
        dueDate: record.dueDate,
        returnDate: record.returnDate,
        status: record.status,
        totalFine,
        paid,
        outstanding,
        isOverdue: new Date(record.dueDate) < new Date(),
      };
    });

    // Filter out records with no outstanding fines
    const outstandingFines = finesWithCalc.filter((f) => f.outstanding > 0);

    // Group by borrower
    const finesByBorrower = new Map<string, typeof outstandingFines>();
    outstandingFines.forEach((fine) => {
      const existing = finesByBorrower.get(fine.borrowerId) || [];
      finesByBorrower.set(fine.borrowerId, [...existing, fine]);
    });

    // Calculate summary stats
    const totalOutstanding = outstandingFines.reduce((sum, f) => sum + f.outstanding, 0);
    const totalPaid = finesWithCalc.reduce((sum, f) => sum + f.paid, 0);

    // Get library members with fine due
    let membersWithFines: any[] = [];
    if (user.type === 'admin' || user.type === 'school-admin') {
      const memberConditions = [];

      if (userIdFilter) {
        memberConditions.push(eq(libraryMembers.userId, userIdFilter));
      } else if (memberId) {
        memberConditions.push(eq(libraryMembers.id, memberId));
      }

      // Use SQL for decimal comparison
      memberConditions.push(sql`${libraryMembers.fineDue} > ${"0"}`);

      const memberWhereClause = memberConditions.length > 0
        ? and(...memberConditions)
        : sql`${libraryMembers.fineDue} > ${"0"}`;

      membersWithFines = await db.query.libraryMembers.findMany({
        where: memberWhereClause,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              type: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        fines: outstandingFines,
        membersWithFines,
        summary: {
          totalOutstanding,
          totalPaid,
          overdueBooks: outstandingFines.filter((f) => f.isOverdue).length,
          totalMembersWithFines: membersWithFines.length,
        },
      },
    });
  } catch (error) {
    logger.error("Fines fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch fines" },
      { status: 500 }
    );
  }
}

// POST /api/library/fines - Pay fines (school-admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const validatedData = payFineSchema.parse(body);

    if (!validatedData.memberId && !validatedData.circulationId) {
      return NextResponse.json(
        { success: false, error: "Either memberId or circulationId is required" },
        { status: 400 }
      );
    }

    let paidAmount = 0;
    let updatedMember: any = null;
    const updatedCirculations: any[] = [];

    if (validatedData.circulationId) {
      // Pay fine for specific circulation record
      const circulationRecord = await db.query.circulation.findFirst({
        where: eq(circulation.id, validatedData.circulationId),
      });

      if (!circulationRecord) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      const calculatedFine = circulationRecord.status === "borrowed"
        ? calculateFine(circulationRecord.dueDate)
        : circulationRecord.fine;

      const totalFine = calculatedFine;
      const alreadyPaid = circulationRecord.finePaid ? circulationRecord.fine : 0;
      const outstanding = totalFine - alreadyPaid;

      if (outstanding <= 0) {
        return NextResponse.json(
          { success: false, error: "No outstanding fine for this record" },
          { status: 400 }
        );
      }

      const paymentAmount = Math.min(validatedData.amount, outstanding);
      paidAmount = paymentAmount;

      const newFinePaid = alreadyPaid + paymentAmount;
      const isFullyPaid = newFinePaid >= totalFine;

      const [updatedCirculation] = await db.update(circulation)
        .set({
          finePaid: isFullyPaid,
          fine: isFullyPaid ? totalFine : circulationRecord.fine,
          updatedAt: new Date(),
        })
        .where(eq(circulation.id, validatedData.circulationId))
        .returning();

      updatedCirculations.push(updatedCirculation);

      // Update member's fine due
      const member = await db.query.libraryMembers.findFirst({
        where: eq(libraryMembers.userId, circulationRecord.borrowerId),
      });

      if (member) {
        const currentFineDue = toNumber(member.fineDue);
        const newFineDue = Math.max(0, currentFineDue - paymentAmount);

        const [updated] = await db.update(libraryMembers)
          .set({
            fineDue: newFineDue.toString(),
            updatedAt: new Date(),
          })
          .where(eq(libraryMembers.id, member.id))
          .returning();

        updatedMember = updated;
      }
    } else if (validatedData.memberId) {
      // Pay fines for member (all outstanding)
      const member = await db.query.libraryMembers.findFirst({
        where: eq(libraryMembers.id, validatedData.memberId),
      });

      if (!member) {
        return NextResponse.json(
          { success: false, error: "Library member not found" },
          { status: 404 }
        );
      }

      const currentFineDue = toNumber(member.fineDue);
      if (currentFineDue <= 0) {
        return NextResponse.json(
          { success: false, error: "No outstanding fines for this member" },
          { status: 400 }
        );
      }

      const paymentAmount = Math.min(validatedData.amount, currentFineDue);
      paidAmount = paymentAmount;
      const newFineDue = currentFineDue - paymentAmount;

      const [updated] = await db.update(libraryMembers)
        .set({
          fineDue: newFineDue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.id, validatedData.memberId))
        .returning();

      updatedMember = updated;

      // Mark all circulation fines as paid if fully paid
      if (newFineDue === 0) {
        const circulationRecords = await db.query.circulation.findMany({
          where: eq(circulation.borrowerId, member.userId),
        });

        for (const record of circulationRecords) {
          if (record.fine > 0 && !record.finePaid) {
            const [updatedCirc] = await db.update(circulation)
              .set({
                finePaid: true,
                updatedAt: new Date(),
              })
              .where(eq(circulation.id, record.id))
              .returning();

            updatedCirculations.push(updatedCirc);
          }
        }
      }
    }

    logger.info("Fine payment recorded", {
      amount: paidAmount,
      paymentMethod: validatedData.paymentMethod,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        paidAmount,
        remainingBalance: updatedMember ? toNumber(updatedMember.fineDue) : 0,
        member: updatedMember,
        circulations: updatedCirculations,
        message: `Payment of Nu. ${paidAmount} recorded successfully`,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Fine payment error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process fine payment" },
      { status: 500 }
    );
  }
}

// PATCH /api/library/fines - Update fine records (school-admin only)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const { circulationId, waiveAmount, reason } = body;

    if (!circulationId) {
      return NextResponse.json(
        { success: false, error: "Circulation ID is required" },
        { status: 400 }
      );
    }

    // Get circulation record
    const circulationRecord = await db.query.circulation.findFirst({
      where: eq(circulation.id, circulationId),
    });

    if (!circulationRecord) {
      return NextResponse.json(
        { success: false, error: "Circulation record not found" },
        { status: 404 }
      );
    }

    const calculatedFine = circulationRecord.status === "borrowed"
      ? calculateFine(circulationRecord.dueDate)
      : circulationRecord.fine;

    const totalFine = calculatedFine;
    const waiveAmt = waiveAmount || totalFine;

    // Waive fine by marking as paid
    const [updatedCirculation] = await db.update(circulation)
      .set({
        finePaid: true,
        fine: totalFine,
        updatedAt: new Date(),
      })
      .where(eq(circulation.id, circulationId))
      .returning();

    // Update member's fine due
    const member = await db.query.libraryMembers.findFirst({
      where: eq(libraryMembers.userId, circulationRecord.borrowerId),
    });

    if (member) {
      const currentFineDue = toNumber(member.fineDue);
      const newFineDue = Math.max(0, currentFineDue - waiveAmt);

      await db.update(libraryMembers)
        .set({
          fineDue: newFineDue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.id, member.id));
    }

    logger.info("Fine waived", {
      circulationId,
      waiveAmount: waiveAmt,
      reason,
      userId: user.id,
    });

    return NextResponse.json({
      success: true,
      data: {
        circulation: updatedCirculation,
        waivedAmount: waiveAmt,
        message: `Fine of Nu. ${waiveAmt} waived successfully`,
      },
    });
  } catch (error) {
    logger.error("Fine waiver error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to waive fine" },
      { status: 500 }
    );
  }
}
