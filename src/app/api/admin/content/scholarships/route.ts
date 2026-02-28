/**
 * ADMIN SCHOLARSHIPS API
 *
 * GET /api/admin/content/scholarships - List scholarships
 * POST /api/admin/content/scholarships - Add scholarship
 * PUT /api/admin/content/scholarships - Update scholarship
 * DELETE /api/admin/content/scholarships - Delete scholarship
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { scholarships } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { z } from "zod";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, createdResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { logger } from "@/lib/logger";
import { logContentModified, AuditActions } from "@/lib/audit-log";

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

// Helper function to generate code from name
function generateCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .substring(0, 50);
}

// ============================================================================
// GET /api/admin/content/scholarships - List scholarships
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const { searchParams } = new URL(req.url);
      const category = searchParams.get("category");
      const active = searchParams.get("active") === "true";

      // Using db.select() instead of db.query (neon-http driver)
      const allScholarships = await db
        .select()
        .from(scholarships)
        .orderBy(desc(scholarships.createdAt));

      let filtered = allScholarships;

      if (category) {
        filtered = filtered.filter((s) => {
          const categories = s.categories || [];
          return Array.isArray(categories) && categories.includes(category);
        });
      }

      if (active) {
        const now = new Date();
        filtered = filtered.filter((s) => {
          // Check isActive flag
          if (s.isActive === false) return false;
          // Check close date if provided
          const closeDate = s.applicationCloseDate;
          if (!closeDate) return true;
          return new Date(closeDate) > now;
        });
      }

      logger.info("Scholarships fetched", { userId, count: filtered.length });

      return successResponse({ scholarships: filtered });
    } catch (error) {
      logger.apiError(error, { route: "/api/admin/content/scholarships", method: "GET", userId });
      return errorResponse("Failed to fetch scholarships", 500);
    }
  },
  ['admin']
);

// ============================================================================
// POST /api/admin/content/scholarships - Add scholarship
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const body = await req.json();
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
      } as typeof scholarships.$inferInsert).returning();

      logger.info("Scholarship created", { scholarshipId: newScholarship.id, userId });

      // Log audit event for scholarship creation
      await logContentModified(
        AuditActions.SCHOLARSHIP_CREATED,
        "scholarship",
        newScholarship.id,
        undefined,
        {
          name: newScholarship.name,
          code: newScholarship.code,
          type: newScholarship.type,
          provider: newScholarship.provider,
        },
        userId,
        req
      );

      return createdResponse({
        scholarship: newScholarship,
        message: "Scholarship created successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.apiError(error, { route: "/api/admin/content/scholarships", method: "POST", userId });
      return errorResponse("Failed to create scholarship", 500);
    }
  },
  ['admin']
);

// ============================================================================
// PUT /api/admin/content/scholarships - Update scholarship
// ============================================================================

export const PUT = createApiRoute(
  async (req: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) {
        return badRequestResponse("Scholarship ID is required");
      }

      const body = await req.json();
      const validatedData = scholarshipSchema.partial().parse(body);

      // Check if scholarship exists using db.select()
      const existingResult = await db
        .select()
        .from(scholarships)
        .where(eq(scholarships.id, id))
        .limit(1);

      const existing = existingResult[0];

      if (!existing) {
        return notFoundResponse("Scholarship");
      }

      // Build update data with only provided fields
      type ScholarshipUpdateData = {
        [K in keyof typeof scholarships.$inferInsert]?: (typeof scholarships.$inferInsert)[K];
      };
      const updateData: ScholarshipUpdateData = {
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

      // Log audit event for scholarship update
      await logContentModified(
        AuditActions.SCHOLARSHIP_UPDATED,
        "scholarship",
        id,
        { name: existing.name, code: existing.code },
        { name: updatedScholarship.name, code: updatedScholarship.code },
        userId,
        req
      );

      return successResponse({
        scholarship: updatedScholarship,
        message: "Scholarship updated successfully"
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return badRequestResponse("Validation failed: " + error.issues.map(i => i.message).join(", "));
      }
      logger.apiError(error, { route: "/api/admin/content/scholarships", method: "PUT", userId });
      return errorResponse("Failed to update scholarship", 500);
    }
  },
  ['admin']
);

// ============================================================================
// DELETE /api/admin/content/scholarships - Delete scholarship
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth) => {
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    try {
      const { searchParams } = new URL(req.url);
      const id = searchParams.get("id");

      if (!id) {
        return badRequestResponse("Scholarship ID is required");
      }

      // Check if scholarship exists using db.select()
      const existingResult = await db
        .select()
        .from(scholarships)
        .where(eq(scholarships.id, id))
        .limit(1);

      const existing = existingResult[0];

      if (!existing) {
        return notFoundResponse("Scholarship");
      }

      await db.delete(scholarships).where(eq(scholarships.id, id));

      logger.info("Scholarship deleted", { scholarshipId: id, userId });

      // Log audit event for scholarship deletion
      await logContentModified(
        AuditActions.SCHOLARSHIP_DELETED,
        "scholarship",
        id,
        { name: existing.name, code: existing.code },
        undefined,
        userId,
        req
      );

      return successResponse({
        success: true,
        message: "Scholarship deleted successfully"
      });
    } catch (error) {
      logger.apiError(error, { route: "/api/admin/content/scholarships", method: "DELETE", userId });
      return errorResponse("Failed to delete scholarship", 500);
    }
  },
  ['admin']
);
