import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rubPrograms, rubColleges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * RUB Program Schema (partial for updates)
 */
const programSchema = z.object({
  name: z.string().min(1, "Program name is required").optional(),
  code: z.string().min(1, "Program code is required").optional(),
  collegeId: z.string().min(1, "College is required").optional(),
  level: z.enum(["certificate", "diploma", "bachelor", "master", "phd"]).optional(),
  field: z.enum(["engineering", "arts", "science", "business", "education", "medicine"]).optional(),
  discipline: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1").optional(),
  durationType: z.enum(["years", "semesters", "months"]).optional(),
  totalSeats: z.number().min(0).optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  requiredSubjects: z.array(z.string()).optional(),
  eligibilityCriteria: z.string().optional(),
  tuitionFee: z.number().min(0).optional(),
  hostelFee: z.number().min(0).optional(),
  otherFees: z.number().min(0).optional(),
  description: z.string().optional(),
  careerProspects: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  admissionOpen: z.boolean().optional(),
});

type ProgramInput = z.infer<typeof programSchema>;

// Interface for route params
interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/admin/content/programs/[id] - Update RUB program (partial update)
export async function PATCH(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const params = await context.params;
  const id = params.id;

  try {
    const body = await request.json();
    const validatedData = programSchema.parse(body);

    // Check if program exists
    const existing = await db.query.rubPrograms.findFirst({
      where: eq(rubPrograms.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Program not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // If collegeId is being updated, verify it exists
    if (validatedData.collegeId) {
      const college = await db.query.rubColleges.findFirst({
        where: eq(rubColleges.id, validatedData.collegeId),
      });

      if (!college) {
        return NextResponse.json(
          { error: "College not found", status: 404 } satisfies ApiErrorResponse,
          { status: 404 }
        );
      }
    }

    // Recalculate total fee if fee fields are provided
    let updateData: any = { ...validatedData };

    if (validatedData.tuitionFee !== undefined ||
        validatedData.hostelFee !== undefined ||
        validatedData.otherFees !== undefined) {
      const tuitionFee = validatedData.tuitionFee ?? existing.tuitionFee ?? 0;
      const hostelFee = validatedData.hostelFee ?? existing.hostelFee ?? 0;
      const otherFees = validatedData.otherFees ?? existing.otherFees ?? 0;
      updateData.totalFee = tuitionFee + hostelFee + otherFees;
    }

    // Handle eligibilityCriteria - if it's a string in the form, parse it to JSON
    if (validatedData.eligibilityCriteria !== undefined) {
      if (typeof validatedData.eligibilityCriteria === 'string') {
        try {
          updateData.eligibilityCriteria = JSON.parse(validatedData.eligibilityCriteria);
        } catch {
          updateData.eligibilityCriteria = { criteria: validatedData.eligibilityCriteria };
        }
      }
    }

    const [updatedProgram] = await db.update(rubPrograms)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(rubPrograms.id, id))
      .returning();

    logger.info("Program updated", { programId: id, userId });

    // Return in the format the frontend expects
    return NextResponse.json({
      program: updatedProgram,
      message: "Program updated successfully"
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: `/api/admin/content/programs/${id}`, method: "PATCH", userId });
    return NextResponse.json(
      { error: "Failed to update program", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content/programs/[id] - Delete RUB program
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;
  const params = await context.params;
  const id = params.id;

  try {
    // Check if program exists
    const existing = await db.query.rubPrograms.findFirst({
      where: eq(rubPrograms.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Program not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    await db.delete(rubPrograms).where(eq(rubPrograms.id, id));

    logger.info("Program deleted", { programId: id, userId });

    return NextResponse.json({
      success: true,
      message: "Program deleted successfully"
    });
  } catch (error) {
    logger.apiError(error, { route: `/api/admin/content/programs/${id}`, method: "DELETE", userId });
    return NextResponse.json(
      { error: "Failed to delete program", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
