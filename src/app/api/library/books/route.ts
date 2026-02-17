import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq, and, like, or, desc, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// LIBRARY BOOKS API
// ============================================================================

/**
 * GET /api/library/books
 *
 * Query parameters:
 * - search: Search by title, author, or ISBN
 * - category: Filter by category
 * - status: Filter by status (available, borrowed, reserved, lost)
 * - schoolId: Filter by school ID
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin', 'counselor']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const schoolId = searchParams.get('schoolId') || user.schoolId;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    if (schoolId) {
      conditions.push(eq(books.schoolId, schoolId));
    }

    if (search) {
      conditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(books.category, category));
    }

    if (status) {
      conditions.push(eq(books.status, status as any));
    }

    // Only show active books
    conditions.push(eq(books.isActive, true));

    // Build where clause
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(books)
      .where(whereClause);

    // Get books with pagination
    const booksList = await db
      .select()
      .from(books)
      .where(whereClause)
      .orderBy(desc(books.createdAt))
      .limit(limit)
      .offset(offset);

    logger.info("Library books fetched", { userId, count: booksList.length });

    return NextResponse.json({
      success: true,
      data: {
        books: booksList,
        pagination: {
          total: Number(total),
          page,
          limit,
          totalPages: Math.ceil(Number(total) / limit)
        }
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/books", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch books" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library/books
 *
 * Create a new book (Admin/School-Admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const {
      title,
      author,
      isbn,
      publicationYear,
      category,
      publisher,
      language,
      description,
      totalPages,
      coverImage,
      schoolId
    } = body;

    // Validation
    if (!title || !author || !isbn || !publicationYear || !category || !publisher || !language) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bookId = `book_${nanoid()}`;
    const now = new Date();

    const [newBook] = await db.insert(books).values({
      id: bookId,
      schoolId: schoolId || user.schoolId || '',
      title,
      author,
      isbn,
      publicationYear,
      category,
      publisher,
      language,
      description: description || '',
      totalPages: totalPages || 0,
      coverImage: coverImage || '',
      status: 'available',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).returning();

    logger.info("Book created", { userId, bookId });

    return NextResponse.json({
      success: true,
      data: newBook
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/books", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to create book" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/library/books
 *
 * Update a book (Admin/School-Admin only)
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
        { success: false, error: "Book ID is required" },
        { status: 400 }
      );
    }

    const [updatedBook] = await db
      .update(books)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(books.id, id))
      .returning();

    if (!updatedBook) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    logger.info("Book updated", { userId, bookId: id });

    return NextResponse.json({
      success: true,
      data: updatedBook
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/books", method: "PATCH" });
    return NextResponse.json(
      { success: false, error: "Failed to update book" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library/books
 *
 * Soft delete a book (Admin/School-Admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      );
    }

    const [deletedBook] = await db
      .update(books)
      .set({
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(books.id, id))
      .returning();

    if (!deletedBook) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    logger.info("Book deleted", { userId, bookId: id });

    return NextResponse.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/books", method: "DELETE" });
    return NextResponse.json(
      { success: false, error: "Failed to delete book" },
      { status: 500 }
    );
  }
}
