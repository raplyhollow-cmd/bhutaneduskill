/**
 * LIBRARY ISSUE/CIRCULATION API
 *
 * Handles book borrowing, renewals, and returns
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books, users, circulation, libraryMembers, libraryReservations } from "@/lib/db/schema";
import { eq, and, sql, desc, asc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

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
interface LibraryMembershipResult {
  valid: boolean;
  member?: {
    id: string;
    userId: string;
    schoolId: string;
    memberType: string;
    membershipStatus: string;
    borrowingLimit: number;
    fineDue: number | string;
  };
  error?: string;
}

async function checkLibraryMembership(userId: string, schoolId: string): Promise<LibraryMembershipResult> {
  const member = await db
    .select()
    .from(libraryMembers)
    .where(
      and(
        eq(libraryMembers.userId, userId),
        eq(libraryMembers.schoolId, schoolId),
        eq(libraryMembers.membershipStatus, "active")
      )
    )
    .limit(1)
    .then(rows => rows[0] || null);

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

  return {
    valid: true,
    member: {
      id: member.id,
      userId: member.userId,
      schoolId: member.schoolId,
      memberType: member.memberType,
      membershipStatus: member.membershipStatus,
      borrowingLimit: member.borrowingLimit,
      fineDue: member.fineDue,
    },
  };
}

const borrowSchema = z.object({
  action: z.enum(["borrow", "renew", "return"]),
  bookId: z.string().optional(),
  circulationId: z.string().optional(),
  borrowDays: z.number().min(1).max(30).default(DEFAULT_BORROW_DAYS),
});

// GET /api/library/issue - Get circulation records
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
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
      conditions.push(eq(circulation.status, status as "borrowed" | "returned" | "overdue" | "lost"));
    }

    if (bookId) {
      conditions.push(eq(circulation.bookId, bookId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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
        renewals: circulation.renewals,
        maxRenewals: circulation.maxRenewals,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          isbn: books.isbn,
          category: books.category,
          coverImage: books.coverImage,
          status: books.status,
        },
        borrower: {
          id: users.id,
          name: users.name,
          type: users.type,
          schoolId: users.schoolId,
        },
      })
      .from(circulation)
      .leftJoin(books, eq(circulation.bookId, books.id))
      .leftJoin(users, eq(circulation.borrowerId, users.id))
      .where(whereClause)
      .orderBy(desc(circulation.borrowDate));

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

    return successResponse({
      circulation: filteredRecords.map(r => ({
        ...r,
        book: r.book || null,
        borrower: r.borrower || null,
      })),
      stats: {
        total: circulationWithCalcs.length,
        borrowed: circulationWithCalcs.filter((r) => r.status === "borrowed").length,
        overdue: circulationWithCalcs.filter((r) => r.isOverdue).length,
        returned: circulationWithCalcs.filter((r) => r.status === "returned").length,
      },
    });
  },
  ['admin', 'school-admin', 'student', 'teacher']
);

// POST /api/library/issue - Handle book borrow, renew, return
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
    const body = await request.json();
    const validatedData = borrowSchema.parse(body);

    const { action, bookId, circulationId, borrowDays } = validatedData;

    if (action === "borrow") {
      if (!bookId) {
        return badRequestResponse("Book ID is required for borrowing");
      }

      // Check book availability
      const book = await db
        .select()
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!book) {
        return notFoundResponse("Book");
      }

      if (book.status !== "available") {
        return badRequestResponse(`Book is currently ${book.status}`);
      }

      // Check library membership
      const membershipCheck = await checkLibraryMembership(user.id, user.schoolId || "");
      if (!membershipCheck.valid) {
        return badRequestResponse(membershipCheck.error || "Membership check failed");
      }

      // Calculate due date
      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + borrowDays);

      // Create circulation record
      const newCirculationId = `circ_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

      const [newCirculation] = await db.insert(circulation).values({
        id: newCirculationId,
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
        circulationId: newCirculationId,
        bookId: book.id,
        userId: user.id,
        dueDate: dueDate.toISOString(),
      });

      return successResponse({
        circulation: newCirculation,
        dueDate: dueDate.toISOString(),
        message: `Book borrowed successfully. Due date: ${dueDate.toLocaleDateString()}`,
      });
    }

    if (action === "renew") {
      if (!circulationId) {
        return badRequestResponse("Circulation ID is required for renewal");
      }

      // Get circulation record
      const record = await db
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
          book: {
            id: books.id,
            title: books.title,
            author: books.author,
            isbn: books.isbn,
            category: books.category,
            coverImage: books.coverImage,
            status: books.status,
          },
        })
        .from(circulation)
        .leftJoin(books, eq(circulation.bookId, books.id))
        .where(eq(circulation.id, circulationId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!record) {
        return notFoundResponse("Circulation record");
      }

      // Verify ownership
      if (record.borrowerId !== user.id && user.type !== 'admin' && user.type !== 'school-admin') {
        return badRequestResponse("You can only renew your own borrowed books");
      }

      if (record.status !== "borrowed") {
        return badRequestResponse("This book is not currently borrowed");
      }

      if (record.renewals >= record.maxRenewals) {
        return badRequestResponse("Maximum renewals reached");
      }

      // Check if overdue
      const isOverdue = new Date(record.dueDate) < new Date();
      if (isOverdue) {
        // Calculate fine first
        const fine = calculateFine(record.dueDate);
        if (fine > 0) {
          return badRequestResponse(`Cannot renew overdue book. Please pay fine of Nu. ${fine} first`);
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

      return successResponse({
        circulation: updatedCirculation,
        newDueDate: newDueDate.toISOString(),
        message: `Book renewed successfully. New due date: ${newDueDate.toLocaleDateString()}`,
      });
    }

    if (action === "return") {
      if (!circulationId) {
        return badRequestResponse("Circulation ID is required for return");
      }

      // Get circulation record
      const record = await db
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
          book: {
            id: books.id,
            title: books.title,
            author: books.author,
            isbn: books.isbn,
            category: books.category,
            coverImage: books.coverImage,
            status: books.status,
          },
        })
        .from(circulation)
        .leftJoin(books, eq(circulation.bookId, books.id))
        .where(eq(circulation.id, circulationId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!record) {
        return notFoundResponse("Circulation record");
      }

      if (record.status !== "borrowed") {
        return badRequestResponse("This book is not currently borrowed");
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
      const pendingReservations = await db
        .select()
        .from(libraryReservations)
        .where(
          and(
            eq(libraryReservations.bookId, record.bookId),
            eq(libraryReservations.status, "pending")
          )
        )
        .orderBy(asc(libraryReservations.priority), asc(libraryReservations.reservationDate))
        .limit(1);

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

      return successResponse({
        circulation: updatedCirculation,
        fine,
        message: fine > 0
          ? `Book returned with a fine of Nu. ${fine}`
          : "Book returned successfully",
      });
    }

    return badRequestResponse("Invalid action");
  },
  ['admin', 'school-admin', 'student', 'teacher']
);
