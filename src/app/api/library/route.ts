/**
 * LIBRARY MANAGEMENT API ROUTE
 *
 * Handles book catalog, borrowing, and circulation operations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { books, circulation, users } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - Fetch books and circulation records
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const url = new URL(request.url);
    const action = url.searchParams.get("action"); // books, my-borrows, search

    if (action === "my-borrows") {
      // Get user's borrowed books
      const borrowedBooks = await db.query.circulation.findMany({
        where: and(
          eq(circulation.borrowerId, user.id),
          eq(circulation.status, "borrowed")
        ),
        with: {
          book: true,
        },
        orderBy: [desc(circulation.borrowDate)],
      });

      return NextResponse.json({
        borrowedBooks,
        user: {
          id: user.id,
          type: user.type,
        },
      });
    }

    if (action === "search") {
      const query = url.searchParams.get("q");
      if (!query) {
        return NextResponse.json({ books: [] });
      }

      // Search books by title, author, or ISBN
      const searchResults = await db.query.books.findMany({
        where: and(
          eq(books.schoolId, user.schoolId || ""),
          or(
            eq(books.status, "available"),
            eq(books.status, "borrowed")
          )
        ),
        limit: 20,
      });

      // Filter by search term in application
      const filteredBooks = searchResults.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(query.toLowerCase())
      );

      return NextResponse.json({ books: filteredBooks });
    }

    // Default: Get all books for the school
    const allBooks = await db.query.books.findMany({
      where: and(
        eq(books.schoolId, user.schoolId || ""),
        sql`${books.isActive} = 1`
      ),
      limit: 50,
      orderBy: [desc(books.createdAt)],
    });

    // Get user's current borrows
    const myBorrows = await db.query.circulation.findMany({
      where: and(
        eq(circulation.borrowerId, user.id),
        eq(circulation.status, "borrowed")
      ),
      with: {
        book: true,
      },
    });

    return NextResponse.json({
      books: allBooks,
      myBorrows,
      user: {
        id: user.id,
        type: user.type,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch library data" },
      { status: 500 }
    );
  }
}

// POST - Borrow a book
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { action, bookId, borrowDays } = body;

    if (action === "borrow") {
      // Check if book is available
      const book = await db.query.books.findFirst({
        where: eq(books.id, bookId),
      });

      if (!book) {
        return NextResponse.json({ error: "Book not found" }, { status: 404 });
      }

      if (book.status !== "available") {
        return NextResponse.json(
          { error: "Book is not available for borrowing" },
          { status: 400 }
        );
      }

      // Calculate due date
      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + (borrowDays || 14));

      // Create circulation record
      const [circulationRecord] = await db.insert(circulation).values({
        id: nanoid(),
        bookId: bookId,
        studentId: user.id,
        borrowDate: borrowDate.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        status: "borrowed",
        fine: 0,
        finePaid: false,
        renewals: 0,
        maxRenewals: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Update book status
      await db.update(books).set({ status: "borrowed" }).where(eq(books.id, bookId));

      return NextResponse.json({
        success: true,
        circulation: circulationRecord[0] || circulationRecord,
      });
    }

    return NextResponse.json({
      error: "Invalid action",
      details: "Valid actions: borrow",
    }, { status: 400 });
  } catch (error) {
    logger.apiError(error, { route: "/api/library", method: "POST" });
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// PUT - Return or renew a book
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { circulationId, action, newBookId } = body;

    if (action === "return") {
      const circulationRecord = await db.query.circulation.findFirst({
        where: eq(circulation.id, circulationId),
      });

      if (!circulationRecord || circulationRecord.borrowerId !== user.id) {
        return NextResponse.json({ error: "Circulation not found" }, { status: 404 });
      }

      if (circulationRecord.status !== "borrowed") {
        return NextResponse.json({ error: "Book not borrowed" }, { status: 400 });
      }

      const returnDate = new Date();
      await db.update(circulation)
        .set({
          status: "returned",
          returnDate: returnDate.toISOString().split('T')[0],
          updatedAt: returnDate,
        })
        .where(eq(circulation.id, circulationId));

      // Get the updated record
      const returnedRecord = await db.query.circulation.findFirst({
        where: eq(circulation.id, circulationId),
      });

      // Update book status back to available
      await db.update(books).set({ status: "available" }).where(eq(books.id, returnedRecord?.bookId || circulationRecord.bookId));

      return NextResponse.json({ success: true, circulation: returnedRecord });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    logger.apiError(error, { route: "/api/library", method: "PUT" });
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 });
  }
}

// DELETE - Remove book record (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Book ID is required" }, { status: 400 });
    }

    await db.delete(books).where(eq(books.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.apiError(error, { route: "/api/library", method: "DELETE" });
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
