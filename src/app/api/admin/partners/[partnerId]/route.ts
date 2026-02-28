/**
 * Single Partner Management API
 *
 * GET /api/admin/partners/[partnerId] - Get partner details
 * PATCH /api/admin/partners/[partnerId] - Update partner
 * DELETE /api/admin/partners/[partnerId] - Delete partner (soft delete)
 */

import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners, schools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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

export const GET = createApiRoute<{ partnerId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    const params = await context?.params || Promise.resolve({ partnerId: "" });
    const { partnerId } = await params;

    if (!partnerId) {
      return { error: "Partner ID is required" };
    }

    const partnerData = await getPartnerById(partnerId);

    if (!partnerData || partnerData.length === 0) {
      return { error: "Partner not found" };
    }

    logger.info("Partner details fetched", { userId, partnerId });

    return {
      success: true,
      data: partnerData[0],
    };
  },
  ["admin"]
);

// ============================================================================
// PATCH - Update Partner
// ============================================================================

export const PATCH = createApiRoute<{ partnerId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    const params = await context?.params || Promise.resolve({ partnerId: "" });
    const { partnerId } = await params;

    if (!partnerId) {
      return { error: "Partner ID is required" };
    }

    // Check if partner exists
    const existingPartnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);
    const existingPartner = existingPartnerResult[0];

    if (!existingPartner) {
      return { error: "Partner not found" };
    }

    const body = await req.json();

    // Validate input
    const validation = validateUpdateInput(body);
    if (!validation.valid) {
      return { error: "Validation failed", details: validation.errors };
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
      const schoolResult = await db
        .select({ id: schools.id })
        .from(schools)
        .where(eq(schools.id, body.schoolId))
        .limit(1);
      const school = schoolResult[0];

      if (!school) {
        return { error: "School not found" };
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
      userId,
      partnerId,
      updatedFields: Object.keys(body),
    });

    return {
      success: true,
      data: updatedPartner[0],
      message: "Partner updated successfully",
    };
  },
  ["admin"]
);

// ============================================================================
// DELETE - Delete Partner (Soft Delete)
// ============================================================================

export const DELETE = createApiRoute<{ partnerId: string }>(
  async (req, auth, context) => {
    const { userId } = auth;

    const params = await context?.params || Promise.resolve({ partnerId: "" });
    const { partnerId } = await params;

    if (!partnerId) {
      return { error: "Partner ID is required" };
    }

    // Check if partner exists
    const existingPartnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);
    const existingPartner = existingPartnerResult[0];

    if (!existingPartner) {
      return { error: "Partner not found" };
    }

    // Soft delete by setting status to inactive
    await db
      .update(partners)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));

    logger.info("Partner deleted (soft delete)", {
      userId,
      partnerId,
      partnerName: existingPartner.name,
    });

    return {
      success: true,
      message: "Partner deleted successfully",
      data: {
        id: partnerId,
        deleted: true,
      },
    };
  },
  ["admin"]
);
