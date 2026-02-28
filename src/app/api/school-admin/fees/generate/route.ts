/**
 * POST /api/school-admin/fees/generate
 *
 * School Admin API for generating annual/termly fee invoices.
 * Restricted to the school admin's own school.
 *
 * This API uses the same logic as the admin API but restricts access
 * to the school admin's own school based on their user.schoolId.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, badRequestResponse, notFoundResponse, errorResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, students, studentFees } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

interface GenerateFeesRequest {
  sessionYear: string;
  feeBreakdown: Array<{
    feeType: string;
    amount: number;
    description: string;
  }>;
  term?: "annual" | "term1" | "term2";
  dueDate?: string;
  notifyParents?: boolean;
}

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    const schoolId = user.schoolId;
    const body = await request.json() as GenerateFeesRequest;

    // Validate required fields
    if (!body.sessionYear) {
      return badRequestResponse("sessionYear is required");
    }

    if (!body.feeBreakdown || body.feeBreakdown.length === 0) {
      return badRequestResponse("feeBreakdown is required with at least one item");
    }

    // Validate school exists
    const school = await db
      .select({
        id: schools.id,
        name: schools.name,
        type: schools.type,
        schoolType: schools.schoolType,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1)
      .then(rows => rows[0]);

    if (!school) {
      return notFoundResponse("School not found");
    }

    logger.info("School admin starting fee generation", {
      route: "/api/school-admin/fees/generate",
      userId,
      schoolId,
      sessionYear: body.sessionYear,
      schoolType: school.schoolType,
    });

    // Get all active students for this school
    const studentRecords = await db
      .select({
        id: students.id,
        userId: students.userId,
      })
      .from(students)
      .where(and(
        eq(students.schoolId, schoolId),
        eq(students.status, "active")
      ));

    if (studentRecords.length === 0) {
      return successResponse({
        message: "No active students found in this school",
        generated: 0,
        skipped: 0,
      });
    }

    // Get user IDs for students
    const studentUserIds = studentRecords.map(s => s.userId);

    // Fetch user details - using IN clause for batch lookup
    const studentUsers = studentUserIds.length > 0
      ? await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            name: users.name,
          })
          .from(users)
          .where(sql`${users.id} = ANY(${studentUserIds})`)
      : [];

    const userMap = new Map(studentUsers.map(u => [u.id, u]));

    // Determine fee frequency and due date based on school type
    const isGovernment = school.type === 'public' || school.schoolType === 'public';
    const defaultDueDate = body.dueDate || `${body.sessionYear}-02-15`;

    // Calculate total amount
    const totalAmount = body.feeBreakdown.reduce((sum, item) => sum + item.amount, 0);

    // Generate fee records for each student
    let generated = 0;
    let skipped = 0;
    const errors: string[] = [];
    const feeIds: string[] = [];

    for (const studentRecord of studentRecords) {
      try {
        const studentUser = userMap.get(studentRecord.userId);
        if (!studentUser) {
          skipped++;
          continue;
        }

        const terms = isGovernment ? ['annual'] : [body.term || 'annual'];

        for (const term of terms) {
          for (const feeItem of body.feeBreakdown) {
            const feeId = `fee-${nanoid()}`;

            await db.insert(studentFees).values({
              id: feeId,
              studentId: studentRecord.userId,
              feeType: feeItem.feeType,
              amount: feeItem.amount,
              totalAmount: feeItem.amount,
              amountPaid: 0,
              amountPending: feeItem.amount,
              amountWaived: 0,
              currency: "BTN",
              frequency: 'yearly',
              dueDate: defaultDueDate,
              year: parseInt(body.sessionYear),
              status: "pending",
              isRecurring: false,
              description: `${feeItem.description} - ${body.sessionYear} ${term !== 'annual' ? `(${term})` : ''}`,
              schoolId: schoolId,
              notes: term !== 'annual' ? `Term: ${term}` : null,
              createdAt: new Date(),
              updatedAt: new Date(),
            });

            feeIds.push(feeId);
          }
        }

        generated++;
      } catch (error) {
        logger.error("Failed to generate fee for student", {
          studentId: studentRecord.id,
          error,
        });
        skipped++;
        errors.push(`Failed for student ${studentRecord.id}`);
      }
    }

    // Update school's fee generation status
    await db.update(schools)
      .set({
        currentSessionYear: body.sessionYear,
        feeGenerationDate: new Date().toISOString(),
        feeGenerationStatus: "generated",
        updatedAt: new Date(),
      })
      .where(eq(schools.id, schoolId));

    logger.info("School admin fee generation completed", {
      route: "/api/school-admin/fees/generate",
      userId,
      schoolId,
      generated,
      skipped,
      totalAmount,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully generated fees for ${generated} students`,
      generated,
      skipped,
      totalFees: feeIds.length,
      totalAmount: totalAmount * generated,
      errors: errors.length > 0 ? errors : undefined,
      sessionYear: body.sessionYear,
      schoolName: school.name,
      schoolType: school.type,
    });
  },
  ['school-admin']
);

// GET endpoint to retrieve current fee generation status
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    const schoolId = user.schoolId;

    // Get school data
    const school = await db
      .select({
        id: schools.id,
        name: schools.name,
        type: schools.type,
        schoolType: schools.schoolType,
        currentSessionYear: schools.currentSessionYear,
        feeGenerationDate: schools.feeGenerationDate,
        feeGenerationStatus: schools.feeGenerationStatus,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1)
      .then(rows => rows[0]);

    if (!school) {
      return notFoundResponse("School not found");
    }

    // Count active students
    const studentRecords = await db
      .select()
      .from(students)
      .where(and(
        eq(students.schoolId, schoolId),
        eq(students.status, "active")
      ));

    // Get fee summary for current session
    const existingFees = school.currentSessionYear
      ? await db
          .select()
          .from(studentFees)
          .where(and(
            eq(studentFees.schoolId, schoolId),
            eq(studentFees.year, parseInt(school.currentSessionYear))
          ))
      : [];

    const totalGenerated = existingFees.length;
    const totalAmount = existingFees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
    const totalPaid = existingFees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);

    return NextResponse.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        type: school.type,
        schoolType: school.schoolType,
      },
      session: {
        year: school.currentSessionYear,
        generationDate: school.feeGenerationDate,
        status: school.feeGenerationStatus,
      },
      students: {
        active: studentRecords.length,
      },
      fees: {
        totalGenerated,
        totalAmount,
        totalPaid,
        totalPending: totalAmount - totalPaid,
        paymentRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
      },
    });
  },
  ['school-admin']
);
