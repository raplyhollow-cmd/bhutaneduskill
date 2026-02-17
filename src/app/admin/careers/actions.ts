"use server";

/**
 * SERVER ACTIONS - CAREERS MANAGEMENT
 *
 * Server actions for career CRUD operations.
 * These are used by the Platform Admin careers page.
 */


import { db } from "@/lib/db";
import { careers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

/**
 * Get all careers from the database
 */
export async function getCareers(limit = 500) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const allCareers = await db
      .select()
      .from(careers)
      .orderBy(desc(careers.createdAt))
      .limit(limit);

    return allCareers.map((career) => ({
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "getCareers", userId });
    throw new Error("Failed to fetch careers");
  }
}

/**
 * Get a single career by ID
 */
export async function getCareerById(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const career = await db.query.careers.findFirst({
      where: eq(careers.id, id),
    });

    if (!career) {
      throw new Error("Career not found");
    }

    return {
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "getCareerById", id, userId });
    throw new Error("Failed to fetch career");
  }
}

/**
 * Create a new career
 */
export async function createCareer(data: {
  name: string;
  slug: string;
  description?: string;
  riasecCode?: string;
  riasecScores?: Record<string, number>;
  skills?: string[];
  educationLevel?: string;
  educationPath?: string[];
  subjects?: string[];
  workEnvironment?: string;
  salaryRange?: string;
  bhutanDemand?: "high" | "medium" | "low";
  bhutanSpecific?: boolean;
  tenantId?: string;
}) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const careerId = `career_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const now = new Date();

    // Type assertion to bypass Drizzle type issue with id field
    const [newCareer] = await db
      .insert(careers)
      .values({
        id: careerId,
        // Required fields
        title: data.name, // title is required
        name: data.name,
        slug: data.slug,
        category: "general", // Default category
        industry: "general", // Default industry
        educationLevel: data.educationLevel || "high_school",
        icon: "briefcase", // Default icon
        color: "#3b82f6", // Default color
        // Optional fields
        description: data.description || "",
        riasecCode: data.riasecCode || null,
        hollandCodes: data.riasecScores || null,
        skills: data.skills || null,
        subjects: data.subjects || null,
        workEnvironment: data.workEnvironment || "office",
        typicalSalary: data.salaryRange || null,
        bhutanDemand: data.bhutanDemand || "medium",
        bhutanSpecific: !!data.bhutanSpecific,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      } as any)
      .returning();

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return newCareer;
  } catch (error) {
    logger.error(error, { action: "createCareer", userId });
    throw new Error("Failed to create career");
  }
}

/**
 * Update an existing career
 */
export async function updateCareer(
  id: string,
  data: {
    name?: string;
    slug?: string;
    description?: string;
    riasecCode?: string;
    riasecScores?: Record<string, number>;
    skills?: string[];
    educationPath?: string[];
    subjects?: string[];
    workEnvironment?: string;
    salaryRange?: string;
    bhutanDemand?: "high" | "medium" | "low";
    bhutanSpecific?: boolean;
    isActive?: boolean;
  }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name) updateData.name = data.name;
    if (data.slug) updateData.slug = data.slug;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.riasecCode !== undefined) updateData.riasecCode = data.riasecCode;
    if (data.riasecScores !== undefined) updateData.hollandCodes = data.riasecScores;
    if (data.skills !== undefined) updateData.skills = data.skills;
    if (data.educationPath !== undefined) updateData.educationLevel = data.educationPath;
    if (data.subjects !== undefined) updateData.subjects = data.subjects;
    if (data.workEnvironment !== undefined) updateData.workEnvironment = data.workEnvironment;
    if (data.salaryRange !== undefined) updateData.typicalSalary = data.salaryRange;
    if (data.bhutanDemand !== undefined) updateData.bhutanDemand = data.bhutanDemand;
    if (data.bhutanSpecific !== undefined) updateData.bhutanSpecific = !!data.bhutanSpecific;
    if (data.isActive !== undefined) updateData.isActive = !!data.isActive;

    const [updatedCareer] = await db
      .update(careers)
      .set(updateData)
      .where(eq(careers.id, id))
      .returning();

    if (!updatedCareer) {
      throw new Error("Career not found");
    }

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");
    revalidatePath(`/dashboard/careers/${updatedCareer.slug}`);

    return {
      ...updatedCareer,
      bhutanSpecific: !!updatedCareer.bhutanSpecific,
      isActive: !!updatedCareer.isActive,
    };
  } catch (error) {
    logger.error(error, { action: "updateCareer", id, userId });
    throw new Error("Failed to update career");
  }
}

/**
 * Delete a career
 */
export async function deleteCareer(id: string) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const [deletedCareer] = await db
      .delete(careers)
      .where(eq(careers.id, id))
      .returning();

    if (!deletedCareer) {
      throw new Error("Career not found");
    }

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return deletedCareer;
  } catch (error) {
    logger.error(error, { action: "deleteCareer", id, userId });
    throw new Error("Failed to delete career");
  }
}

/**
 * Bulk update career demand outlook
 */
export async function bulkUpdateDemand(
  ids: string[],
  bhutanDemand: "high" | "medium" | "low"
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    await db
      .update(careers)
      .set({
        bhutanDemand,
        updatedAt: new Date(),
      })
      .where(and(...ids.map((id) => eq(careers.id, id))));

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: ids.length };
  } catch (error) {
    logger.error(error, { action: "bulkUpdateDemand", userId });
    throw new Error("Failed to bulk update careers");
  }
}

/**
 * Bulk delete careers
 */
export async function bulkDeleteCareers(ids: string[]) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    await db
      .delete(careers)
      .where(and(...ids.map((id) => eq(careers.id, id))));

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: ids.length };
  } catch (error) {
    logger.error(error, { action: "bulkDeleteCareers", userId });
    throw new Error("Failed to bulk delete careers");
  }
}

/**
 * Search careers by query
 */
export async function searchCareers(query: string, limit = 20) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    // Simple search implementation
    const allCareers = await db
      .select()
      .from(careers)
      .limit(limit * 2); // Get more to filter

    const filtered = allCareers.filter(
      (career) =>
        career.name?.toLowerCase().includes(query.toLowerCase()) ||
        career.description?.toLowerCase().includes(query.toLowerCase()) ||
        career.riasecCode?.toLowerCase().includes(query.toLowerCase())
    );

    return filtered.slice(0, limit).map((career) => ({
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "searchCareers", query, userId });
    throw new Error("Failed to search careers");
  }
}

/**
 * Get careers by RIASEC code
 */
export async function getCareersByRIASEC(riasecCode: string, limit = 50) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const matchingCareers = await db
      .select()
      .from(careers)
      .where(eq(careers.riasecCode, riasecCode))
      .limit(limit);

    return matchingCareers.map((career) => ({
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "getCareersByRIASEC", riasecCode, userId });
    throw new Error("Failed to fetch careers by RIASEC");
  }
}

/**
 * Get Bhutan-specific careers
 */
export async function getBhutanCareers(limit = 100) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const bhutanCareers = await db
      .select()
      .from(careers)
      .where(eq(careers.bhutanSpecific, true))
      .limit(limit);

    return bhutanCareers.map((career) => ({
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    }));
  } catch (error) {
    logger.error(error, { action: "getBhutanCareers", userId });
    throw new Error("Failed to fetch Bhutan careers");
  }
}

/**
 * Import careers from CSV/JSON
 */
export async function importCareers(
  data: Array<{
    name: string;
    slug: string;
    description?: string;
    riasecCode?: string;
    skills?: string[];
    educationPath?: string[];
    salaryRange?: string;
    bhutanDemand?: "high" | "medium" | "low";
    bhutanSpecific?: boolean;
  }>
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    throw new Error(authResult.error);
  }
  const { userId } = authResult;

  try {
    const results = await db
      .insert(careers)
      .values(
        data.map((career) => ({
          id: `career_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          // Required fields
          title: career.name,
          name: career.name,
          slug: career.slug,
          category: "general",
          industry: "general",
          educationLevel: "high_school",
          icon: "briefcase",
          color: "#3b82f6",
          // Optional fields
          description: career.description || "",
          riasecCode: career.riasecCode,
          skills: career.skills || [],
          subjects: [],
          workEnvironment: "office",
          typicalSalary: career.salaryRange,
          bhutanDemand: career.bhutanDemand || "medium",
          bhutanSpecific: !!career.bhutanSpecific,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .returning();

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: results.length, careers: results };
  } catch (error) {
    logger.error(error, { action: "importCareers", userId });
    throw new Error("Failed to import careers");
  }
}
