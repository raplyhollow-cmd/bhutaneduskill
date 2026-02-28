import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { rubPrograms, rubColleges } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute } from "@/lib/api/route-handler";
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
export const GET = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId");

    const programsResult = await db
      .select({
        id: rubPrograms.id,
        collegeId: rubPrograms.collegeId,
        name: rubPrograms.name,
        code: rubPrograms.code,
        level: rubPrograms.level,
        field: rubPrograms.field,
        discipline: rubPrograms.discipline,
        duration: rubPrograms.duration,
        durationType: rubPrograms.durationType,
        totalSeats: rubPrograms.totalSeats,
        minPercentage: rubPrograms.minPercentage,
        requiredSubjects: rubPrograms.requiredSubjects,
        eligibilityCriteria: rubPrograms.eligibilityCriteria,
        tuitionFee: rubPrograms.tuitionFee,
        hostelFee: rubPrograms.hostelFee,
        otherFees: rubPrograms.otherFees,
        totalFee: rubPrograms.totalFee,
        description: rubPrograms.description,
        careerProspects: rubPrograms.careerProspects,
        isActive: rubPrograms.isActive,
        admissionOpen: rubPrograms.admissionOpen,
        academicYear: rubPrograms.academicYear,
        createdAt: rubPrograms.createdAt,
        updatedAt: rubPrograms.updatedAt,
        college: {
          id: rubColleges.id,
          name: rubColleges.name,
        },
      })
      .from(rubPrograms)
      .leftJoin(rubColleges, eq(rubPrograms.collegeId, rubColleges.id))
      .where(collegeId ? eq(rubPrograms.collegeId, collegeId) : undefined);
    const programs = programsResult;

    logger.info("Programs fetched", { userId, count: programs.length });

    // Return in the format the frontend expects
    return { data: { programs } } satisfies ApiSuccess<{ programs: typeof programs }>;
  },
  ["admin"]
);

// POST /api/admin/content/programs - Add RUB program
export const POST = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const body = await req.json();
    const validatedData = programSchema.parse(body);

    // Verify college exists
    const collegeResult = await db
      .select()
      .from(rubColleges)
      .where(eq(rubColleges.id, validatedData.collegeId))
      .limit(1);
    const college = collegeResult[0];

    if (!college) {
      return { error: "College not found", status: 404 } satisfies ApiErrorResponse;
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

    return {
      data: newProgram,
      message: "Program created successfully"
    } satisfies ApiSuccess<typeof newProgram>;
  },
  ["admin"]
);

// PUT /api/admin/content/programs - Update RUB program
export const PUT = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "Program ID is required", status: 400 } satisfies ApiErrorResponse;
    }

    const body = await req.json();
    const validatedData = programSchema.partial().parse(body);

    // Check if program exists
    const existingResult = await db
      .select()
      .from(rubPrograms)
      .where(eq(rubPrograms.id, id))
      .limit(1);
    const existing = existingResult[0];

    if (!existing) {
      return { error: "Program not found", status: 404 } satisfies ApiErrorResponse;
    }

    // If collegeId is being updated, verify it exists
    if (validatedData.collegeId) {
      const collegeResult = await db
        .select()
        .from(rubColleges)
        .where(eq(rubColleges.id, validatedData.collegeId))
        .limit(1);
      const college = collegeResult[0];

      if (!college) {
        return { error: "College not found", status: 404 } satisfies ApiErrorResponse;
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

    return {
      data: updatedProgram,
      message: "Program updated successfully"
    } satisfies ApiSuccess<typeof updatedProgram>;
  },
  ["admin"]
);

// DELETE /api/admin/content/programs - Delete RUB program
export const DELETE = createApiRoute(
  async (req, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return { error: "Program ID is required", status: 400 } satisfies ApiErrorResponse;
    }

    // Check if program exists
    const existingResult = await db
      .select()
      .from(rubPrograms)
      .where(eq(rubPrograms.id, id))
      .limit(1);
    const existing = existingResult[0];

    if (!existing) {
      return { error: "Program not found", status: 404 } satisfies ApiErrorResponse;
    }

    await db.delete(rubPrograms).where(eq(rubPrograms.id, id));

    logger.info("Program deleted", { programId: id, userId });

    return {
      data: { success: true },
      message: "Program deleted successfully"
    } satisfies ApiSuccess<{ success: boolean }>;
  },
  ["admin"]
);
