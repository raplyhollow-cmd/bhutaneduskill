import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { libraryReservations, books, users, libraryMembers } from "@/lib/db/schema";
import { eq, and, sql, desc, or } from "drizzle-orm";
import { z } from "zod";

// Reservation expires after 7 days
const RESERVATION_EXPIRY_DAYS = 7;

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
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
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
      conditions.push(eq(libraryReservations.status, status as any));
    }

    if (bookId) {
      conditions.push(eq(libraryReservations.bookId, bookId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const reservations = await db.query.libraryReservations.findMany({
      where: whereClause,
      with: {
        book: {
          columns: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            category: true,
            coverImage: true,
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
            type: true,
            email: true,
          },
        },
      },
      orderBy: [libraryReservations.priority, libraryReservations.reservationDate],
    });

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
    const updatedReservations = await db.query.libraryReservations.findMany({
      where: whereClause,
      with: {
        book: {
          columns: {
            id: true,
            title: true,
            author: true,
            isbn: true,
            category: true,
            coverImage: true,
          },
        },
        user: {
          columns: {
            id: true,
            name: true,
            type: true,
            email: true,
          },
        },
      },
      orderBy: [libraryReservations.priority, libraryReservations.reservationDate],
    });

    return NextResponse.json({
      success: true,
      data: {
        reservations: updatedReservations,
        stats: {
          total: updatedReservations.length,
          pending: updatedReservations.filter((r) => r.status === "pending").length,
          ready: updatedReservations.filter((r) => r.status === "ready").length,
          fulfilled: updatedReservations.filter((r) => r.status === "fulfilled").length,
          expired: updatedReservations.filter((r) => r.status === "expired").length,
        },
      },
    });
  } catch (error) {
    logger.error("Reservations fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

// POST /api/library/reservations - Create book reservation
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const validatedData = reservationSchema.parse(body);

    // Check if book exists
    const book = await db.query.books.findFirst({
      where: eq(books.id, validatedData.bookId),
    });

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    // Don't allow reservation if book is available
    if (book.status === "available") {
      return NextResponse.json(
        { success: false, error: "Book is currently available for borrowing" },
        { status: 400 }
      );
    }

    // Check if user has active library membership
    const member = await db.query.libraryMembers.findFirst({
      where: and(
        eq(libraryMembers.userId, user.id),
        eq(libraryMembers.schoolId, user.schoolId || ""),
        eq(libraryMembers.membershipStatus, "active")
      ),
    });

    if (!member) {
      return NextResponse.json(
        { success: false, error: "You must have an active library membership to reserve books" },
        { status: 400 }
      );
    }

    // Check if user already has a pending/ready reservation for this book
    const existingReservation = await db.query.libraryReservations.findFirst({
      where: and(
        eq(libraryReservations.userId, user.id),
        eq(libraryReservations.bookId, validatedData.bookId),
        or(
          eq(libraryReservations.status, "pending"),
          eq(libraryReservations.status, "ready")
        )
      ),
    });

    if (existingReservation) {
      return NextResponse.json(
        { success: false, error: "You already have an active reservation for this book" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        reservation: newReservation,
        message: queuePosition > 1
          ? `Book reserved successfully. You are position #${queuePosition} in the queue.`
          : "Book reserved successfully. You will be notified when it's available.",
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Reservation creation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

// PATCH /api/library/reservations - Update reservation (cancel, fulfill, expire)
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin', 'student', 'teacher']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const body = await request.json();
    const validatedData = updateReservationSchema.parse(body);

    const { id, action, cancellationReason } = validatedData;

    // Get existing reservation
    const reservation = await db.query.libraryReservations.findFirst({
      where: eq(libraryReservations.id, id),
      with: {
        book: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Students/teachers can only cancel their own reservations
    if (action === "cancel" && reservation.userId !== user.id && user.type !== 'admin' && user.type !== 'school-admin') {
      return NextResponse.json(
        { success: false, error: "You can only cancel your own reservations" },
        { status: 403 }
      );
    }

    // Only school-admin can fulfill or expire reservations
    if ((action === "fulfill" || action === "expire") && user.type !== 'admin' && user.type !== 'school-admin') {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    if (action === "cancel") {
      if (reservation.status === "fulfilled" || reservation.status === "cancelled") {
        return NextResponse.json(
          { success: false, error: "Cannot cancel a fulfilled or already cancelled reservation" },
          { status: 400 }
        );
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
        const nextReservation = await db.query.libraryReservations.findFirst({
          where: and(
            eq(libraryReservations.bookId, reservation.bookId),
            eq(libraryReservations.status, "pending")
          ),
          orderBy: [libraryReservations.priority, libraryReservations.reservationDate],
        });

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

      return NextResponse.json({
        success: true,
        data: { reservation: updatedReservation[0] },
      });
    }

    if (action === "fulfill") {
      if (reservation.status !== "ready") {
        return NextResponse.json(
          { success: false, error: "Can only fulfill reservations that are in 'ready' status" },
          { status: 400 }
        );
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

      return NextResponse.json({
        success: true,
        data: { reservation: updatedReservation[0] },
      });
    }

    if (action === "expire") {
      if (reservation.status !== "pending" && reservation.status !== "ready") {
        return NextResponse.json(
          { success: false, error: "Can only expire pending or ready reservations" },
          { status: 400 }
        );
      }

      const [updatedReservation] = await db.update(libraryReservations)
        .set({
          status: "expired",
          updatedAt: new Date(),
        })
        .where(eq(libraryReservations.id, id))
        .returning();

      // Notify next person in queue
      const nextReservation = await db.query.libraryReservations.findFirst({
        where: and(
          eq(libraryReservations.bookId, reservation.bookId),
          eq(libraryReservations.status, "pending")
        ),
        orderBy: [libraryReservations.priority, libraryReservations.reservationDate],
      });

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

      return NextResponse.json({
        success: true,
        data: { reservation: updatedReservation[0] },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    logger.error("Reservation update error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

// DELETE /api/library/reservations - Delete reservation
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const deletedReservation = await db
      .delete(libraryReservations)
      .where(eq(libraryReservations.id, id))
      .returning();

    if (deletedReservation.length === 0) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    logger.info("Reservation deleted", { reservationId: id, userId: user.id });

    return NextResponse.json({
      success: true,
      data: { message: "Reservation deleted successfully" },
    });
  } catch (error) {
    logger.error("Reservation deletion error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
