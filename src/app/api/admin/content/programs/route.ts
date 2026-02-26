import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rubPrograms, rubColleges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * RUB Program Schema
 * Matches the form data structure from admin/content/programs/page.tsx
 * and the database schema from rub-schema.ts
 */
const programSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  code: z.string().min(1, "Program code is required"),
  collegeId: z.string().min(1, "College is required"),
  level: z.enum(["certificate", "diploma", "bachelor", "master", "phd"]),
  field: z.enum(["engineering", "arts", "science", "business", "education", "medicine"]),
  discipline: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1"),
  durationType: z.enum(["years", "semesters", "months"]),
  totalSeats: z.number().min(0).optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  requiredSubjects: z.array(z.string()).optional(),
  eligibilityCriteria: z.string().optional(),
  tuitionFee: z.number().min(0).optional(),
  hostelFee: z.number().min(0).optional(),
  otherFees: z.number().min(0).optional(),
  description: z.string().optional(),
  careerProspects: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  admissionOpen: z.boolean().default(false),
});

type ProgramInput = z.infer<typeof programSchema>;

// GET /api/admin/content/programs - List RUB programs
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const collegeId = searchParams.get("collegeId");

    const programs = await db.query.rubPrograms.findMany({
      where: collegeId ? eq(rubPrograms.collegeId, collegeId) : undefined,
      with: {
        college: true,
      },
    });

    logger.info("Programs fetched", { userId, count: programs.length });

    // Return in the format the frontend expects
    return NextResponse.json({ data: { programs } } satisfies ApiSuccess<{ programs: typeof programs }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/programs", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch programs", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/admin/content/programs - Add RUB program
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const body = await request.json();
    const validatedData = programSchema.parse(body);

    // Verify college exists
    const college = await db.query.rubColleges.findFirst({
      where: eq(rubColleges.id, validatedData.collegeId),
    });

    if (!college) {
      return NextResponse.json(
        { error: "College not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const programId = `prog_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

    // Calculate total fee
    const totalFee = (validatedData.tuitionFee || 0) +
                     (validatedData.hostelFee || 0) +
                     (validatedData.otherFees || 0);

    const [newProgram] = await db.insert(rubPrograms).values({
      id: programId,
      collegeId: validatedData.collegeId,
      name: validatedData.name,
      code: validatedData.code,
      level: validatedData.level,
      field: validatedData.field,
      discipline: validatedData.discipline || null,
      duration: validatedData.duration,
      durationType: validatedData.durationType,
      totalSeats: validatedData.totalSeats || null,
      minPercentage: validatedData.minPercentage || null,
      requiredSubjects: validatedData.requiredSubjects || [],
      eligibilityCriteria: validatedData.eligibilityCriteria ? JSON.parse(validatedData.eligibilityCriteria) : null,
      tuitionFee: validatedData.tuitionFee || null,
      hostelFee: validatedData.hostelFee || null,
      otherFees: validatedData.otherFees || null,
      totalFee: totalFee || null,
      description: validatedData.description || null,
      careerProspects: validatedData.careerProspects || [],
      isActive: validatedData.isActive ?? true,
      admissionOpen: validatedData.admissionOpen ?? false,
      academicYear: new Date().getFullYear().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("Program created", { programId, userId });

    return NextResponse.json(
      {
        data: newProgram,
        message: "Program created successfully"
      } satisfies ApiSuccess<typeof newProgram>,
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/programs", method: "POST", userId });
    return NextResponse.json(
      { error: "Failed to create program", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// PUT /api/admin/content/programs - Update RUB program
export async function PUT(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Program ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = programSchema.partial().parse(body);

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

    // Build update data with only provided fields
    type RUBProgramUpdateFields = {
      updatedAt: Date;
      name?: string;
      code?: string;
      collegeId?: string;
      level?: string;
      field?: string;
      discipline?: string | null;
      duration?: number;
      durationType?: string;
      totalSeats?: number;
      minPercentage?: number | null;
      requiredSubjects?: string[] | null;
      eligibilityCriteria?: Record<string, unknown> | null;
      tuitionFee?: number | null;
      hostelFee?: number | null;
      otherFees?: number | null;
      totalFee?: number | null;
      description?: string | null;
      careerProspects?: string[] | null;
      isActive?: boolean;
      admissionOpen?: boolean;
    };
    const updateData: RUBProgramUpdateFields = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.collegeId !== undefined) updateData.collegeId = validatedData.collegeId;
    if (validatedData.level !== undefined) updateData.level = validatedData.level;
    if (validatedData.field !== undefined) updateData.field = validatedData.field;
    if (validatedData.discipline !== undefined) updateData.discipline = validatedData.discipline;
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.durationType !== undefined) updateData.durationType = validatedData.durationType;
    if (validatedData.totalSeats !== undefined) updateData.totalSeats = validatedData.totalSeats;
    if (validatedData.minPercentage !== undefined) updateData.minPercentage = validatedData.minPercentage;
    if (validatedData.requiredSubjects !== undefined) updateData.requiredSubjects = validatedData.requiredSubjects;
    if (validatedData.eligibilityCriteria !== undefined) {
      updateData.eligibilityCriteria = validatedData.eligibilityCriteria ? JSON.parse(validatedData.eligibilityCriteria) : null;
    }
    if (validatedData.tuitionFee !== undefined) updateData.tuitionFee = validatedData.tuitionFee;
    if (validatedData.hostelFee !== undefined) updateData.hostelFee = validatedData.hostelFee;
    if (validatedData.otherFees !== undefined) updateData.otherFees = validatedData.otherFees;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.careerProspects !== undefined) updateData.careerProspects = validatedData.careerProspects;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.admissionOpen !== undefined) updateData.admissionOpen = validatedData.admissionOpen;

    // Recalculate total fee if any fee fields changed
    if (validatedData.tuitionFee !== undefined || validatedData.hostelFee !== undefined || validatedData.otherFees !== undefined) {
      const tuitionFee = validatedData.tuitionFee ?? existing.tuitionFee ?? 0;
      const hostelFee = validatedData.hostelFee ?? existing.hostelFee ?? 0;
      const otherFees = validatedData.otherFees ?? existing.otherFees ?? 0;
      updateData.totalFee = tuitionFee + hostelFee + otherFees;
    }

    const [updatedProgram] = await db.update(rubPrograms)
      .set(updateData)
      .where(eq(rubPrograms.id, id))
      .returning();

    logger.info("Program updated", { programId: id, userId });

    return NextResponse.json({
      data: updatedProgram,
      message: "Program updated successfully"
    } satisfies ApiSuccess<typeof updatedProgram>);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/programs", method: "PUT", userId });
    return NextResponse.json(
      { error: "Failed to update program", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content/programs - Delete RUB program
export async function DELETE(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Program ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

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
      data: { success: true },
      message: "Program deleted successfully"
    } satisfies ApiSuccess<{ success: boolean }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/programs", method: "DELETE", userId });
    return NextResponse.json(
      { error: "Failed to delete program", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
