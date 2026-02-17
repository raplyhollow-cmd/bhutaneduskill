import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books, circulation } from "@/lib/db/schema";
import { eq, and, gte, lte, count, desc } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// LIBRARY STATS API
// ============================================================================

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

  // $0.50 per day
  return Math.floor(diffDays * 0.5 * 100) / 100;
}

/**
 * GET /api/library/stats
 *
 * Returns library statistics and dashboard data
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || user.schoolId || '';

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Get book statistics
    const [totalBooksResult] = await db
      .select({ value: count() })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        eq(books.isActive, true)
      ));

    const [availableBooksResult] = await db
      .select({ value: count() })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        eq(books.status, 'available'),
        eq(books.isActive, true)
      ));

    const [borrowedBooksResult] = await db
      .select({ value: count() })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        eq(books.status, 'borrowed'),
        eq(books.isActive, true)
      ));

    // Get circulation records for stats
    const allCirculation = await db
      .select()
      .from(circulation)
      .where(eq(circulation.borrowerId, userId));

    // Calculate overdue books and fines
    let overdueBooks = 0;
    let totalFines = 0;
    let finesPaid = 0;
    let finesPending = 0;

    const processedCirculation = allCirculation.map(record => {
      const calculatedFine = calculateFine(record.dueDate, record.returnDate || undefined);
      const isOverdue = !record.returnDate && new Date() > new Date(record.dueDate);

      if (isOverdue) {
        overdueBooks++;
      }

      if (calculatedFine > 0) {
        totalFines += calculatedFine;
        if (record.finePaid) {
          finesPaid += calculatedFine;
        } else {
          finesPending += calculatedFine;
        }
      }

      return {
        ...record,
        calculatedFine,
        isOverdue,
        daysOverdue: isOverdue
          ? Math.ceil((new Date().getTime() - new Date(record.dueDate).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      };
    });

    // Get this month's stats
    const borrowsThisMonthResult = await db
      .select({ value: count() })
      .from(circulation)
      .where(
        and(
          gte(circulation.borrowDate, startOfMonth.toISOString().split('T')[0]),
          lte(circulation.borrowDate, endOfMonth.toISOString().split('T')[0])
        )
      );

    const borrowsThisMonth = borrowsThisMonthResult?.[0]?.value || 0;

    // Get recent circulation
    const recentCirculation = await db
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
        renewals: circulation.renewals,
        maxRenewals: circulation.maxRenewals,
      })
      .from(circulation)
      .where(eq(circulation.borrowerId, userId))
      .orderBy(desc(circulation.borrowDate))
      .limit(10);

    // Get popular books (most borrowed)
    const popularBooksData = await db
      .select({
        id: books.id,
        title: books.title,
        author: books.author,
        isbn: books.isbn,
        category: books.category,
        coverImage: books.coverImage,
        publicationYear: books.publicationYear,
        status: books.status,
      })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        eq(books.isActive, true)
      ))
      .orderBy(desc(books.createdAt))
      .limit(10);

    // Combine data for popular books
    const popularBooks = popularBooksData.map(book => ({
      ...book,
      borrowCount: 0, // TODO: Implement borrow count tracking
    }));

    // Build stats object
    const stats = {
      totalBooks: Number(totalBooksResult?.value || 0),
      availableBooks: Number(availableBooksResult?.value || 0),
      borrowedBooks: Number(borrowedBooksResult?.value || 0),
      reservedBooks: 0, // TODO: Implement from reservations table
      overdueBooks,
      totalDigitalResources: 0, // TODO: Implement from digital_resources table
      totalMembers: 0, // TODO: Implement from library_members table
      activeMembers: 0,
      totalFines: Math.round(totalFines * 100) / 100,
      finesPaid: Math.round(finesPaid * 100) / 100,
      finesPending: Math.round(finesPending * 100) / 100,
      borrowsThisMonth: Number(borrowsThisMonth),
      returnsThisMonth: 0, // TODO: Implement
      newBooksThisMonth: 0, // TODO: Implement
    };

    logger.info("Library stats fetched", { userId, schoolId });

    return NextResponse.json({
      success: true,
      data: {
        stats,
        recentCirculation,
        popularBooks,
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/stats", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch library statistics" },
      { status: 500 }
    );
  }
}
