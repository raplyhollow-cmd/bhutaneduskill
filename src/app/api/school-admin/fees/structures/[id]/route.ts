/**
 * SCHOOL ADMIN FEE STRUCTURES BY ID API
 *
 * GET /api/school-admin/fees/structures/[id] - Get structure details
 * PUT /api/school-admin/fees/structures/[id] - Update structure
 * DELETE /api/school-admin/fees/structures/[id] - Delete structure (soft delete)
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { feeStructures, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

interface Params {
  params: Promise<{ id: string }>;
}

// GET /api/school-admin/fees/structures/[id] - Get structure details
export const GET = createApiRoute(
  async (request: NextRequest, auth, context: Params) => {
    const { id } = await context.params;
    const structure = await db
      .select()
      .from(feeStructures)
      .where(eq(feeStructures.id, id))
      .limit(1)
      .then(rows => rows[0]);

    if (!structure) {
      return notFoundResponse("Fee structure");
    }

    return successResponse({ structure });
  },
  ['admin', 'school-admin']
);

// PUT /api/school-admin/fees/structures/[id] - Update structure
export const PUT = createApiRoute(
  async (request: NextRequest, auth, context: Params) => {
    const { user } = auth;

    const body = await request.json();
    const { name, grade, academicYear, fees, totalAnnualAmount, applicableScholarships, isActive } = body;

    const { id } = await context.params;
    const [updated] = await db.update(feeStructures)
      .set({
        ...(name !== undefined && { name }),
        ...(grade !== undefined && { grade }),
        ...(academicYear !== undefined && { academicYear }),
        ...(fees !== undefined && { fees }),
        ...(totalAnnualAmount !== undefined && { totalAnnualAmount }),
        ...(applicableScholarships !== undefined && { applicableScholarships }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(feeStructures.id, id))
      .returning();

    return successResponse({ structure: updated });
  },
  ['admin', 'school-admin']
);

// DELETE /api/school-admin/fees/structures/[id] - Delete structure (soft delete)
export const DELETE = createApiRoute(
  async (request: NextRequest, auth, context: Params) => {
    const { user } = auth;

    const { id } = await context.params;
    await db.update(feeStructures)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(feeStructures.id, id));

    return successResponse({ success: true });
  },
  ['admin', 'school-admin']
);
