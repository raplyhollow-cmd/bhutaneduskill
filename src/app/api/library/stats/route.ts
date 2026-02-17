import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books, circulation, libraryReservations, libraryMembers, digitalResources } from "@/lib/db/schema";
import { eq, and, gte, lte, count, desc, sql, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// LIBRARY STATS API
// ============================================================================

interface MonthlyStats {
  month: string;
  count: number;
}

interface LibraryStats {
  // Book counts
  totalBooks: number;
  availableBooks: number;
  borrowedBooks: number;
  reservedBooks: number;
  overdueBooks: number;
  newBooksThisMonth: number;

  // Member counts
  totalMembers: number;
  activeMembers: number;

  // Circulation stats
  borrowsThisMonth: number;
  returnsThisMonth: number;
  totalOverdueFines: number;
  finesPaid: number;
  finesPending: number;

  // Digital resources
  totalDigitalResources: number;

  // Monthly trends (last 6 months)
  borrowCountByMonth: MonthlyStats[];
  returnsCountByMonth: MonthlyStats[];
  newBooksByMonth: MonthlyStats[];
}

interface MostBorrowedBook {
  id: string;
  title: string;
  author: string;
  category: string;
  borrowCount: number;
}

/**
 * Calculate fine for overdue books
 * Rate: $0.50 per day
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
 * Get month key for grouping (YYYY-MM format)
 */
function getMonthKey(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Generate monthly stats for the last 6 months
 */
function generateMonthlyStats(): { months: string[]; monthMap: Record<string, string> } {
  const months: string[] = [];
  const monthMap: Record<string, string> = {};
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = getMonthKey(date);
    const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    months.push(key);
    monthMap[key] = label;
  }

  return { months, monthMap };
}

/**
 * Group records by month
 */
function groupByMonth<T extends { borrowDate?: string; returnDate?: string; createdAt?: Date | string }>(
  records: T[],
  dateField: 'borrowDate' | 'returnDate' | 'createdAt'
): MonthlyStats[] {
  const { months, monthMap } = generateMonthlyStats();
  const counts: Record<string, number> = {};

  // Initialize all months with 0
  months.forEach(month => {
    counts[month] = 0;
  });

  // Count records per month
  records.forEach(record => {
    const dateValue = record[dateField];
    if (!dateValue) return;

    const key = getMonthKey(dateValue);
    if (counts.hasOwnProperty(key)) {
      counts[key]++;
    }
  });

  // Convert to array format
  return months.map(month => ({
    month: monthMap[month],
    count: counts[month] || 0,
  }));
}

/**
 * GET /api/library/stats
 *
 * Returns library statistics including:
 * - Book counts (total, available, borrowed, reserved, overdue)
 * - Member counts (total, active)
 * - Circulation stats (borrows/returns this month, fines)
 * - Monthly trends for borrows, returns, and new books
 * - Most borrowed books
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status },
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId') || user.schoolId || '';

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID is required", status: 400 },
        { status: 400 }
      );
    }

    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // ============================================================================
    // BOOK STATISTICS
    // ============================================================================

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

    const [reservedBooksResult] = await db
      .select({ value: count() })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        eq(books.status, 'reserved'),
        eq(books.isActive, true)
      ));

    // New books added this month
    const [newBooksThisMonthResult] = await db
      .select({ value: count() })
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        gte(books.createdAt, startOfMonth),
        lte(books.createdAt, endOfMonth),
        eq(books.isActive, true)
      ));

    // ============================================================================
    // CIRCULATION STATISTICS
    // ============================================================================

    // Get all circulation records for the school
    const allCirculationRecords = await db
      .select()
      .from(circulation);

    // Filter by school (through books table)
    const schoolBookIds = await db
      .select({ id: books.id })
      .from(books)
      .where(eq(books.schoolId, schoolId));

    const schoolBookIdSet = new Set(schoolBookIds.map(b => b.id));
    const schoolCirculation = allCirculationRecords.filter(record =>
      schoolBookIdSet.has(record.bookId)
    );

    // Borrows this month
    const borrowsThisMonth = schoolCirculation.filter(record => {
      const borrowDate = new Date(record.borrowDate);
      return borrowDate >= startOfMonth && borrowDate <= endOfMonth;
    }).length;

    // Returns this month
    const returnsThisMonth = schoolCirculation.filter(record => {
      if (!record.returnDate) return false;
      const returnDate = new Date(record.returnDate);
      return returnDate >= startOfMonth && returnDate <= endOfMonth;
    }).length;

    // Calculate overdue books and fines
    let overdueBooksCount = 0;
    let totalOverdueFines = 0;
    let finesPaid = 0;
    let finesPending = 0;

    schoolCirculation.forEach(record => {
      const isOverdue = !record.returnDate && new Date() > new Date(record.dueDate);
      const calculatedFine = calculateFine(record.dueDate, record.returnDate || undefined);

      if (isOverdue) {
        overdueBooksCount++;
      }

      if (calculatedFine > 0) {
        totalOverdueFines += calculatedFine;
        if (record.finePaid) {
          finesPaid += calculatedFine;
        } else {
          finesPending += calculatedFine;
        }
      }
    });

    // ============================================================================
    // RESERVATION STATISTICS
    // ============================================================================

    const [activeReservationsResult] = await db
      .select({ value: count() })
      .from(libraryReservations)
      .where(and(
        eq(libraryReservations.schoolId, schoolId),
        inArray(libraryReservations.status, ['pending', 'ready'])
      ));

    // ============================================================================
    // MEMBER STATISTICS
    // ============================================================================

    const [totalMembersResult] = await db
      .select({ value: count() })
      .from(libraryMembers)
      .where(eq(libraryMembers.schoolId, schoolId));

    const [activeMembersResult] = await db
      .select({ value: count() })
      .from(libraryMembers)
      .where(and(
        eq(libraryMembers.schoolId, schoolId),
        eq(libraryMembers.membershipStatus, 'active')
      ));

    // ============================================================================
    // DIGITAL RESOURCES STATISTICS
    // ============================================================================

    const [digitalResourcesResult] = await db
      .select({ value: count() })
      .from(digitalResources)
      .where(eq(digitalResources.schoolId, schoolId));

    // ============================================================================
    // MONTHLY TRENDS (LAST 6 MONTHS)
    // ============================================================================

    // Get circulation records for the last 6 months
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const recentCirculation = schoolCirculation.filter(record => {
      const borrowDate = new Date(record.borrowDate);
      return borrowDate >= sixMonthsAgo;
    });

    const borrowCountByMonth = groupByMonth(recentCirculation, 'borrowDate');
    const returnsCountByMonth = groupByMonth(recentCirculation.filter(r => r.returnDate), 'returnDate');

    // Get new books for the last 6 months
    const recentBooks = await db
      .select()
      .from(books)
      .where(and(
        eq(books.schoolId, schoolId),
        gte(books.createdAt, sixMonthsAgo),
        eq(books.isActive, true)
      ));

    const newBooksByMonth = groupByMonth(recentBooks, 'createdAt');

    // ============================================================================
    // MOST BORROWED BOOKS
    // ============================================================================

    // Count borrows per book
    const bookBorrowCount: Record<string, number> = {};
    schoolCirculation.forEach(record => {
      bookBorrowCount[record.bookId] = (bookBorrowCount[record.bookId] || 0) + 1;
    });

    // Get top 10 most borrowed books
    const sortedBookIds = Object.entries(bookBorrowCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([bookId]) => bookId);

    let mostBorrowedBooks: MostBorrowedBook[] = [];

    if (sortedBookIds.length > 0) {
      const topBooks = await db
        .select({
          id: books.id,
          title: books.title,
          author: books.author,
          category: books.category,
        })
        .from(books)
        .where(and(
          eq(books.schoolId, schoolId),
          inArray(books.id, sortedBookIds)
        ));

      mostBorrowedBooks = topBooks
        .map(book => ({
          id: book.id,
          title: book.title,
          author: book.author,
          category: book.category,
          borrowCount: bookBorrowCount[book.id] || 0,
        }))
        .sort((a, b) => b.borrowCount - a.borrowCount);
    }

    // ============================================================================
    // BUILD RESPONSE
    // ============================================================================

    const stats: LibraryStats = {
      totalBooks: Number(totalBooksResult?.value || 0),
      availableBooks: Number(availableBooksResult?.value || 0),
      borrowedBooks: Number(borrowedBooksResult?.value || 0),
      reservedBooks: Number(reservedBooksResult?.value || 0),
      overdueBooks: overdueBooksCount,
      newBooksThisMonth: Number(newBooksThisMonthResult?.value || 0),
      totalMembers: Number(totalMembersResult?.value || 0),
      activeMembers: Number(activeMembersResult?.value || 0),
      borrowsThisMonth,
      returnsThisMonth,
      totalOverdueFines: Math.round(totalOverdueFines * 100) / 100,
      finesPaid: Math.round(finesPaid * 100) / 100,
      finesPending: Math.round(finesPending * 100) / 100,
      totalDigitalResources: Number(digitalResourcesResult?.value || 0),
      borrowCountByMonth,
      returnsCountByMonth,
      newBooksByMonth,
    };

    logger.info("Library stats fetched", { userId, schoolId });

    return NextResponse.json({
      data: {
        stats,
        mostBorrowedBooks,
        activeReservations: Number(activeReservationsResult?.value || 0),
      }
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/library/stats", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch library statistics", status: 500 },
      { status: 500 }
    );
  }
}
