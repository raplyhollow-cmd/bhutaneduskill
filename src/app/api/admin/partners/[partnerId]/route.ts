/**
 * Single Partner Management API
 *
 * GET /api/admin/partners/[partnerId] - Get partner details
 * PATCH /api/admin/partners/[partnerId] - Update partner
 * DELETE /api/admin/partners/[partnerId] - Delete partner (soft delete)
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners, schools } from "@/lib/db/schema";
import { eq, and, isNull } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type PartnerType = "rub_college" | "industry" | "ngo" | "government";
type PartnerStatus = "active" | "pending" | "inactive";

interface UpdatePartnerInput {
  name?: string;
  type?: PartnerType;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
  partnershipDate?: string;
  schoolId?: string | null;
  status?: PartnerStatus;
  workshopsConducted?: number;
  studentsPlaced?: number;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUpdateInput(data: UpdatePartnerInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Email validation
  if (data.email !== undefined && data.email.trim() && !validateEmail(data.email)) {
    errors.push("Invalid email format");
  }

  // Type validation
  if (data.type && !["rub_college", "industry", "ngo", "government"].includes(data.type)) {
    errors.push("Invalid partner type. Must be one of: rub_college, industry, ngo, government");
  }

  // Status validation
  if (data.status && !["active", "pending", "inactive"].includes(data.status)) {
    errors.push("Invalid status. Must be one of: active, pending, inactive");
  }

  // Partnership date validation
  if (data.partnershipDate) {
    const date = new Date(data.partnershipDate);
    if (isNaN(date.getTime())) {
      errors.push("Invalid partnership date format");
    }
  }

  // Numeric validation for counters
  if (data.workshopsConducted !== undefined && (data.workshopsConducted < 0 || !Number.isInteger(data.workshopsConducted))) {
    errors.push("Workshops conducted must be a non-negative integer");
  }

  if (data.studentsPlaced !== undefined && (data.studentsPlaced < 0 || !Number.isInteger(data.studentsPlaced))) {
    errors.push("Students placed must be a non-negative integer");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getPartnerById(partnerId: string) {
  return db
    .select({
      id: partners.id,
      name: partners.name,
      type: partners.type,
      email: partners.email,
      phone: partners.phone,
      address: partners.address,
      contactPerson: partners.contactPerson,
      description: partners.description,
      partnershipDate: partners.partnershipDate,
      status: partners.status,
      workshopsConducted: partners.workshopsConducted,
      studentsPlaced: partners.studentsPlaced,
      schoolId: partners.schoolId,
      createdAt: partners.createdAt,
      updatedAt: partners.updatedAt,
      schoolName: schools.name,
    })
    .from(partners)
    .leftJoin(schools, eq(partners.schoolId, schools.id))
    .where(eq(partners.id, partnerId))
    .limit(1);
}

// ============================================================================
// GET - Get Partner Details
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    const partnerData = await getPartnerById(partnerId);

    if (!partnerData || partnerData.length === 0) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    logger.info("Partner details fetched", {
      userId: authResult.userId,
      partnerId,
    });

    return NextResponse.json({
      success: true,
      data: partnerData[0],
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch partner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update Partner
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    // Check if partner exists
    const existingPartner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!existingPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const body = await request.json();

    // Validate input
    const validation = validateUpdateInput(body);
    if (!validation.valid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: Partial<UpdatePartnerInput> & { updatedAt: Date } = {
      updatedAt: new Date(),
    };

    // Only include fields that are being updated
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.type !== undefined) updateData.type = body.type;
    if (body.email !== undefined) updateData.email = body.email?.trim() || "";
    if (body.phone !== undefined) updateData.phone = body.phone?.trim() || "";
    if (body.address !== undefined) updateData.address = body.address?.trim() || "";
    if (body.contactPerson !== undefined) updateData.contactPerson = body.contactPerson?.trim() || "";
    if (body.description !== undefined) updateData.description = body.description?.trim() || "";
    if (body.partnershipDate !== undefined) updateData.partnershipDate = body.partnershipDate;
    if (body.schoolId !== undefined) updateData.schoolId = body.schoolId || null;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.workshopsConducted !== undefined) updateData.workshopsConducted = body.workshopsConducted;
    if (body.studentsPlaced !== undefined) updateData.studentsPlaced = body.studentsPlaced;

    // Check if school exists (if provided)
    if (body.schoolId) {
      const school = await db.query.schools.findFirst({
        where: eq(schools.id, body.schoolId),
        columns: { id: true },
      });

      if (!school) {
        return NextResponse.json(
          { error: "School not found" },
          { status: 404 }
        );
      }
    }

    // Update partner
    await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, partnerId));

    // Fetch updated partner
    const updatedPartner = await getPartnerById(partnerId);

    logger.info("Partner updated", {
      userId: authResult.userId,
      partnerId,
      updatedFields: Object.keys(body),
    });

    return NextResponse.json({
      success: true,
      data: updatedPartner[0],
      message: "Partner updated successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update partner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete Partner (Soft Delete)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    // Check if partner exists
    const existingPartner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!existingPartner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Soft delete by setting status to inactive
    await db
      .update(partners)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));

    // For hard delete, uncomment below (use with caution)
    // await db.delete(partners).where(eq(partners.id, partnerId));

    logger.info("Partner deleted (soft delete)", {
      userId: authResult.userId,
      partnerId,
      partnerName: existingPartner.name,
    });

    return NextResponse.json({
      success: true,
      message: "Partner deleted successfully",
      data: {
        id: partnerId,
        deleted: true,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete partner", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
