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

    // Return in the format the frontend expects: { programs: [...] }
    return NextResponse.json({ programs });
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
      { program: newProgram, message: "Program created successfully" },
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
