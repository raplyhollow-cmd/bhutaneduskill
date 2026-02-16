import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { rubColleges as colleges } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

const collegeSchema = z.object({
  name: z.string().min(1, "College name is required"),
  code: z.string().min(1, "College code is required"),
  type: z.string().optional(),
  dzongkhag: z.string().optional(),
  location: z.string().optional(),
  website: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  description: z.string().optional(),
  hasHostel: z.boolean().optional(),
  hasLibrary: z.boolean().optional(),
  hasLab: z.boolean().optional(),
  hasSports: z.boolean().optional(),
  programs: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

// GET /api/admin/content/colleges - List colleges
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
    const isActive = searchParams.get("isActive");

    const allColleges = await db.query.rubColleges.findMany({
      orderBy: [desc(colleges.createdAt)],
    });

    let filtered = allColleges;
    if (isActive === "true") {
      filtered = filtered.filter(c => c.isActive === true);
    } else if (isActive === "false") {
      filtered = filtered.filter(c => c.isActive === false);
    }

    logger.info("Colleges fetched", { userId, count: filtered.length });

    return NextResponse.json({ data: filtered } satisfies ApiSuccess<typeof filtered>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/colleges", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch colleges", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/admin/content/colleges - Add college
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
    const validatedData = collegeSchema.parse(body);

    const collegeId = `college_${Date.now()}`;

    const [newCollege] = await db.insert(colleges).values({
      id: collegeId,
      name: validatedData.name,
      code: validatedData.code,
      type: validatedData.type || "constituent",
      dzongkhag: validatedData.dzongkhag,
      location: validatedData.location,
      website: validatedData.website || null,
      email: validatedData.email || null,
      phone: validatedData.phone || null,
      description: validatedData.description || null,
      hasHostel: validatedData.hasHostel ?? false,
      hasLibrary: validatedData.hasLibrary ?? true,
      hasLab: validatedData.hasLab ?? false,
      hasSports: validatedData.hasSports ?? false,
      programs: validatedData.programs || [],
      isActive: validatedData.isActive ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    logger.info("College created", { collegeId, userId });

    return NextResponse.json(
      { data: newCollege, message: "College created successfully" } satisfies ApiSuccess<typeof newCollege>,
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/colleges", method: "POST", userId });
    return NextResponse.json(
      { error: "Failed to create college", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// PUT /api/admin/content/colleges - Update college
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
        { error: "College ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = collegeSchema.partial().parse(body);

    // Check if college exists
    const existing = await db.query.rubColleges.findFirst({
      where: eq(colleges.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "College not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const updateData: Record<string, any> = {
      updatedAt: new Date(),
    };

    // Only include fields that were provided
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.code !== undefined) updateData.code = validatedData.code;
    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.dzongkhag !== undefined) updateData.dzongkhag = validatedData.dzongkhag;
    if (validatedData.location !== undefined) updateData.location = validatedData.location;
    if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
    if (validatedData.email !== undefined) updateData.email = validatedData.email || null;
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone || null;
    if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
    if (validatedData.hasHostel !== undefined) updateData.hasHostel = validatedData.hasHostel;
    if (validatedData.hasLibrary !== undefined) updateData.hasLibrary = validatedData.hasLibrary;
    if (validatedData.hasLab !== undefined) updateData.hasLab = validatedData.hasLab;
    if (validatedData.hasSports !== undefined) updateData.hasSports = validatedData.hasSports;
    if (validatedData.programs !== undefined) updateData.programs = validatedData.programs;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

    const [updatedCollege] = await db.update(colleges)
      .set(updateData)
      .where(eq(colleges.id, id))
      .returning();

    logger.info("College updated", { collegeId: id, userId });

    return NextResponse.json({
      data: updatedCollege,
      message: "College updated successfully"
    } satisfies ApiSuccess<typeof updatedCollege>);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues, status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }
    logger.apiError(error, { route: "/api/admin/content/colleges", method: "PUT", userId });
    return NextResponse.json(
      { error: "Failed to update college", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// DELETE /api/admin/content/colleges - Delete college
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
        { error: "College ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if college exists
    const existing = await db.query.rubColleges.findFirst({
      where: eq(colleges.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "College not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    await db.delete(colleges).where(eq(colleges.id, id));

    logger.info("College deleted", { collegeId: id, userId });

    return NextResponse.json({
      data: { success: true },
      message: "College deleted successfully"
    } satisfies ApiSuccess<{ success: boolean }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/colleges", method: "DELETE", userId });
    return NextResponse.json(
      { error: "Failed to delete college", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
