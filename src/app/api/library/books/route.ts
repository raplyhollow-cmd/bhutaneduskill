import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { books, users, circulation, libraryReservations } from "@/lib/db/schema";
import { eq, or, like, sql, desc, and } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";

// Valid book statuses
type BookStatus = "available" | "borrowed" | "reserved" | "lost";

const bookSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  isbn: z.string().min(1, "ISBN is required"),
  publicationYear: z.number().min(1000).max(new Date().getFullYear() + 1),
  category: z.string().min(1, "Category is required"),
  coverImage: z.string().default(""),
  description: z.string().default(""),
  publisher: z.string().default(""),
  language: z.string().default("English"),
  totalPages: z.number().min(0).default(0),
  status: z.enum(["available", "borrowed", "reserved", "lost"]).default("available"),
});

// GET /api/library/books - Get books catalog with search
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // Build query conditions
    const conditions = [];

    // For school-admin and student, filter by school
    if (user.type === 'school-admin' || user.type === 'student' || user.type === 'teacher' || user.type === 'parent') {
      conditions.push(eq(books.schoolId, user.schoolId || ""));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(books.title, `%${search}%`),
          like(books.author, `%${search}%`),
          like(books.isbn, `%${search}%`)
        )
      );
    }

    // Category filter
    if (category) {
      conditions.push(eq(books.category, category));
    }

    // Status filter
    if (status) {
      conditions.push(eq(books.status, status as BookStatus));
    }

    // Only show active books
    conditions.push(eq(books.isActive, true));

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(books)
      .where(whereClause);

    // Get books
    const booksList = await db
      .select()
      .from(books)
      .where(whereClause)
      .orderBy(desc(books.createdAt))
      .limit(limit)
      .offset(offset);

    // Calculate availability for each book
    const booksWithAvailability = await Promise.all(
      booksList.map(async (book) => {
        // Count currently borrowed copies
        const borrowedCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(circulation)
          .where(and(
            eq(circulation.bookId, book.id),
            eq(circulation.status, "borrowed")
          ));

        // Count active reservations
        const reservedCount = await db
          .select({ count: sql<number>`count(*)::int` })
          .from(libraryReservations)
          .where(and(
            eq(libraryReservations.bookId, book.id),
            eq(libraryReservations.status, "pending")
          ));

        return {
          ...book,
          availability: {
            totalCopies: 1, // Each record is one physical copy
            borrowed: borrowedCount[0]?.count || 0,
            reserved: reservedCount[0]?.count || 0,
            available: book.status === "available" ? 1 : 0,
          },
        };
      })
    );

    // Get unique categories
    const allCategories = await db
      .selectDistinct({ category: books.category })
      .from(books)
      .where(eq(books.isActive, true));

    return {
      books: booksWithAvailability,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      categories: allCategories.map((c) => c.category),
    };
  },
  ['admin', 'school-admin', 'student', 'teacher', 'parent']
);

// POST /api/library/books - Add a new book (school-admin only)
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const validatedData = bookSchema.parse(body);

    const bookId = `book_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newBook] = await db.insert(books).values({
      id: bookId,
      schoolId: user.schoolId || "",
      title: validatedData.title,
      author: validatedData.author,
      isbn: validatedData.isbn,
      publicationYear: validatedData.publicationYear,
      category: validatedData.category,
      coverImage: validatedData.coverImage,
      description: validatedData.description,
      publisher: validatedData.publisher,
      language: validatedData.language,
      totalPages: validatedData.totalPages,
      status: validatedData.status,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Book added", { bookId, title: validatedData.title, userId: user.id });

    return { book: newBook };
  },
  ['admin', 'school-admin']
);

// PATCH /api/library/books - Update a book (school-admin only)
export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return { error: "Book ID is required", status: 400 };
    }

    const validatedData = bookSchema.partial().parse(updateData);

    const updatedBook = await db
      .update(books)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();

    if (updatedBook.length === 0) {
      return { error: "Book not found", status: 404 };
    }

    logger.info("Book updated", { bookId: id, userId: user.id });

    return { book: updatedBook[0] };
  },
  ['admin', 'school-admin']
);

// DELETE /api/library/books - Delete a book (school-admin only)
export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "Book ID is required", status: 400 };
    }

    // Soft delete by setting isActive to false
    const deletedBook = await db
      .update(books)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(books.id, id))
      .returning();

    if (deletedBook.length === 0) {
      return { error: "Book not found", status: 404 };
    }

    logger.info("Book deleted", { bookId: id, userId: user.id });

    return { message: "Book deleted successfully" };
  },
  ['admin', 'school-admin']
);
