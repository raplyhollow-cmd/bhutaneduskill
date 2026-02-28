"use server";

/**
 * SERVER ACTIONS - PARTNERS MANAGEMENT
 *
 * Server actions for partner CRUD operations.
 * These are used by the Platform Admin partners page.
 */


import { db } from "@/lib/db";
import { partners, users } from "@/lib/db/schema";
import { eq, desc, and, or, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

// ============================================================================
// TYPES
// ============================================================================

type PartnerType = "rub_college" | "industry" | "ngo" | "government";
type PartnerStatus = "active" | "pending" | "inactive";

interface PartnerData {
  name: string;
  type: PartnerType;
  email?: string;
  phone?: string;
  address?: string;
  contactPerson?: string;
  description?: string;
  partnershipDate?: string;
  status?: PartnerStatus;
}

interface PartnerWithDetails {
  id: string;
  name: string;
  type: PartnerType;
  email: string;
  phone: string;
  address: string;
  contactPerson: string | null;
  description: string;
  partnershipDate: string;
  status: PartnerStatus;
  workshopsConducted: number | null;
  studentsPlaced: number | null;
  schoolId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CRUD ACTIONS
// ============================================================================

/**
 * Get all partners from the database
 */
export async function getPartners(limit = 100): Promise<PartnerWithDetails[]> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allPartners = await db
      .select()
      .from(partners)
      .orderBy(desc(partners.createdAt))
      .limit(limit);

    return allPartners.map((partner): PartnerWithDetails => ({
      id: partner.id,
      name: partner.name,
      type: partner.type as PartnerType,
      email: partner.email || "",
      phone: partner.phone || "",
      address: partner.address || "",
      contactPerson: partner.contactPerson || null,
      description: partner.description || "",
      partnershipDate: partner.partnershipDate || "",
      status: (partner.status || "active") as PartnerStatus,
      workshopsConducted: partner.workshopsConducted || 0,
      studentsPlaced: partner.studentsPlaced || 0,
      schoolId: partner.schoolId || null,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));
  } catch (error) {
    logger.error(error, { action: "getPartners", userId });
    throw new Error("Failed to fetch partners");
  }
}

/**
 * Get a single partner by ID
 */
export async function getPartnerById(id: string): Promise<PartnerWithDetails> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, id))
      .limit(1);

    if (!partner) {
      throw new Error("Partner not found");
    }

    return {
      id: partner.id,
      name: partner.name,
      type: partner.type as PartnerType,
      email: partner.email || "",
      phone: partner.phone || "",
      address: partner.address || "",
      contactPerson: partner.contactPerson || null,
      description: partner.description || "",
      partnershipDate: partner.partnershipDate || "",
      status: (partner.status || "active") as PartnerStatus,
      workshopsConducted: partner.workshopsConducted || 0,
      studentsPlaced: partner.studentsPlaced || 0,
      schoolId: partner.schoolId || null,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    };
  } catch (error) {
    logger.error(error, { action: "getPartnerById", id, userId });
    throw new Error("Failed to fetch partner");
  }
}

/**
 * Get partner statistics
 */
export async function getPartnerStatistics() {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allPartners = await db.select().from(partners);

    const byType = {
      rub_college: allPartners.filter((p) => p.type === "rub_college").length,
      industry: allPartners.filter((p) => p.type === "industry").length,
      ngo: allPartners.filter((p) => p.type === "ngo").length,
      government: allPartners.filter((p) => p.type === "government").length,
    };

    const byStatus = {
      active: allPartners.filter((p) => p.status === "active").length,
      pending: allPartners.filter((p) => p.status === "pending").length,
      inactive: allPartners.filter((p) => p.status === "inactive").length,
    };

    const totalWorkshops = allPartners.reduce((sum, p) => sum + (p.workshopsConducted || 0), 0);
    const totalPlacements = allPartners.reduce((sum, p) => sum + (p.studentsPlaced || 0), 0);

    return {
      total: allPartners.length,
      byType,
      byStatus,
      totalWorkshops,
      totalPlacements,
    };
  } catch (error) {
    logger.error(error, { action: "getPartnerStatistics", userId });
    throw new Error("Failed to fetch partner statistics");
  }
}

/**
 * Create a new partner
 */
export async function createPartner(data: PartnerData) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const partnerId = `partner-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const [newPartner] = await db
      .insert(partners)
      .values({
        id: partnerId,
        name: data.name.trim(),
        type: data.type,
        email: data.email?.trim() || "",
        phone: data.phone?.trim() || "",
        address: data.address?.trim() || "",
        contactPerson: data.contactPerson?.trim() || null,
        description: data.description?.trim() || "",
        partnershipDate: data.partnershipDate || now.toISOString().split("T")[0],
        status: data.status || "active",
        workshopsConducted: 0,
        studentsPlaced: 0,
        schoolId: null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    revalidatePath("/admin/partners");

    logger.info("Partner created", {
      userId,
      partnerId,
      partnerName: data.name,
      partnerType: data.type,
    });

    return newPartner;
  } catch (error) {
    logger.error(error, { action: "createPartner", userId });
    throw new Error("Failed to create partner");
  }
}

/**
 * Update an existing partner
 */
export async function updatePartner(id: string, data: Partial<PartnerData>) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.type !== undefined) updateData.type = data.type;
    if (data.email !== undefined) updateData.email = data.email?.trim() || "";
    if (data.phone !== undefined) updateData.phone = data.phone?.trim() || "";
    if (data.address !== undefined) updateData.address = data.address?.trim() || "";
    if (data.contactPerson !== undefined) updateData.contactPerson = data.contactPerson?.trim() || null;
    if (data.description !== undefined) updateData.description = data.description?.trim() || "";
    if (data.partnershipDate !== undefined) updateData.partnershipDate = data.partnershipDate;
    if (data.status !== undefined) updateData.status = data.status;

    const [updatedPartner] = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();

    if (!updatedPartner) {
      throw new Error("Partner not found");
    }

    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);

    logger.info("Partner updated", {
      userId,
      partnerId: id,
      updatedFields: Object.keys(data),
    });

    return updatedPartner;
  } catch (error) {
    logger.error(error, { action: "updatePartner", id, userId });
    throw new Error("Failed to update partner");
  }
}

/**
 * Delete a partner (soft delete)
 */
export async function deletePartner(id: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedPartner] = await db
      .update(partners)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(partners.id, id))
      .returning();

    if (!deletedPartner) {
      throw new Error("Partner not found");
    }

    revalidatePath("/admin/partners");

    logger.info("Partner deleted (soft delete)", {
      userId,
      partnerId: id,
      partnerName: deletedPartner.name,
    });

    return deletedPartner;
  } catch (error) {
    logger.error(error, { action: "deletePartner", id, userId });
    throw new Error("Failed to delete partner");
  }
}

/**
 * Bulk update partner status
 */
export async function bulkUpdatePartnerStatus(ids: string[], status: PartnerStatus) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    await db
      .update(partners)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(and(...ids.map((id) => eq(partners.id, id))));

    revalidatePath("/admin/partners");

    logger.info("Bulk partner status updated", {
      userId,
      count: ids.length,
      status,
    });

    return { success: true, count: ids.length };
  } catch (error) {
    logger.error(error, { action: "bulkUpdatePartnerStatus", userId });
    throw new Error("Failed to bulk update partners");
  }
}

/**
 * Search partners by query
 */
export async function searchPartners(query: string, limit = 20): Promise<PartnerWithDetails[]> {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const searchTerm = `%${query}%`;

    // Use sql for COALESCE in search
    const matchingPartners = await db
      .select()
      .from(partners)
      .where(
        or(
          like(partners.name, searchTerm),
          like(partners.email, searchTerm)
        )
      )
      .limit(limit);

    return matchingPartners.map((partner): PartnerWithDetails => ({
      id: partner.id,
      name: partner.name,
      type: partner.type as PartnerType,
      email: partner.email || "",
      phone: partner.phone || "",
      address: partner.address || "",
      contactPerson: partner.contactPerson || null,
      description: partner.description || "",
      partnershipDate: partner.partnershipDate || "",
      status: (partner.status || "active") as PartnerStatus,
      workshopsConducted: partner.workshopsConducted || 0,
      studentsPlaced: partner.studentsPlaced || 0,
      schoolId: partner.schoolId || null,
      createdAt: partner.createdAt,
      updatedAt: partner.updatedAt,
    }));
  } catch (error) {
    logger.error(error, { action: "searchPartners", query, userId });
    throw new Error("Failed to search partners");
  }
}

/**
 * Update partner metrics (workshops, placements)
 */
export async function updatePartnerMetrics(
  id: string,
  metrics: {
    workshopsConducted?: number;
    studentsPlaced?: number;
  }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (metrics.workshopsConducted !== undefined) {
      updateData.workshopsConducted = metrics.workshopsConducted;
    }
    if (metrics.studentsPlaced !== undefined) {
      updateData.studentsPlaced = metrics.studentsPlaced;
    }

    const [updatedPartner] = await db
      .update(partners)
      .set(updateData)
      .where(eq(partners.id, id))
      .returning();

    if (!updatedPartner) {
      throw new Error("Partner not found");
    }

    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${id}`);

    logger.info("Partner metrics updated", {
      userId,
      partnerId: id,
      metrics,
    });

    return updatedPartner;
  } catch (error) {
    logger.error(error, { action: "updatePartnerMetrics", id, userId });
    throw new Error("Failed to update partner metrics");
  }
}

// ============================================================================
// PARTNER PORTAL ACCESS
// ============================================================================

/**
 * Get partner portal users (users associated with a partner)
 */
export async function getPartnerPortalUsers(partnerId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    // Get partner info
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);

    if (!partner) {
      throw new Error("Partner not found");
    }

    // Get users associated with this partner (assuming partner-specific user type or relation)
    // For now, we'll search users by partner email pattern or similar
    const partnerUsers = await db
      .select()
      .from(users)
      .where(eq(users.type, "partner"))
      .limit(50);

    // Filter users that might belong to this partner based on email domain or name match
    const associatedUsers = partnerUsers.filter(
      (user) =>
        user.email?.includes(partner.name.toLowerCase()) ||
        user.name?.toLowerCase().includes(partner.name.toLowerCase())
    );

    return {
      partner,
      users: associatedUsers,
      totalCount: associatedUsers.length,
    };
  } catch (error) {
    logger.error(error, { action: "getPartnerPortalUsers", partnerId, userId });
    throw new Error("Failed to fetch partner portal users");
  }
}

/**
 * Grant portal access to partner (create partner user)
 */
export async function grantPartnerPortalAccess(
  partnerId: string,
  userData: {
    email: string;
    firstName: string;
    lastName: string;
  }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    // Get partner info
    const [partner] = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);

    if (!partner) {
      throw new Error("Partner not found");
    }

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, userData.email))
      .limit(1);

    if (existingUser) {
      throw new Error("User with this email already exists");
    }

    // Create partner portal user
    // Note: This would typically involve sending a Clerk invitation
    // For now, we create a pending user record
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      clerkUserId: "", // Will be set when user accepts invitation
      type: "partner",
      role: "partner",
      name: `${userData.firstName} ${userData.lastName}`.trim(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      email: userData.email,
      partnerId: partnerId,
      isActive: false, // Pending invitation acceptance
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(users).values({
      id: newUser.id,
      clerkUserId: newUser.clerkUserId,
      type: newUser.type,
      role: newUser.role,
      name: newUser.name,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      email: newUser.email,
      partnerId: newUser.partnerId,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt,
      updatedAt: newUser.updatedAt,
    });

    revalidatePath("/admin/partners");
    revalidatePath(`/admin/partners/${partnerId}`);

    logger.info("Partner portal access granted", {
      userId,
      partnerId,
      partnerEmail: userData.email,
    });

    return {
      success: true,
      message: "Portal access invitation sent",
      user: newUser,
    };
  } catch (error) {
    logger.error(error, { action: "grantPartnerPortalAccess", partnerId, userId });
    throw new Error("Failed to grant partner portal access");
  }
}

/**
 * Revoke partner portal access
 */
export async function revokePartnerPortalAccess(partnerUserId: string) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, partnerUserId));

    revalidatePath("/admin/partners");

    logger.info("Partner portal access revoked", {
      userId,
      partnerUserId,
    });

    return { success: true, message: "Portal access revoked" };
  } catch (error) {
    logger.error(error, { action: "revokePartnerPortalAccess", partnerUserId, userId });
    throw new Error("Failed to revoke partner portal access");
  }
}
