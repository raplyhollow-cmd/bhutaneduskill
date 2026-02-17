import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books, circulation, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// LIBRARY CIRCULATION API
// ============================================================================

// Fine calculation: $0.50 per day for overdue books
const FINE_PER_DAY = 0.5;
const DEFAULT_BORROW_DAYS = 14;
const MAX_RENEWALS = 2;

/**
 * Calculate fine for overdue books
 */
function calculateFine(dueDate: string, returnDate?: string): number {
  const due = new Date(dueDate);
  const ret = returnDate ? new Date(returnDate) : new Date();

  if (ret <= due) {
    return 0;
  }

  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.floor(diffDays * FINE_PER_DAY * 100) / 100; // Round to 2 decimal places
}

/**
 * GET /api/library/circulation
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');
    const status = searchParams.get('status');
    const bookId = searchParams.get('bookId');
    const includeOverdue = searchParams.get('includeOverdue') === 'true';

    // Build query conditions
    const conditions = [];

    // Students and teachers can only see their own circulation records
    if (user.type === 'student' || user.type === 'teacher') {
      conditions.push(eq(circulation.borrowerId, userId));
    } else if (filterUserId) {
      conditions.push(eq(circulation.borrowerId, filterUserId));
    }

    if (status) {
      conditions.push(eq(circulation.status, status as any));
    }

    if (bookId) {
      conditions.push(eq(circulation.bookId, bookId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get circulation records with book and user details
    const circulationRecords = await db
      .select({
        id: circulation.id,
        bookId: circulation.bookId,
        borrowerId: circulation.borrowerId,
        studentId: circulation.studentId,
        borrowDate: circulation.borrowDate,
        dueDate: circulation.dueDate,
        returnDate: circulation.returnDate,
        status: circulation.status,
        fine: circulation.fine,
        finePaid: circulation.finePaid,
        renewals: circulation.renewals,
        maxRenewals: circulation.maxRenewals,
        notes: circulation.notes,
        createdAt: circulation.createdAt,
        updatedAt: circulation.updatedAt,
        // Book details
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          isbn: books.isbn,
          category: books.category,
          coverImage: books.coverImage,
          publicationYear: books.publicationYear,
          status: books.status,
        },
        // Borrower details
        borrower: {
          id: users.id,
          name: users.name,
          email: users.email,
          type: users.type,
        }
      })
      .from(circulation)
      .innerJoin(books, eq(circulation.bookId, books.id))
      .innerJoin(users, eq(circulation.borrowerId, users.id))
      .where(whereClause)
      .orderBy(desc(circulation.borrowDate));

    // Calculate overdue status and fines if requested
    let processedRecords = circulationRecords;

    if (includeOverdue) {
      processedRecords = circulationRecords.map((record: typeof circulationRecords[number]) => {
        const calculatedFine = calculateFine(record.dueDate, record.returnDate || undefined);
        const isOverdue = !record.returnDate && new Date() > new Date(record.dueDate);

        return {
          ...record,
          calculatedFine,
          isOverdue,
          daysOverdue: isOverdue
            ? Math.ceil((new Date().getTime() - new Date(record.dueDate).getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        };
      }) as typeof circulationRecords;
    }

    logger.info("Library circulation fetched", { userId, count: circulationRecords.length });

    return NextResponse.json({
      success: true,
      data: {
        circulation: processedRecords,
        total: processedRecords.length
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/circulation", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch circulation records" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library/circulation
 *
 * Actions: borrow, renew, return
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { action, bookId, circulationId, borrowDays } = body;

    const now = new Date();

    if (action === 'borrow') {
      // Check if book exists and is available
      const [bookRecord] = await db
        .select()
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1);

      if (!bookRecord) {
        return NextResponse.json(
          { success: false, error: "Book not found" },
          { status: 404 }
        );
      }

      if (bookRecord.status !== 'available') {
        return NextResponse.json(
          { success: false, error: "Book is not available for borrowing" },
          { status: 400 }
        );
      }

      // Check if user has already borrowed this book and not returned
      const [existingBorrow] = await db
        .select()
        .from(circulation)
        .where(
          and(
            eq(circulation.bookId, bookId),
            eq(circulation.borrowerId, userId),
            eq(circulation.status, 'borrowed')
          )
        )
        .limit(1);

      if (existingBorrow) {
        return NextResponse.json(
          { success: false, error: "You have already borrowed this book" },
          { status: 400 }
        );
      }

      // Calculate due date
      const days = borrowDays || DEFAULT_BORROW_DAYS;
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + days);

      // Create circulation record
      const circulationIdNew = `circ_${nanoid()}`;
      const borrowDateStr = now.toISOString();
      const dueDateStr = dueDate.toISOString();

      const [newCirculation] = await db.insert(circulation).values({
        id: circulationIdNew,
        bookId,
        borrowerId: userId,
        studentId: userId,
        borrowDate: borrowDateStr,
        dueDate: dueDateStr,
        status: 'borrowed',
        fine: 0,
        finePaid: false,
        renewals: 0,
        maxRenewals: MAX_RENEWALS,
        createdAt: now,
        updatedAt: now
      }).returning();

      // Update book status
      await db
        .update(books)
        .set({ status: 'borrowed', updatedAt: now })
        .where(eq(books.id, bookId));

      logger.info("Book borrowed", { userId, bookId, circulationId: circulationIdNew });

      return NextResponse.json({
        success: true,
        data: {
          circulation: newCirculation,
          dueDate: dueDateStr
        }
      });

    } else if (action === 'renew') {
      // Get circulation record
      const [circulationRecord] = await db
        .select()
        .from(circulation)
        .where(eq(circulation.id, circulationId))
        .limit(1);

      if (!circulationRecord) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      // Check ownership (students/teachers can only renew their own borrows)
      if ((user.type === 'student' || user.type === 'teacher') && circulationRecord.borrowerId !== userId) {
        return NextResponse.json(
          { success: false, error: "You can only renew your own borrows" },
          { status: 403 }
        );
      }

      if (circulationRecord.status !== 'borrowed') {
        return NextResponse.json(
          { success: false, error: "This book cannot be renewed" },
          { status: 400 }
        );
      }

      if (circulationRecord.renewals >= circulationRecord.maxRenewals) {
        return NextResponse.json(
          { success: false, error: "Maximum renewal limit reached" },
          { status: 400 }
        );
      }

      // Calculate new due date
      const currentDueDate = new Date(circulationRecord.dueDate);
      const newDueDate = new Date(currentDueDate);
      newDueDate.setDate(newDueDate.getDate() + DEFAULT_BORROW_DAYS);

      // Update circulation record
      const [updatedCirculation] = await db
        .update(circulation)
        .set({
          dueDate: newDueDate.toISOString(),
          renewals: circulationRecord.renewals + 1,
          updatedAt: now
        })
        .where(eq(circulation.id, circulationId))
        .returning();

      logger.info("Book renewed", { userId, circulationId });

      return NextResponse.json({
        success: true,
        data: {
          circulation: updatedCirculation,
          newDueDate: newDueDate.toISOString()
        }
      });

    } else if (action === 'return') {
      // Get circulation record
      const [circulationRecord] = await db
        .select()
        .from(circulation)
        .where(eq(circulation.id, circulationId))
        .limit(1);

      if (!circulationRecord) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      // Check ownership (students/teachers can only return their own borrows)
      if ((user.type === 'student' || user.type === 'teacher') && circulationRecord.borrowerId !== userId) {
        return NextResponse.json(
          { success: false, error: "You can only return your own borrows" },
          { status: 403 }
        );
      }

      if (circulationRecord.status !== 'borrowed') {
        return NextResponse.json(
          { success: false, error: "This book has already been returned" },
          { status: 400 }
        );
      }

      // Calculate fine
      const calculatedFine = calculateFine(circulationRecord.dueDate, now.toISOString());

      // Determine status
      const newStatus = calculatedFine > 0 ? 'overdue' : 'returned';

      // Update circulation record
      const [updatedCirculation] = await db
        .update(circulation)
        .set({
          returnDate: now.toISOString(),
          status: newStatus,
          fine: calculatedFine,
          updatedAt: now
        })
        .where(eq(circulation.id, circulationId))
        .returning();

      // Update book status back to available
      await db
        .update(books)
        .set({ status: 'available', updatedAt: now })
        .where(eq(books.id, circulationRecord.bookId));

      logger.info("Book returned", { userId, circulationId, fine: calculatedFine });

      return NextResponse.json({
        success: true,
        data: {
          circulation: updatedCirculation,
          fine: calculatedFine
        }
      });

    } else if (action === 'payFine') {
      // Get circulation record
      const [circulationRecord] = await db
        .select()
        .from(circulation)
        .where(eq(circulation.id, circulationId))
        .limit(1);

      if (!circulationRecord) {
        return NextResponse.json(
          { success: false, error: "Circulation record not found" },
          { status: 404 }
        );
      }

      if (circulationRecord.finePaid) {
        return NextResponse.json(
          { success: false, error: "Fine has already been paid" },
          { status: 400 }
        );
      }

      if (circulationRecord.fine <= 0) {
        return NextResponse.json(
          { success: false, error: "No fine to pay" },
          { status: 400 }
        );
      }

      // Mark fine as paid
      const [updatedCirculation] = await db
        .update(circulation)
        .set({
          finePaid: true,
          updatedAt: now
        })
        .where(eq(circulation.id, circulationId))
        .returning();

      logger.info("Fine paid", { userId, circulationId, amount: circulationRecord.fine });

      return NextResponse.json({
        success: true,
        data: {
          circulation: updatedCirculation,
          fineAmount: circulationRecord.fine
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use: borrow, renew, return, or payFine" },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.apiError(error, { route: "/api/library/circulation", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to process circulation action" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/library/circulation
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Circulation ID is required" },
        { status: 400 }
      );
    }

    const [updatedCirculation] = await db
      .update(circulation)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(circulation.id, id))
      .returning();

    if (!updatedCirculation) {
      return NextResponse.json(
        { success: false, error: "Circulation record not found" },
        { status: 404 }
      );
    }

    logger.info("Circulation record updated", { userId, circulationId: id });

    return NextResponse.json({
      success: true,
      data: updatedCirculation
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/circulation", method: "PATCH" });
    return NextResponse.json(
      { success: false, error: "Failed to update circulation record" },
      { status: 500 }
    );
  }
}
