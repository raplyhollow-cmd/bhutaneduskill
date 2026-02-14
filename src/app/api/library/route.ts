/**
 * LIBRARY MANAGEMENT API ROUTE
 *
 * Handles book catalog, borrowing, and circulation operations
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { books, circulation, users } from "@/lib/db/schema";
import { eq, and, desc, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - Fetch books and circulation records
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // books, my-borrows, search

    if (action === "my-borrows") {
      // Get user's borrowed books
      const borrowedBooks = await db.query.circulation.findMany({
        where: and(
          eq(circulation.borrowerId, currentUser.id),
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
          id: currentUser.id,
          type: currentUser.type,
        },
      });
    }

    if (action === "search") {
      const query = searchParams.get("q");
      if (!query) {
        return NextResponse.json({ books: [] });
      }

      // Search books by title, author, or ISBN
      const searchResults = await db.query.books.findMany({
        where: and(
          eq(books.schoolId, currentUser.schoolId || ""),
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
        eq(books.schoolId, currentUser.schoolId || ""),
        sql`${books.isActive} = 1`
      ),
      limit: 50,
      orderBy: [desc(books.createdAt)],
    });

    // Get user's current borrows
    const myBorrows = await db.query.circulation.findMany({
      where: and(
        eq(circulation.borrowerId, currentUser.id),
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
        id: currentUser.id,
        type: currentUser.type,
      },
    });
  } catch (error) {
    console.error("Error fetching library data:", error);
    return NextResponse.json(
      { error: "Failed to fetch library data" },
      { status: 500 }
    );
  }
}

// POST - Borrow a book
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, schoolId: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
        studentId: currentUser.id,
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
      await db.update(books)
        .set({
          status: "borrowed",
          updatedAt: new Date(),
        })
        .where(eq(books.id, bookId));

      return NextResponse.json({
        success: true,
        circulation: circulationRecord[0],
      });
    }

    if (action === "return") {
      const { circulationId } = body;

      const circulationRecord = await db.query.circulation.findFirst({
        where: eq(circulation.id, circulationId),
      });

      if (!circulationRecord) {
        return NextResponse.json({ error: "Circulation record not found" }, { status: 404 });
      }

      // Update circulation record
      await db.update(circulation)
        .set({
          status: "returned",
          returnDate: new Date().toISOString().split('T')[0],
          updatedAt: new Date(),
        })
        .where(eq(circulation.id, circulationId));

      // Update book status to available
      await db.update(books)
        .set({
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(books.id, circulationRecord.bookId));

      return NextResponse.json({
        success: true,
        message: "Book returned successfully",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Error processing library action:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    );
  }
}
