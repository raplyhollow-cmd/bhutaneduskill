/**
 * POST /api/admin/schools/[id]/generate-fees
 *
 * Bulk generate annual/termly fee invoices for all students in a school.
 *
 * Access: Platform Admin (any school) or School Admin (own school only)
 *
 * Fee frequency by school type:
 * - Government (public): 1x/year (February - Annual SDF)
 * - Private: 2x/year (February + July)
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { schools, users, students, studentFees } from "@/lib/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";

interface GenerateFeesRequest {
  sessionYear: string; // e.g., "2026"
  feeBreakdown: Array<{
    feeType: string; // "sdf", "rimdro", "diary", "sports", "tuition", etc.
    amount: number;
    description: string;
  }>;
  term?: "annual" | "term1" | "term2"; // For private schools
  dueDate?: string; // Optional custom due date
  notifyParents?: boolean; // Send SMS/email notifications
}

interface FeeBreakdownItem {
  feeType: string;
  amount: number;
  description: string;
}

export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { id: schoolId } = await (context?.params || {});
    const { userId, user } = auth;
    const body = await req.json() as GenerateFeesRequest;

    // Validate required fields
    if (!body.sessionYear) {
      return { error: "sessionYear is required", status: 400 };
    }

    if (!body.feeBreakdown || body.feeBreakdown.length === 0) {
      return { error: "feeBreakdown is required with at least one item", status: 400 };
    }

    // Validate school access
    const schoolResult = await db
      .select({
        id: schools.id,
        name: schools.name,
        type: schools.type,
        schoolType: schools.schoolType,
      })
      .from(schools)
      .where(eq(schools.id, schoolId))
      .limit(1);
    const school = schoolResult[0];

    if (!school) {
      return { error: "School not found", status: 404 };
    }

    // Check if school admin is trying to access a different school
    if (user.type === 'school-admin') {
      if (user.schoolId !== schoolId) {
        logger.security("unauthorized_fee_generation_attempt", {
          userId,
          schoolId,
          userSchoolId: user.schoolId,
        });
        return { error: "You can only generate fees for your own school", status: 403 };
      }
    }

    logger.info("Starting fee generation", {
      route: "/api/admin/schools/[id]/generate-fees",
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
      return {
        data: {
          success: true,
          message: "No active students found in this school",
          generated: 0,
          skipped: 0,
        }
      };
    }

    // Get user IDs for students
    const studentUserIds = studentRecords.map(s => s.userId);

    // Fetch user details
    const studentUsers = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        name: users.name,
      })
      .from(users)
      .where(inArray(users.id, studentUserIds));

    const userMap = new Map(studentUsers.map(u => [u.id, u]));

    // Determine fee frequency and due date based on school type
    const isGovernment = school.type === 'public' || school.schoolType === 'public';
    const frequency = isGovernment ? 'yearly' : 'yearly'; // Both yearly, but private has 2 terms

    // Default due date: February 15 for annual, or custom
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

        // For private schools with terms, generate separate fee records per term
        // For government schools, generate single annual record
        const terms = isGovernment ? ['annual'] : [body.term || 'annual'];

        for (const term of terms) {
          // Create individual fee record for each breakdown item
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
              frequency: isGovernment ? 'yearly' : 'yearly',
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

    logger.info("Fee generation completed", {
      route: "/api/admin/schools/[id]/generate-fees",
      userId,
      schoolId,
      generated,
      skipped,
      totalAmount,
    });

    return {
      data: {
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
      }
    };
  },
  ["admin", "school-admin"]
);

// GET endpoint to retrieve current fee generation status for a school
export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { id: schoolId } = await (context?.params || {});
    const { user } = auth;

    // Validate school access
    const schoolResult = await db
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
      .limit(1);
    const school = schoolResult[0];

    if (!school) {
      return { error: "School not found", status: 404 };
    }

    // Check if school admin is trying to access a different school
    if (user.type === 'school-admin' && user.schoolId !== schoolId) {
      return { error: "You can only view fee status for your own school", status: 403 };
    }

    // Count active students
    const studentCount = await db
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

    return {
      data: {
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
          active: studentCount.length,
        },
        fees: {
          totalGenerated,
          totalAmount,
          totalPaid,
          totalPending: totalAmount - totalPaid,
          paymentRate: totalAmount > 0 ? Math.round((totalPaid / totalAmount) * 100) : 0,
        },
      }
    };
  },
  ["admin", "school-admin"]
);
