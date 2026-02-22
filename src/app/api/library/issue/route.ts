import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books, users, circulation, libraryMembers, libraryReservations } from "@/lib/db/schema";
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

// Borrow period in days
const DEFAULT_BORROW_DAYS = 14;
const MAX_RENEWALS = 2;

// Helper: Calculate fine for overdue books
function calculateFine(dueDate: string, returnDate: string = new Date().toISOString()): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 0;
  return diffDays * FINE_RATE_PER_DAY;
}

// Helper: Check if user has library membership
async function checkLibraryMembership(userId: string, schoolId: string): Promise<{ valid: boolean; member?: any; error?: string }> {
  const member = await db.query.libraryMembers.findFirst({
    where: and(
      eq(libraryMembers.userId, userId),
      eq(libraryMembers.schoolId, schoolId),
      eq(libraryMembers.membershipStatus, "active")
    ),
  });

  if (!member) {
    return { valid: false, error: "No active library membership found" };
  }

  // Check if borrowing limit reached
  const currentBorrows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(circulation)
    .where(and(
      eq(circulation.borrowerId, userId),
      eq(circulation.status, "borrowed")
    ));

  if (currentBorrows[0]?.count >= member.borrowingLimit) {
    return { valid: false, error: `Borrowing limit reached (${member.borrowingLimit} books)` };
  }

  // Check if member has unpaid fines
  const fineDue = toNumber(member.fineDue);
  if (fineDue > 0) {
    return { valid: false, error: `Please pay outstanding fines (Nu. ${fineDue}) before borrowing` };
  }

  return { valid: true, member };
}

// GET /api/library/issue - Get circulation records
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const includeOverdue = searchParams.get("includeOverdue") === "true";
    const userId = searchParams.get("userId") || "";
    const bookId = searchParams.get("bookId") || "";

    // Build conditions
    const conditions = [];

    // Students can only see their own circulation records
    if (user.type === 'student' || user.type === 'teacher') {
      conditions.push(eq(circulation.borrowerId, user.id));
    } else if (userId) {
      // School admin can filter by user
      conditions.push(eq(circulation.borrowerId, userId));
    }

    if (status) {
      conditions.push(eq(circulation.status, status as any));
    }

    if (bookId) {
      conditions.push(eq(circulation.bookId, bookId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const circulationRecords = await db.query.circulation.findMany({
      where: whereClause,
      with: {
        book: true,
        borrower: {
          columns: {
            id: true,
            name: true,
            type: true,
            schoolId: true,
          },
        },
      },
      orderBy: [desc(circulation.borrowDate)],
    });

    // Calculate overdue status and fines for borrowed books
    const now = new Date();
    const circulationWithCalcs = circulationRecords.map((record) => {
      const isOverdue = record.status === "borrowed" && new Date(record.dueDate) < now;
      const calculatedFine = isOverdue ? calculateFine(record.dueDate) : 0;
      const daysOverdue = isOverdue ? Math.ceil((now.getTime() - new Date(record.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;

      return {
        ...record,
        isOverdue,
        calculatedFine,
        daysOverdue,
      };
    });

    // Filter out returned books if not including all records
    const filteredRecords = includeOverdue
      ? circulationWithCalcs
      : circulationWithCalcs.filter((r) => r.status !== "returned");

    return NextResponse.json({
      success: true,
      data: {
        circulation: filteredRecords,
        stats: {
          total: circulationWithCalcs.length,
          borrowed: circulationWithCalcs.filter((r) => r.status === "borrowed").length,
          overdue: circulationWithCalcs.filter((r) => r.isOverdue).length,
          returned: circulationWithCalcs.filter((r) => r.status === "returned").length,
        },
      },
    });
  } catch (error) {
    logger.error("Circulation fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch circulation records" },
      { status: 500 }
    );
  }
}

const borrowSchema = z.object({
  action: z.enum(["borrow", "renew", "return"]),
  bookId: z.string().optional(),
  circulationId: z.string().optional(),
  borrowDays: z.number().min(1).max(30).default(DEFAULT_BORROW_DAYS),
});

// POST /api/library/issue - Handle book borrow, renew, return
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const validatedData = borrowSchema.parse(body);

    const { action, bookId, circulationId, borrowDays } = validatedData;

    if (action === "borrow") {
      if (!bookId) {
        return NextResponse.json(
          { success: false, error: "Book ID is required for borrowing" },
          { status: 400 }
        );
      }

      // Check book availability
      const book = await db.query.books.findFirst({
        where: eq(books.id, bookId),
      });

      if (!book) {
        return NextResponse.json(
          { success: false, error: "Book not found" },
          { status: 404 }
        );
      }

      if (book.status !== "available") {
        return NextResponse.json(
          { success: false, error: `Book is currently ${book.status}` },
          { status: 400 }
        );
      }

      // Check library membership
      const membershipCheck = await checkLibraryMembership(user.id, user.schoolId || "");
      if (!membershipCheck.valid) {
        return NextResponse.json(
          { success: false, error: membershipCheck.error },
          { status: 400 }
        );
      }

      // Calculate due date
      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + borrowDays);

      // Create circulation record
      const circulationId = `circ_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [newCirculation] = await db.insert(circulation).values({
        id: circulationId,
        bookId: book.id,
        studentId: user.id,
        borrowerId: user.id,
        borrowDate: borrowDate.toISOString(),
        dueDate: dueDate.toISOString(),
        status: "borrowed",
        fine: 0,
        finePaid: false,
        renewals: 0,
        maxRenewals: MAX_RENEWALS,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Update book status
      await db.update(books)
        .set({ status: "borrowed", updatedAt: new Date() })
        .where(eq(books.id, bookId));

      // Update member's currently borrowed count
      await db.update(libraryMembers)
        .set({
          currentlyBorrowed: sql`${libraryMembers.currentlyBorrowed} + 1`,
          totalBorrowed: sql`${libraryMembers.totalBorrowed} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.id, membershipCheck.member!.id));

      logger.info("Book borrowed", {
        circulationId,
        bookId: book.id,
        userId: user.id,
        dueDate: dueDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          circulation: newCirculation,
          dueDate: dueDate.toISOString(),
          message: `Book borrowed successfully. Due date: ${dueDate.toLocaleDateString()}`,
        },
      });
    }

    if (action === "renew") {
      if (!circulationId) {
        return NextResponse.json(
          { success: false, error: "Circulation ID is required for renewal" },
          { status: 400 }
        );
      }

      // Get circulation record
      const record = await db.query.circulation.findFirst({
        where: eq(circulation.id, circulationId),
        with: {
          book: true,
        },
      });

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      // Verify ownership
      if (record.borrowerId !== user.id && user.type !== 'admin' && user.type !== 'school-admin') {
        return NextResponse.json(
          { success: false, error: "You can only renew your own borrowed books" },
          { status: 403 }
        );
      }

      if (record.status !== "borrowed") {
        return NextResponse.json(
          { success: false, error: "This book is not currently borrowed" },
          { status: 400 }
        );
      }

      if (record.renewals >= record.maxRenewals) {
        return NextResponse.json(
          { success: false, error: "Maximum renewals reached" },
          { status: 400 }
        );
      }

      // Check if overdue
      const isOverdue = new Date(record.dueDate) < new Date();
      if (isOverdue) {
        // Calculate fine first
        const fine = calculateFine(record.dueDate);
        if (fine > 0) {
          return NextResponse.json(
            { success: false, error: `Cannot renew overdue book. Please pay fine of Nu. ${fine} first` },
            { status: 400 }
          );
        }
      }

      // Calculate new due date
      const newDueDate = new Date(record.dueDate);
      newDueDate.setDate(newDueDate.getDate() + DEFAULT_BORROW_DAYS);

      // Update circulation record
      const [updatedCirculation] = await db.update(circulation)
        .set({
          dueDate: newDueDate.toISOString(),
          renewals: record.renewals + 1,
          updatedAt: new Date(),
        })
        .where(eq(circulation.id, circulationId))
        .returning();

      logger.info("Book renewed", {
        circulationId,
        userId: user.id,
        newDueDate: newDueDate.toISOString(),
        renewals: record.renewals + 1,
      });

      return NextResponse.json({
        success: true,
        data: {
          circulation: updatedCirculation,
          newDueDate: newDueDate.toISOString(),
          message: `Book renewed successfully. New due date: ${newDueDate.toLocaleDateString()}`,
        },
      });
    }

    if (action === "return") {
      if (!circulationId) {
        return NextResponse.json(
          { success: false, error: "Circulation ID is required for return" },
          { status: 400 }
        );
      }

      // Get circulation record
      const record = await db.query.circulation.findFirst({
        where: eq(circulation.id, circulationId),
        with: {
          book: true,
        },
      });

      if (!record) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      if (record.status !== "borrowed") {
        return NextResponse.json(
          { success: false, error: "This book is not currently borrowed" },
          { status: 400 }
        );
      }

      const returnDate = new Date();
      const fine = calculateFine(record.dueDate, returnDate.toISOString());

      // Update circulation record
      const [updatedCirculation] = await db.update(circulation)
        .set({
          returnDate: returnDate.toISOString(),
          status: fine > 0 ? "overdue" : "returned",
          fine: fine,
          updatedAt: new Date(),
        })
        .where(eq(circulation.id, circulationId))
        .returning();

      // Update book status
      await db.update(books)
        .set({ status: "available", updatedAt: new Date() })
        .where(eq(books.id, record.bookId));

      // Update member's currently borrowed count and fine due
      await db.update(libraryMembers)
        .set({
          currentlyBorrowed: sql`${libraryMembers.currentlyBorrowed} - 1`,
          fineDue: sql`${libraryMembers.fineDue} + ${fine}`,
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.userId, record.borrowerId));

      // Check if there are pending reservations for this book
      const pendingReservations = await db.query.libraryReservations.findMany({
        where: and(
          eq(libraryReservations.bookId, record.bookId),
          eq(libraryReservations.status, "pending")
        ),
        orderBy: [libraryReservations.priority, libraryReservations.reservationDate],
        limit: 1,
      });

      // Notify next reservation holder
      if (pendingReservations.length > 0) {
        const nextReservation = pendingReservations[0];
        await db.update(libraryReservations)
          .set({
            status: "ready",
            notifiedDate: new Date().toISOString(),
            updatedAt: new Date(),
          })
          .where(eq(libraryReservations.id, nextReservation.id));
      }

      logger.info("Book returned", {
        circulationId,
        bookId: record.bookId,
        userId: user.id,
        fine,
        returnDate: returnDate.toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: {
          circulation: updatedCirculation,
          fine,
          message: fine > 0
            ? `Book returned with a fine of Nu. ${fine}`
            : "Book returned successfully",
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Circulation action error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to process circulation action" },
      { status: 500 }
    );
  }
}
