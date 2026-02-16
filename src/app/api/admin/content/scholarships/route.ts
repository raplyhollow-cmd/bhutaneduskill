import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scholarships } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// Schema matching the database rubScholarships table and form data
const scholarshipSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  type: z.string().optional(),
  provider: z.string().optional(),
  providerName: z.string().optional(),
  coversTuition: z.boolean().optional(),
  coversHostel: z.boolean().optional(),
  coversBooks: z.boolean().optional(),
  coversLiving: z.boolean().optional(),
  coveragePercentage: z.number().min(0).max(100).optional(),
  minPercentage: z.number().min(0).max(100).optional(),
  annualIncomeLimit: z.number().min(0).optional(),
  categories: z.array(z.string()).optional(),
  duration: z.string().optional(),
  applicationOpenDate: z.string().optional(),
  applicationCloseDate: z.string().optional(),
  requiredDocuments: z.array(z.string()).optional(),
  description: z.string().optional(),
  termsAndConditions: z.string().optional(),
  academicYear: z.string().optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/content/scholarships - List scholarships
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
    const category = searchParams.get("category");
    const active = searchParams.get("active") === "true";

    const allScholarships = await db.query.scholarships.findMany({
      orderBy: [desc(scholarships.createdAt)],
    });

    let filtered = allScholarships;

    if (category) {
      filtered = filtered.filter((s: any) => {
        const categories = (s as any).categories || [];
        return Array.isArray(categories) && categories.includes(category);
      });
    }

    if (active) {
      const now = new Date();
      filtered = filtered.filter((s: any) => {
        // Check isActive flag
        if ((s as any).isActive === false) return false;
        // Check close date if provided
        const closeDate = (s as any).applicationCloseDate;
        if (!closeDate) return true;
        return new Date(closeDate) > now;
      });
    }

    logger.info("Scholarships fetched", { userId, count: filtered.length });

    return NextResponse.json({
      data: { scholarships: filtered },
      status: 200
    } satisfies ApiSuccess<{ scholarships: typeof filtered }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/scholarships", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch scholarships", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// Helper function to generate code from name
function generateCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

// POST /api/admin/content/scholarships - Add scholarship
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
    const validatedData = scholarshipSchema.parse(body);

    // Generate code if not provided
    const code = validatedData.code || generateCode(validatedData.name);

    // Create scholarship with proper field mapping
    const [newScholarship] = await db.insert(scholarships).values({
      id: `scholarship_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
      name: validatedData.name,
      code: code,
      type: validatedData.type || "merit",
      provider: validatedData.provider || "",
      providerName: validatedData.providerName || null,
      coversTuition: validatedData.coversTuition || false,
      coversHostel: validatedData.coversHostel || false,
      coversBooks: validatedData.coversBooks || false,
      coversLiving: validatedData.coversLiving || false,
      coveragePercentage: validatedData.coveragePercentage || null,
      minPercentage: validatedData.minPercentage || null,
      annualIncomeLimit: validatedData.annualIncomeLimit || null,
      categories: validatedData.categories || null,
      duration: validatedData.duration || null,
      applicationOpenDate: validatedData.applicationOpenDate || null,
      applicationCloseDate: validatedData.applicationCloseDate || null,
      requiredDocuments: validatedData.requiredDocuments || null,
      description: validatedData.description || null,
      termsAndConditions: validatedData.termsAndConditions || null,
      academicYear: validatedData.academicYear || null,
      isActive: validatedData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any).returning();

    logger.info("Scholarship created", { scholarshipId: newScholarship.id, userId });

    return NextResponse.json(
      {
        data: { scholarship: newScholarship, message: "Scholarship created successfully" },
        status: 201
      } satisfies ApiSuccess<{ scholarship: typeof newScholarship; message: string }>,
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", status: 400, details: error.issues } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/scholarships", method: "POST", userId });
    return NextResponse.json(
      { error: "Failed to create scholarship", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// PUT /api/admin/content/scholarships - Update scholarship
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
        { error: "Scholarship ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = scholarshipSchema.partial().parse(body);

    // Check if scholarship exists
    const existing = await db.query.scholarships.findFirst({
      where: eq(scholarships.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scholarship not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Build update data with only provided fields
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.provider !== undefined) updateData.provider = validatedData.provider;
    if (validatedData.providerName !== undefined) updateData.providerName = validatedData.providerName;
    if (validatedData.coversTuition !== undefined) updateData.coversTuition = validatedData.coversTuition;
    if (validatedData.coversHostel !== undefined) updateData.coversHostel = validatedData.coversHostel;
    if (validatedData.coversBooks !== undefined) updateData.coversBooks = validatedData.coversBooks;
    if (validatedData.coversLiving !== undefined) updateData.coversLiving = validatedData.coversLiving;
    if (validatedData.coveragePercentage !== undefined) updateData.coveragePercentage = validatedData.coveragePercentage;
    if (validatedData.minPercentage !== undefined) updateData.minPercentage = validatedData.minPercentage;
    if (validatedData.annualIncomeLimit !== undefined) updateData.annualIncomeLimit = validatedData.annualIncomeLimit;
    if (validatedData.categories !== undefined) updateData.categories = validatedData.categories;
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.applicationOpenDate !== undefined) updateData.applicationOpenDate = validatedData.applicationOpenDate;
    if (validatedData.applicationCloseDate !== undefined) updateData.applicationCloseDate = validatedData.applicationCloseDate;
    if (validatedData.requiredDocuments !== undefined) updateData.requiredDocuments = validatedData.requiredDocuments;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.termsAndConditions !== undefined) updateData.termsAndConditions = validatedData.termsAndConditions;
    if (validatedData.academicYear !== undefined) updateData.academicYear = validatedData.academicYear;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const [updatedScholarship] = await db.update(scholarships)
      .set(updateData)
      .where(eq(scholarships.id, id))
      .returning();

    logger.info("Scholarship updated", { scholarshipId: id, userId });

    return NextResponse.json({
      data: { scholarship: updatedScholarship, message: "Scholarship updated successfully" },
      status: 200
    } satisfies ApiSuccess<{ scholarship: typeof updatedScholarship; message: string }>);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", status: 400, details: error.issues } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/scholarships", method: "PUT", userId });
    return NextResponse.json(
      { error: "Failed to update scholarship", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content/scholarships - Delete scholarship
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
        { error: "Scholarship ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if scholarship exists
    const existing = await db.query.scholarships.findFirst({
      where: eq(scholarships.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Scholarship not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    await db.delete(scholarships).where(eq(scholarships.id, id));

    logger.info("Scholarship deleted", { scholarshipId: id, userId });

    return NextResponse.json({
      data: { success: true, message: "Scholarship deleted successfully" },
      status: 200
    } satisfies ApiSuccess<{ success: boolean; message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/scholarships", method: "DELETE", userId });
    return NextResponse.json(
      { error: "Failed to delete scholarship", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}