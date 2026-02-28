import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { libraryReservations, books, users, libraryMembers } from "@/lib/db/schema";
import { eq, and, sql, desc, or, asc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";

// Reservation expires after 7 days
const RESERVATION_EXPIRY_DAYS = 7;

// Valid reservation statuses
type ReservationStatus = "pending" | "fulfilled" | "cancelled" | "expired";

const reservationSchema = z.object({
  bookId: z.string().min(1, "Book ID is required"),
  priority: z.number().min(1).max(10).default(1),
  notes: z.string().optional(),
});

const updateReservationSchema = z.object({
  id: z.string(),
  action: z.enum(["cancel", "fulfill", "expire"]),
  cancellationReason: z.string().optional(),
});

// GET /api/library/reservations - Get book reservations
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || "";
    const bookId = searchParams.get("bookId") || "";
    const myReservations = searchParams.get("my") === "true";

    // Build conditions
    const conditions = [];

    // Filter by school
    conditions.push(eq(libraryReservations.schoolId, user.schoolId || ""));

    // Students/teachers can only see their own reservations
    if (myReservations || user.type === 'student' || user.type === 'teacher') {
      conditions.push(eq(libraryReservations.userId, user.id));
    }

    if (status) {
      conditions.push(eq(libraryReservations.status, status as ReservationStatus));
    }

    if (bookId) {
      conditions.push(eq(libraryReservations.bookId, bookId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const reservations = await db
      .select({
        id: libraryReservations.id,
        schoolId: libraryReservations.schoolId,
        bookId: libraryReservations.bookId,
        userId: libraryReservations.userId,
        reservationDate: libraryReservations.reservationDate,
        expiryDate: libraryReservations.expiryDate,
        status: libraryReservations.status,
        priority: libraryReservations.priority,
        notes: libraryReservations.notes,
        notifiedDate: libraryReservations.notifiedDate,
        fulfilledDate: libraryReservations.fulfilledDate,
        cancelledDate: libraryReservations.cancelledDate,
        cancellationReason: libraryReservations.cancellationReason,
        createdAt: libraryReservations.createdAt,
        updatedAt: libraryReservations.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          isbn: books.isbn,
          category: books.category,
          coverImage: books.coverImage,
        },
        user: {
          id: users.id,
          name: users.name,
          type: users.type,
          email: users.email,
        },
      })
      .from(libraryReservations)
      .leftJoin(books, eq(libraryReservations.bookId, books.id))
      .leftJoin(users, eq(libraryReservations.userId, users.id))
      .where(whereClause)
      .orderBy(asc(libraryReservations.priority), asc(libraryReservations.reservationDate));

    // Check for expired reservations
    const now = new Date();
    const expiredReservations = reservations.filter(
      (r) => r.status === "pending" && new Date(r.expiryDate) < now
    );

    // Auto-expire old reservations
    for (const reservation of expiredReservations) {
      await db.update(libraryReservations)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(libraryReservations.id, reservation.id));
    }

    // Refetch with updated status
    const updatedReservations = await db
      .select({
        id: libraryReservations.id,
        schoolId: libraryReservations.schoolId,
        bookId: libraryReservations.bookId,
        userId: libraryReservations.userId,
        reservationDate: libraryReservations.reservationDate,
        expiryDate: libraryReservations.expiryDate,
        status: libraryReservations.status,
        priority: libraryReservations.priority,
        notes: libraryReservations.notes,
        notifiedDate: libraryReservations.notifiedDate,
        fulfilledDate: libraryReservations.fulfilledDate,
        cancelledDate: libraryReservations.cancelledDate,
        cancellationReason: libraryReservations.cancellationReason,
        createdAt: libraryReservations.createdAt,
        updatedAt: libraryReservations.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          isbn: books.isbn,
          category: books.category,
          coverImage: books.coverImage,
        },
        user: {
          id: users.id,
          name: users.name,
          type: users.type,
          email: users.email,
        },
      })
      .from(libraryReservations)
      .leftJoin(books, eq(libraryReservations.bookId, books.id))
      .leftJoin(users, eq(libraryReservations.userId, users.id))
      .where(whereClause)
      .orderBy(asc(libraryReservations.priority), asc(libraryReservations.reservationDate));

    return {
      reservations: updatedReservations.map(r => ({
        ...r,
        book: r.book || null,
        user: r.user || null,
      })),
      stats: {
        total: updatedReservations.length,
        pending: updatedReservations.filter((r) => r.status === "pending").length,
        ready: updatedReservations.filter((r) => r.status === "ready").length,
        fulfilled: updatedReservations.filter((r) => r.status === "fulfilled").length,
        expired: updatedReservations.filter((r) => r.status === "expired").length,
      },
    };
  },
  ['admin', 'school-admin', 'student', 'teacher']
);

// POST /api/library/reservations - Create book reservation
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const validatedData = reservationSchema.parse(body);

    // Check if book exists
    const book = await db
      .select()
      .from(books)
      .where(eq(books.id, validatedData.bookId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!book) {
      return { error: "Book not found", status: 404 };
    }

    // Don't allow reservation if book is available
    if (book.status === "available") {
      return { error: "Book is currently available for borrowing", status: 400 };
    }

    // Check if user has active library membership
    const member = await db
      .select()
      .from(libraryMembers)
      .where(
        and(
          eq(libraryMembers.userId, user.id),
          eq(libraryMembers.schoolId, user.schoolId || ""),
          eq(libraryMembers.membershipStatus, "active")
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (!member) {
      return { error: "You must have an active library membership to reserve books", status: 400 };
    }

    // Check if user already has a pending/ready reservation for this book
    const existingReservation = await db
      .select()
      .from(libraryReservations)
      .where(
        and(
          eq(libraryReservations.userId, user.id),
          eq(libraryReservations.bookId, validatedData.bookId),
          or(
            eq(libraryReservations.status, "pending"),
            eq(libraryReservations.status, "ready")
          )
        )
      )
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingReservation) {
      return { error: "You already have an active reservation for this book", status: 400 };
    }

    // Calculate expiry date
    const reservationDate = new Date();
    const expiryDate = new Date(reservationDate);
    expiryDate.setDate(expiryDate.getDate() + RESERVATION_EXPIRY_DAYS);

    // Get queue position
    const queueCount = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(libraryReservations)
      .where(and(
        eq(libraryReservations.bookId, validatedData.bookId),
        eq(libraryReservations.status, "pending")
      ));

    const queuePosition = (queueCount[0]?.count || 0) + 1;

    const reservationId = `lib_res_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    const [newReservation] = await db.insert(libraryReservations).values({
      id: reservationId,
      schoolId: user.schoolId || "",
      bookId: validatedData.bookId,
      userId: user.id,
      reservationDate: reservationDate.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: "pending",
      priority: validatedData.priority,
      notes: validatedData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Book reservation created", {
      reservationId,
      bookId: validatedData.bookId,
      userId: user.id,
      queuePosition,
    });

    return {
      reservation: newReservation,
      message: queuePosition > 1
        ? `Book reserved successfully. You are position #${queuePosition} in the queue.`
        : "Book reserved successfully. You will be notified when it's available.",
    };
  },
  ['admin', 'school-admin', 'student', 'teacher']
);

// PATCH /api/library/reservations - Update reservation (cancel, fulfill, expire)
export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const body = await request.json();
    const validatedData = updateReservationSchema.parse(body);

    const { id, action, cancellationReason } = validatedData;

    // Get existing reservation
    const reservation = await db
      .select({
        id: libraryReservations.id,
        schoolId: libraryReservations.schoolId,
        bookId: libraryReservations.bookId,
        userId: libraryReservations.userId,
        reservationDate: libraryReservations.reservationDate,
        expiryDate: libraryReservations.expiryDate,
        status: libraryReservations.status,
        priority: libraryReservations.priority,
        notes: libraryReservations.notes,
        notifiedDate: libraryReservations.notifiedDate,
        fulfilledDate: libraryReservations.fulfilledDate,
        cancelledDate: libraryReservations.cancelledDate,
        cancellationReason: libraryReservations.cancellationReason,
        createdAt: libraryReservations.createdAt,
        updatedAt: libraryReservations.updatedAt,
        book: {
          id: books.id,
          title: books.title,
          author: books.author,
          isbn: books.isbn,
          category: books.category,
          coverImage: books.coverImage,
        },
      })
      .from(libraryReservations)
      .leftJoin(books, eq(libraryReservations.bookId, books.id))
      .where(eq(libraryReservations.id, id))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!reservation) {
      return { error: "Reservation not found", status: 404 };
    }

    // Students/teachers can only cancel their own reservations
    if (action === "cancel" && reservation.userId !== user.id && user.type !== 'admin' && user.type !== 'school-admin') {
      return { error: "You can only cancel your own reservations", status: 403 };
    }

    // Only school-admin can fulfill or expire reservations
    if ((action === "fulfill" || action === "expire") && user.type !== 'admin' && user.type !== 'school-admin') {
      return { error: "Unauthorized", status: 403 };
    }

    if (action === "cancel") {
      if (reservation.status === "fulfilled" || reservation.status === "cancelled") {
        return { error: "Cannot cancel a fulfilled or already cancelled reservation", status: 400 };
      }

      const [updatedReservation] = await db.update(libraryReservations)
        .set({
          status: "cancelled",
          cancelledDate: new Date().toISOString(),
          cancellationReason: cancellationReason || "Cancelled by user",
          updatedAt: new Date(),
        })
        .where(eq(libraryReservations.id, id))
        .returning();

      // Notify next person in queue
      if (reservation.status === "ready") {
        const nextReservation = await db
          .select()
          .from(libraryReservations)
          .where(
            and(
              eq(libraryReservations.bookId, reservation.bookId),
              eq(libraryReservations.status, "pending")
            )
          )
          .orderBy(asc(libraryReservations.priority), asc(libraryReservations.reservationDate))
          .limit(1)
          .then(rows => rows[0] || null);

        if (nextReservation) {
          await db.update(libraryReservations)
            .set({
              status: "ready",
              notifiedDate: new Date().toISOString(),
              updatedAt: new Date(),
            })
            .where(eq(libraryReservations.id, nextReservation.id));
        }
      }

      logger.info("Reservation cancelled", { reservationId: id, userId: user.id });

      return { reservation: updatedReservation[0] };
    }

    if (action === "fulfill") {
      if (reservation.status !== "ready") {
        return { error: "Can only fulfill reservations that are in 'ready' status", status: 400 };
      }

      const [updatedReservation] = await db.update(libraryReservations)
        .set({
          status: "fulfilled",
          fulfilledDate: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(libraryReservations.id, id))
        .returning();

      logger.info("Reservation fulfilled", { reservationId: id, userId: user.id });

      return { reservation: updatedReservation[0] };
    }

    if (action === "expire") {
      if (reservation.status !== "pending" && reservation.status !== "ready") {
        return { error: "Can only expire pending or ready reservations", status: 400 };
      }

      const [updatedReservation] = await db.update(libraryReservations)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(libraryReservations.id, id))
        .returning();

      // Notify next person in queue
      const nextReservation = await db
        .select()
        .from(libraryReservations)
        .where(
          and(
            eq(libraryReservations.bookId, reservation.bookId),
            eq(libraryReservations.status, "pending")
          )
        )
        .orderBy(asc(libraryReservations.priority), asc(libraryReservations.reservationDate))
        .limit(1)
        .then(rows => rows[0] || null);

      if (nextReservation) {
        await db.update(libraryReservations)
          .set({
            status: "ready",
            notifiedDate: new Date().toISOString(),
            updatedAt: new Date(),
          })
          .where(eq(libraryReservations.id, nextReservation.id));
      }

      logger.info("Reservation expired", { reservationId: id, userId: user.id });

      return { reservation: updatedReservation[0] };
    }

    return { error: "Invalid action", status: 400 };
  },
  ['admin', 'school-admin', 'student', 'teacher']
);

// DELETE /api/library/reservations - Delete reservation
export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "Reservation ID is required", status: 400 };
    }

    const deletedReservation = await db
      .delete(libraryReservations)
      .where(eq(libraryReservations.id, id))
      .returning();

    if (deletedReservation.length === 0) {
      return { error: "Reservation not found", status: 404 };
    }

    logger.info("Reservation deleted", { reservationId: id, userId: user.id });

    return { message: "Reservation deleted successfully" };
  },
  ['admin', 'school-admin']
);
