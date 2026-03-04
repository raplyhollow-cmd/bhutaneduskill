import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { academicYears } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

interface DeleteResponse {
  success: true;
}

interface AcademicYearResponse {
  academicYear: unknown;
}

interface AcademicYearUpdateRequest {
  isActive?: boolean;
  name?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// DELETE - Remove an academic year
// ============================================================================

export const DELETE = createApiRoute<{ id: string }, DeleteResponse>(
  async (req, { user }, context) => {
    if (!user.schoolId) {
      return { error: "School not found for user", status: 404 };
    }

    const { id } = await context!.params;

    // Verify the academic year belongs to the user's school
    const [academicYear] = await db
      .select()
      .from(academicYears)
      .where(and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, user.schoolId)
      ))
      .limit(1);

    if (!academicYear) {
      return { error: "Academic year not found", status: 404 };
    }

    // Delete the academic year
    await db.delete(academicYears)
      .where(eq(academicYears.id, id));

    return { data: { success: true } };
  },
  ['school-admin', 'admin']
);

// ============================================================================
// PATCH - Update an academic year (e.g., set as active)
// ============================================================================

export const PATCH = createApiRoute<{ id: string }, AcademicYearResponse>(
  async (req, { user }, context) => {
    if (!user.schoolId) {
      return { error: "School not found for user", status: 404 };
    }

    const { id } = await context!.params;
    const body: AcademicYearUpdateRequest = await req.json();

    // Verify the academic year belongs to the user's school
    const [academicYear] = await db
      .select()
      .from(academicYears)
      .where(and(
        eq(academicYears.id, id),
        eq(academicYears.schoolId, user.schoolId)
      ))
      .limit(1);

    if (!academicYear) {
      return { error: "Academic year not found", status: 404 };
    }

    // If setting as active, deactivate all others
    if (body.isActive === true) {
      await db.update(academicYears)
        .set({ isActive: false })
        .where(eq(academicYears.schoolId, user.schoolId));
    }

    // Update the academic year
    const [updated] = await db.update(academicYears)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(academicYears.id, id))
      .returning();

    return { data: { academicYear: updated } };
  },
  ['school-admin', 'admin']
);
