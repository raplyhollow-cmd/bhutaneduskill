/**
 * SCHOOL ADMIN FEE STRUCTURES API
 *
 * GET /api/school-admin/fees/structures - List fee structures
 * POST /api/school-admin/fees/structures - Create fee structure
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { feeStructures, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { logFeeModified } from "@/lib/audit-log";

const feeStructureSchema = z.object({
  name: z.string().min(1),
  grade: z.number(),
  academicYear: z.string(),
  fees: z.array(z.object({
    id: z.string(),
    name: z.string(),
    amount: z.number(),
    frequency: z.enum(["monthly", "quarterly", "semester", "annual", "one_time"]),
    isOptional: z.number(),
    dueDate: z.string().optional(),
  })),
  totalAnnualAmount: z.number(),
  applicableScholarships: z.array(z.string()).optional(),
});

// ============================================================================
// GET /api/school-admin/fees/structures - List fee structures
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");
    const academicYear = searchParams.get("academicYear");

    const currentUser = user;

    const structures = await db.query.feeStructures.findMany({
      orderBy: [desc(feeStructures.createdAt)],
    });

    return successResponse({ structures });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST /api/school-admin/fees/structures - Create fee structure
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId, user } = auth;

    try {
      const body = await request.json();
      const validatedData = feeStructureSchema.parse(body);

      const currentUser = user;

      // Transform fees data to match schema
      const transformedFees = validatedData.fees.map(fee => ({
        feeType: fee.name,
        amount: fee.amount,
        frequency: fee.frequency,
      }));

      const [newStructure] = await db.insert(feeStructures).values({
        id: `fee_struct_${Date.now()}`,
        schoolId: currentUser.schoolId,
        name: validatedData.name,
        description: "Fee structure",
        academicYear: validatedData.academicYear,
        grade: validatedData.grade,
        totalFees: validatedData.totalAnnualAmount || 0,
        breakdown: transformedFees,
        fees: transformedFees,
        isRecurring: false,
        currency: "BTN",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Log audit event for fee structure creation
      await logFeeModified(
        "created",
        newStructure.id,
        undefined,
        {
          name: newStructure.name,
          grade: newStructure.grade,
          academicYear: newStructure.academicYear,
          totalFees: newStructure.totalFees,
        },
        userId,
        request
      );

      return createdResponse({ structure: newStructure });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.error("Fee structure creation error:", error);
      return errorResponse("Failed to create fee structure", 500);
    }
  },
  ['admin', 'school-admin']
);
