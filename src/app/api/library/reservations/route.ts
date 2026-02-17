import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { books } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// ============================================================================
// LIBRARY RESERVATIONS API
// ============================================================================

// In-memory storage for reservations (can be migrated to database table later)
// TODO: Add reservations table to schema and use database operations
const reservationsData: Array<{
  id: string;
  bookId: string;
  requesterId: string;
  requesterType: string;
  requesterName: string;
  reservationDate: string;
  expiryDate: string;
  status: "pending" | "ready" | "fulfilled" | "cancelled" | "expired";
  priority: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}> = [];

const RESERVATION_DAYS = 7; // How long to hold reserved books

/**
 * GET /api/library/reservations
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const filterUserId = searchParams.get('userId');
    const status = searchParams.get('status');
    const bookId = searchParams.get('bookId');

    // Build query conditions
    let filteredReservations = reservationsData;

    // Students and teachers can only see their own reservations
    if (user.type === 'student' || user.type === 'teacher') {
      filteredReservations = filteredReservations.filter(r => r.requesterId === userId);
    } else if (filterUserId) {
      filteredReservations = filteredReservations.filter(r => r.requesterId === filterUserId);
    }

    if (status) {
      filteredReservations = filteredReservations.filter(r => r.status === status);
    }

    if (bookId) {
      filteredReservations = filteredReservations.filter(r => r.bookId === bookId);
    }

    // Get book details for each reservation
    const reservationsWithBooks = await Promise.all(
      filteredReservations.map(async (reservation) => {
        const [book] = await db
          .select({
            id: books.id,
            title: books.title,
            author: books.author,
            isbn: books.isbn,
            coverImage: books.coverImage,
            status: books.status,
          })
          .from(books)
          .where(eq(books.id, reservation.bookId))
          .limit(1);

        return {
          ...reservation,
          book: book || null,
        };
      })
    );

    logger.info("Library reservations fetched", { userId, count: reservationsWithBooks.length });

    return NextResponse.json({
      success: true,
      data: {
        reservations: reservationsWithBooks,
        total: reservationsWithBooks.length
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/reservations", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/library/reservations
 *
 * Create a new reservation
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { bookId, notes } = body;

    if (!bookId) {
      return NextResponse.json(
        { success: false, error: "Book ID is required" },
        { status: 400 }
      );
    }

    // Check if book exists
    const [book] = await db
      .select()
      .from(books)
      .where(eq(books.id, bookId))
      .limit(1);

    if (!book) {
      return NextResponse.json(
        { success: false, error: "Book not found" },
        { status: 404 }
      );
    }

    // Check if user already has an active reservation for this book
    const existingReservation = reservationsData.find(
      r => r.bookId === bookId && r.requesterId === userId && !['fulfilled', 'cancelled', 'expired'].includes(r.status)
    );

    if (existingReservation) {
      return NextResponse.json(
        { success: false, error: "You already have an active reservation for this book" },
        { status: 400 }
      );
    }

    // Create reservation
    const now = new Date();
    const expiryDate = new Date(now);
    expiryDate.setDate(expiryDate.getDate() + RESERVATION_DAYS);

    const reservation = {
      id: `res_${nanoid()}`,
      bookId,
      requesterId: userId,
      requesterType: user.type,
      requesterName: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
      reservationDate: now.toISOString(),
      expiryDate: expiryDate.toISOString(),
      status: 'pending' as const,
      priority: user.type === 'teacher' ? 1 : 0, // Teachers get higher priority
      notes,
      createdAt: now,
      updatedAt: now,
    };

    reservationsData.push(reservation);

    logger.info("Book reserved", { userId, bookId, reservationId: reservation.id });

    return NextResponse.json({
      success: true,
      data: {
        reservation,
        message: `Book reserved successfully. You will be notified when it's available. Reservation expires on ${expiryDate.toLocaleDateString()}.`
      }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/reservations", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to create reservation" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/library/reservations
 *
 * Update or cancel a reservation
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const reservationIndex = reservationsData.findIndex(r => r.id === id);

    if (reservationIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservation = reservationsData[reservationIndex];

    // Check ownership (students/teachers can only cancel their own reservations)
    if ((user.type === 'student' || user.type === 'teacher') && reservation.requesterId !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only manage your own reservations" },
        { status: 403 }
      );
    }

    if (action === 'cancel') {
      reservationsData[reservationIndex] = {
        ...reservation,
        status: 'cancelled',
        cancellationReason: 'Cancelled by user',
        updatedAt: new Date(),
      } as any;

      logger.info("Reservation cancelled", { userId, reservationId: id });

      return NextResponse.json({
        success: true,
        data: {
          reservation: reservationsData[reservationIndex],
          message: "Reservation cancelled successfully"
        }
      });

    } else if (action === 'fulfill') {
      // Only admins can fulfill reservations
      if (user.type !== 'admin' && user.type !== 'school-admin') {
        return NextResponse.json(
          { success: false, error: "Only administrators can fulfill reservations" },
          { status: 403 }
        );
      }

      reservationsData[reservationIndex] = {
        ...reservation,
        status: 'fulfilled',
        updatedAt: new Date(),
      };

      logger.info("Reservation fulfilled", { userId, reservationId: id });

      return NextResponse.json({
        success: true,
        data: {
          reservation: reservationsData[reservationIndex],
          message: "Reservation fulfilled successfully"
        }
      });

    } else {
      return NextResponse.json(
        { success: false, error: "Invalid action. Use: cancel or fulfill" },
        { status: 400 }
      );
    }
  } catch (error) {
    logger.apiError(error, { route: "/api/library/reservations", method: "PATCH" });
    return NextResponse.json(
      { success: false, error: "Failed to update reservation" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/library/reservations
 */
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(['student', 'teacher', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Reservation ID is required" },
        { status: 400 }
      );
    }

    const reservationIndex = reservationsData.findIndex(r => r.id === id);

    if (reservationIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Reservation not found" },
        { status: 404 }
      );
    }

    const reservation = reservationsData[reservationIndex];

    // Check ownership (students/teachers can only delete their own reservations)
    if ((user.type === 'student' || user.type === 'teacher') && reservation.requesterId !== userId) {
      return NextResponse.json(
        { success: false, error: "You can only delete your own reservations" },
        { status: 403 }
      );
    }

    reservationsData.splice(reservationIndex, 1);

    logger.info("Reservation deleted", { userId, reservationId: id });

    return NextResponse.json({
      success: true,
      data: { id }
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/library/reservations", method: "DELETE" });
    return NextResponse.json(
      { success: false, error: "Failed to delete reservation" },
      { status: 500 }
    );
  }
}
