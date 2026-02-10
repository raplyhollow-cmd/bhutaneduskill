/**
 * SERVER ACTIONS - CAREERS MANAGEMENT
 *
 * Server actions for career CRUD operations.
 * These are used by the Platform Admin careers page.
 */

"use server";

import { db } from "@/lib/db";
import { careers } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

/**
 * Get all careers from the database
 */
export async function getCareers(limit = 500) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    console.error("Failed to fetch careers:", error);
    throw new Error("Failed to fetch careers");
  }
}

/**
 * Get a single career by ID
 */
export async function getCareerById(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    console.error("Failed to fetch career:", error);
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
  educationPath?: string[];
  subjects?: string[];
  workEnvironment?: string;
  salaryRange?: string;
  demandOutlook?: "high" | "medium" | "low";
  bhutanSpecific?: boolean;
  tenantId?: string;
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const [newCareer] = await db
      .insert(careers)
      .values({
        id: `career_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name,
        slug: data.slug,
        description: data.description,
        riasecCode: data.riasecCode,
        riasecScores: data.riasecScores,
        skills: data.skills || [],
        educationPath: data.educationPath || [],
        subjects: data.subjects || [],
        workEnvironment: data.workEnvironment,
        salaryRange: data.salaryRange,
        demandOutlook: data.demandOutlook || "medium",
        bhutanSpecific: data.bhutanSpecific ? 1 : 0,
        tenantId: data.tenantId,
        isActive: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return newCareer;
  } catch (error) {
    console.error("Failed to create career:", error);
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
    demandOutlook?: "high" | "medium" | "low";
    bhutanSpecific?: boolean;
    isActive?: boolean;
  }
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const [updatedCareer] = await db
      .update(careers)
      .set({
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.riasecCode !== undefined && { riasecCode: data.riasecCode }),
        ...(data.riasecScores !== undefined && { riasecScores: data.riasecScores }),
        ...(data.skills !== undefined && { skills: data.skills }),
        ...(data.educationPath !== undefined && { educationPath: data.educationPath }),
        ...(data.subjects !== undefined && { subjects: data.subjects }),
        ...(data.workEnvironment !== undefined && { workEnvironment: data.workEnvironment }),
        ...(data.salaryRange !== undefined && { salaryRange: data.salaryRange }),
        ...(data.demandOutlook !== undefined && { demandOutlook: data.demandOutlook }),
        ...(data.bhutanSpecific !== undefined && { bhutanSpecific: data.bhutanSpecific ? 1 : 0 }),
        ...(data.isActive !== undefined && { isActive: data.isActive ? 1 : 0 }),
        updatedAt: new Date(),
      })
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
      bhutanSpecific: updatedCareer.bhutanSpecific === 1,
      isActive: updatedCareer.isActive === 1,
    };
  } catch (error) {
    console.error("Failed to update career:", error);
    throw new Error("Failed to update career");
  }
}

/**
 * Delete a career
 */
export async function deleteCareer(id: string) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    console.error("Failed to delete career:", error);
    throw new Error("Failed to delete career");
  }
}

/**
 * Bulk update career demand outlook
 */
export async function bulkUpdateDemand(
  ids: string[],
  demandOutlook: "high" | "medium" | "low"
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .update(careers)
      .set({
        demandOutlook,
        updatedAt: new Date(),
      })
      .where(and(...ids.map((id) => eq(careers.id, id))));

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Failed to bulk update careers:", error);
    throw new Error("Failed to bulk update careers");
  }
}

/**
 * Bulk delete careers
 */
export async function bulkDeleteCareers(ids: string[]) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    await db
      .delete(careers)
      .where(and(...ids.map((id) => eq(careers.id, id))));

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: ids.length };
  } catch (error) {
    console.error("Failed to bulk delete careers:", error);
    throw new Error("Failed to bulk delete careers");
  }
}

/**
 * Search careers by query
 */
export async function searchCareers(query: string, limit = 20) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    console.error("Failed to search careers:", error);
    throw new Error("Failed to search careers");
  }
}

/**
 * Get careers by RIASEC code
 */
export async function getCareersByRIASEC(riasecCode: string, limit = 50) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

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
    console.error("Failed to fetch careers by RIASEC:", error);
    throw new Error("Failed to fetch careers by RIASEC");
  }
}

/**
 * Get Bhutan-specific careers
 */
export async function getBhutanCareers(limit = 100) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const bhutanCareers = await db
      .select()
      .from(careers)
      .where(eq(careers.bhutanSpecific, 1))
      .limit(limit);

    return bhutanCareers.map((career) => ({
      ...career,
      bhutanSpecific: !!career.bhutanSpecific,
      isActive: !!career.isActive,
    }));
  } catch (error) {
    console.error("Failed to fetch Bhutan careers:", error);
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
    demandOutlook?: "high" | "medium" | "low";
    bhutanSpecific?: boolean;
  }>
) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    const results = await db
      .insert(careers)
      .values(
        data.map((career) => ({
          id: `career_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: career.name,
          slug: career.slug,
          description: career.description,
          riasecCode: career.riasecCode,
          skills: career.skills || [],
          educationPath: career.educationPath || [],
          salaryRange: career.salaryRange,
          demandOutlook: career.demandOutlook || "medium",
          bhutanSpecific: career.bhutanSpecific ? 1 : 0,
          isActive: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        }))
      )
      .returning();

    revalidatePath("/admin/careers");
    revalidatePath("/dashboard/careers");

    return { success: true, count: results.length, careers: results };
  } catch (error) {
    console.error("Failed to import careers:", error);
    throw new Error("Failed to import careers");
  }
}
