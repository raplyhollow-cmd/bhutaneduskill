/**
 * LIBRARY FINES API
 *
 * Handles fine management for library books
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { circulation, libraryMembers, users, books } from "@/lib/db/schema";
import { eq, and, sql, desc } from "drizzle-orm";
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

// Helper: Calculate fine for overdue books
function calculateFine(dueDate: string, returnDate: string = new Date().toISOString()): number {
  const due = new Date(dueDate);
  const ret = new Date(returnDate);
  const diffTime = ret.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return 0;
  return diffDays * FINE_RATE_PER_DAY;
}

const payFineSchema = z.object({
  memberId: z.string().optional(),
  circulationId: z.string().optional(),
  amount: z.number().min(0),
  paymentMethod: z.enum(["cash", "online", "waiver"]).default("cash"),
  notes: z.string().optional(),
});

// GET /api/library/fines - Get fines information
export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
    const { searchParams } = new URL(request.url);

    const unpaidOnly = searchParams.get("unpaid") === "true";
    const memberId = searchParams.get("memberId") || "";
    const myFines = searchParams.get("my") === "true";

    // For students/teachers, only show their own fines
    const userIdFilter = (myFines || user.type === 'student' || user.type === 'teacher')
      ? user.id
      : undefined;

    // Get circulation records with fines
    const circulationConditions = [];

    if (userIdFilter) {
      circulationConditions.push(eq(circulation.borrowerId, userIdFilter));
    }

    if (unpaidOnly) {
      circulationConditions.push(sql`${circulation.fine} > ${circulation.finePaid}`);
    }

    const circulationWhereClause = circulationConditions.length > 0
      ? and(...circulationConditions)
      : undefined;

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
        bookTitle: books.title,
        bookAuthor: books.author,
        bookIsbn: books.isbn,
        borrowerName: users.name,
        borrowerType: users.type,
      })
      .from(circulation)
      .leftJoin(books, eq(circulation.bookId, books.id))
      .leftJoin(users, eq(circulation.borrowerId, users.id))
      .where(circulationWhereClause)
      .orderBy(desc(circulation.dueDate));

    // Helper to convert decimal to number
    const toNumberInner = (value: string | number | null | undefined): number => {
      if (typeof value === 'number') return value;
      if (!value) return 0;
      return parseFloat(value as string) || 0;
    };

    // Calculate outstanding fines
    const finesWithCalc = circulationRecords.map((record) => {
      const calculatedFine = record.status === "borrowed"
        ? calculateFine(record.dueDate)
        : toNumberInner(record.fine);

      const totalFine = calculatedFine;
      const paid = record.finePaid ? toNumberInner(record.fine) : 0;
      const outstanding = totalFine - paid;

      return {
        circulationId: record.id,
        bookId: record.bookId,
        bookTitle: record.bookTitle || "Unknown",
        borrowerId: record.borrowerId,
        borrowerName: record.borrowerName || "Unknown",
        dueDate: record.dueDate,
        returnDate: record.returnDate,
        status: record.status,
        totalFine,
        paid,
        outstanding,
        isOverdue: new Date(record.dueDate) < new Date(),
      };
    });

    // Filter out records with no outstanding fines
    const outstandingFines = finesWithCalc.filter((f) => f.outstanding > 0);

    // Group by borrower
    const finesByBorrower = new Map<string, typeof outstandingFines>();
    outstandingFines.forEach((fine) => {
      const existing = finesByBorrower.get(fine.borrowerId) || [];
      finesByBorrower.set(fine.borrowerId, [...existing, fine]);
    });

    // Calculate summary stats
    const totalOutstanding = outstandingFines.reduce((sum, f) => sum + f.outstanding, 0);
    const totalPaid = finesWithCalc.reduce((sum, f) => sum + f.paid, 0);

    // Get library members with fine due
    interface LibraryMemberWithUser {
      id: string;
      userId: string;
      membershipNumber: string;
      fineDue: string;
      membershipStatus: string;
      user?: {
        id: string;
        name: string | null;
        email: string | null;
        type: string;
      };
    }
    let membersWithFines: LibraryMemberWithUser[] = [];
    if (user.type === 'admin' || user.type === 'school-admin') {
      const memberConditions = [];

      if (userIdFilter) {
        memberConditions.push(eq(libraryMembers.userId, userIdFilter));
      } else if (memberId) {
        memberConditions.push(eq(libraryMembers.id, memberId));
      }

      // Use SQL for decimal comparison
      memberConditions.push(sql`${libraryMembers.fineDue} > ${"0"}`);

      const memberWhereClause = memberConditions.length > 0
        ? and(...memberConditions)
        : sql`${libraryMembers.fineDue} > ${"0"}`;

      // Use select instead of query to avoid type issues with relations
      const memberData = await db
        .select({
          id: libraryMembers.id,
          userId: libraryMembers.userId,
          membershipNumber: libraryMembers.membershipNumber,
          fineDue: libraryMembers.fineDue,
          membershipStatus: libraryMembers.membershipStatus,
          userIdCol: users.id,
          userName: users.name,
          userEmail: users.email,
          userType: users.type,
        })
        .from(libraryMembers)
        .leftJoin(users, eq(libraryMembers.userId, users.id))
        .where(memberWhereClause);

      // Map to correct interface
      membersWithFines = memberData.map((m) => ({
        id: m.id,
        userId: m.userId,
        membershipNumber: m.membershipNumber,
        fineDue: m.fineDue,
        membershipStatus: m.membershipStatus,
        user: m.userIdCol ? {
          id: m.userIdCol,
          name: m.userName,
          email: m.userEmail,
          type: m.userType,
        } : undefined,
      }));
    }

    return successResponse({
      fines: outstandingFines,
      membersWithFines,
      summary: {
        totalOutstanding,
        totalPaid,
        overdueBooks: outstandingFines.filter((f) => f.isOverdue).length,
        totalMembersWithFines: membersWithFines.length,
      },
    });
  },
  ['admin', 'school-admin', 'student', 'teacher']
);

// POST /api/library/fines - Pay fines (school-admin only)
export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
    const body = await request.json();
    const validatedData = payFineSchema.parse(body);

    if (!validatedData.memberId && !validatedData.circulationId) {
      return badRequestResponse("Either memberId or circulationId is required");
    }

    let paidAmount = 0;
    interface UpdatedMember {
      id: string;
      fineDue: string;
      userId: string;
    }
    let updatedMember: UpdatedMember | null = null;
    interface UpdatedCirculation {
      id: string;
      finePaid: boolean | null;
      fine: number | null;
    }
    const updatedCirculations: UpdatedCirculation[] = [];

    if (validatedData.circulationId) {
      // Pay fine for specific circulation record
      const circulationRecord = await db.query.circulation.findFirst({
        where: eq(circulation.id, validatedData.circulationId),
      });

      if (!circulationRecord) {
        return notFoundResponse("Circulation record");
      }

      const calculatedFine = circulationRecord.status === "borrowed"
        ? calculateFine(circulationRecord.dueDate)
        : circulationRecord.fine;

      const totalFine = calculatedFine;
      const alreadyPaid = circulationRecord.finePaid ? circulationRecord.fine : 0;
      const outstanding = totalFine - alreadyPaid;

      if (outstanding <= 0) {
        return badRequestResponse("No outstanding fine for this record");
      }

      const paymentAmount = Math.min(validatedData.amount, outstanding);
      paidAmount = paymentAmount;

      const newFinePaid = alreadyPaid + paymentAmount;
      const isFullyPaid = newFinePaid >= totalFine;

      const [updatedCirculation] = await db.update(circulation)
        .set({
          finePaid: isFullyPaid,
          fine: isFullyPaid ? totalFine : circulationRecord.fine,
          updatedAt: new Date(),
        })
        .where(eq(circulation.id, validatedData.circulationId))
        .returning();

      updatedCirculations.push(updatedCirculation);

      // Update member's fine due
      const member = await db.query.libraryMembers.findFirst({
        where: eq(libraryMembers.userId, circulationRecord.borrowerId),
      });

      if (member) {
        const currentFineDue = toNumber(member.fineDue);
        const newFineDue = Math.max(0, currentFineDue - paymentAmount);

        const [updated] = await db.update(libraryMembers)
          .set({
            fineDue: newFineDue.toString(),
            updatedAt: new Date(),
          })
          .where(eq(libraryMembers.id, member.id))
          .returning();

        updatedMember = updated;
      }
    } else if (validatedData.memberId) {
      // Pay fines for member (all outstanding)
      const member = await db.query.libraryMembers.findFirst({
        where: eq(libraryMembers.id, validatedData.memberId),
      });

      if (!member) {
        return notFoundResponse("Library member");
      }

      const currentFineDue = toNumber(member.fineDue);
      if (currentFineDue <= 0) {
        return badRequestResponse("No outstanding fines for this member");
      }

      const paymentAmount = Math.min(validatedData.amount, currentFineDue);
      paidAmount = paymentAmount;
      const newFineDue = currentFineDue - paymentAmount;

      const [updated] = await db.update(libraryMembers)
        .set({
          fineDue: newFineDue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.id, validatedData.memberId))
        .returning();

      updatedMember = updated;

      // Mark all circulation fines as paid if fully paid
      if (newFineDue === 0) {
        const circulationRecords = await db.query.circulation.findMany({
          where: eq(circulation.borrowerId, member.userId),
        });

        for (const record of circulationRecords) {
          if (record.fine > 0 && !record.finePaid) {
            const [updatedCirc] = await db.update(circulation)
              .set({
                finePaid: true,
                updatedAt: new Date(),
              })
              .where(eq(circulation.id, record.id))
              .returning();

            updatedCirculations.push(updatedCirc);
          }
        }
      }
    }

    logger.info("Fine payment recorded", {
      amount: paidAmount,
      paymentMethod: validatedData.paymentMethod,
      userId: user.id,
    });

    return successResponse({
      paidAmount,
      remainingBalance: updatedMember ? toNumber(updatedMember.fineDue) : 0,
      member: updatedMember,
      circulations: updatedCirculations,
      message: `Payment of Nu. ${paidAmount} recorded successfully`,
    });
  },
  ['admin', 'school-admin']
);

// PATCH /api/library/fines - Update fine records (school-admin only)
export const PATCH = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { user } = auth;
    const body = await request.json();
    const { circulationId, waiveAmount, reason } = body;

    if (!circulationId) {
      return badRequestResponse("Circulation ID is required");
    }

    // Get circulation record
    const circulationRecord = await db.query.circulation.findFirst({
      where: eq(circulation.id, circulationId),
    });

    if (!circulationRecord) {
      return notFoundResponse("Circulation record");
    }

    const calculatedFine = circulationRecord.status === "borrowed"
      ? calculateFine(circulationRecord.dueDate)
      : circulationRecord.fine;

    const totalFine = calculatedFine;
    const waiveAmt = waiveAmount || totalFine;

    // Waive fine by marking as paid
    const [updatedCirculation] = await db.update(circulation)
      .set({
        finePaid: true,
        fine: totalFine,
        updatedAt: new Date(),
      })
      .where(eq(circulation.id, circulationId))
      .returning();

    // Update member's fine due
    const member = await db.query.libraryMembers.findFirst({
      where: eq(libraryMembers.userId, circulationRecord.borrowerId),
    });

    if (member) {
      const currentFineDue = toNumber(member.fineDue);
      const newFineDue = Math.max(0, currentFineDue - waiveAmt);

      await db.update(libraryMembers)
        .set({
          fineDue: newFineDue.toString(),
          updatedAt: new Date(),
        })
        .where(eq(libraryMembers.id, member.id));
    }

    logger.info("Fine waived", {
      circulationId,
      waiveAmount: waiveAmt,
      reason,
      userId: user.id,
    });

    return successResponse({
      circulation: updatedCirculation,
      waivedAmount: waiveAmt,
      message: `Fine of Nu. ${waiveAmt} waived successfully`,
    });
  },
  ['admin', 'school-admin']
);
