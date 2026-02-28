/**
 * LIBRARY MANAGEMENT API ROUTE
 *
 * Handles book catalog, borrowing, and circulation operations
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { books, circulation, users } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

// GET - Fetch books and circulation records
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const url = new URL(request.url);
    const action = url.searchParams.get("action"); // books, my-borrows, search

    if (action === "my-borrows") {
      // Get user's borrowed books
      const borrowedBooks = await db
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
          },
        })
        .from(circulation)
        .leftJoin(books, eq(circulation.bookId, books.id))
        .where(
          and(
            eq(circulation.borrowerId, user.id),
            eq(circulation.status, "borrowed")
          )
        )
        .orderBy(desc(circulation.borrowDate));

      return {
        borrowedBooks: borrowedBooks.map(row => ({
          ...row,
          book: row.book || null,
        })),
        user: {
          id: user.id,
          type: user.type,
        },
      };
    }

    if (action === "search") {
      const query = url.searchParams.get("q");
      if (!query) {
        return { books: [] };
      }

      // Search books by title, author, or ISBN
      const searchResults = await db
        .select()
        .from(books)
        .where(
          and(
            eq(books.schoolId, user.schoolId || ""),
            or(
              eq(books.status, "available"),
              eq(books.status, "borrowed")
            )
          )
        )
        .limit(20);

      // Filter by search term in application
      const filteredBooks = searchResults.filter(book =>
        book.title.toLowerCase().includes(query.toLowerCase()) ||
        book.isbn?.toLowerCase().includes(query.toLowerCase())
      );

      return { books: filteredBooks };
    }

    // Default: Get all books for the school
    const allBooks = await db
      .select()
      .from(books)
      .where(
        and(
          eq(books.schoolId, user.schoolId || ""),
          sql`${books.isActive} = true`
        )
      )
      .limit(50)
      .orderBy(desc(books.createdAt));

    // Get user's current borrows
    const myBorrows = await db
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
        },
      })
      .from(circulation)
      .leftJoin(books, eq(circulation.bookId, books.id))
      .where(
        and(
          eq(circulation.borrowerId, user.id),
          eq(circulation.status, "borrowed")
        )
      );

    return {
      books: allBooks,
      myBorrows: myBorrows.map(row => ({
        ...row,
        book: row.book || null,
      })),
      user: {
        id: user.id,
        type: user.type,
      },
    };
  },
  ['student', 'teacher', 'admin', 'school-admin']
);

// POST - Borrow a book
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await request.json();
    const { action, bookId, borrowDays } = body;

    if (action === "borrow") {
      // Check if book is available
      const book = await db
        .select()
        .from(books)
        .where(eq(books.id, bookId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!book) {
        return { error: "Book not found", status: 404 };
      }

      if (book.status !== "available") {
        return { error: "Book is not available for borrowing", status: 400 };
      }

      // Calculate due date
      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(dueDate.getDate() + (borrowDays || 14));

      // Create circulation record
      const circulationRecord = await db.insert(circulation).values({
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

      return {
        circulation: circulationRecord,
      };
    }

    return {
      error: "Invalid action",
      details: "Valid actions: borrow",
    };
  },
  ['student', 'teacher']
);

// PUT - Return or renew a book
export const PUT = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await request.json();
    const { circulationId, action, newBookId } = body;

    if (action === "return") {
      const circulationRecord = await db
        .select()
        .from(circulation)
        .where(eq(circulation.id, circulationId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!circulationRecord || circulationRecord.borrowerId !== user.id) {
        return { error: "Circulation not found", status: 404 };
      }

      if (circulationRecord.status !== "borrowed") {
        return { error: "Book not borrowed", status: 400 };
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
      const returnedRecord = await db
        .select()
        .from(circulation)
        .where(eq(circulation.id, circulationId))
        .limit(1)
        .then(rows => rows[0] || null);

      // Update book status back to available
      await db.update(books).set({ status: "available" }).where(eq(books.id, returnedRecord?.bookId || (circulationRecord as { bookId?: string })?.bookId || ""));

      return { circulation: returnedRecord };
    }

    return { error: "Invalid action", status: 400 };
  },
  ['student', 'teacher']
);

// DELETE - Remove book record (admin only)
export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return { error: "Book ID is required", status: 400 };
    }

    await db.delete(books).where(eq(books.id, id));

    return { success: true };
  },
  ['admin', 'school-admin']
);
