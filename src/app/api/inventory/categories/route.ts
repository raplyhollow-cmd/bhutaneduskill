/**
 * Inventory Categories API
 * Handles inventory item categories
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inventoryCategories } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

interface CreateCategoryInput {
  name: string;
  code?: string;
  description?: string;
  parentId?: string;
  level?: number;
  depreciationRate?: number;
  usefulLifeYears?: number;
  alertThreshold?: number;
  icon?: string;
  color?: string;
  displayOrder?: number;
}

interface UpdateCategoryInput extends Partial<Omit<CreateCategoryInput, 'isActive'>> {
  id: string;
  isActive?: boolean;
}

// ============================================================================
// GET /api/inventory/categories - List inventory categories
// ============================================================================

export const GET = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user } = auth;
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const isActive = searchParams.get("isActive");
    const includeChildren = searchParams.get("includeChildren") === "true";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    // Only show categories from user's school or global categories
    if (user.schoolId) {
      conditions.push(
        or(
          eq(inventoryCategories.schoolId, user.schoolId || ""),
          sql`${inventoryCategories.schoolId} = ''`
        )!
      );
    }

    if (search) {
      const searchConditions = [
        like(inventoryCategories.name, `%${search}%`),
      ];
      if (inventoryCategories.code !== null) {
        searchConditions.push(like(inventoryCategories.code, `%${search}%`));
      }
      if (inventoryCategories.description !== null) {
        searchConditions.push(like(inventoryCategories.description, `%${search}%`));
      }
      conditions.push(or(...searchConditions)!);
    }

    if (isActive !== null && isActive !== "") {
      conditions.push(eq(inventoryCategories.isActive, isActive === "true"));
    }

    // Get categories
    const categories = await db
      .select()
      .from(inventoryCategories)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(sql`COALESCE(display_order, 0)`, inventoryCategories.name);

    logger.info("Fetched inventory categories", { userId: user.id, count: categories.length });

    return successResponse(categories);
  },
  ["admin"]
);

// ============================================================================
// POST /api/inventory/categories - Create new category
// ============================================================================

export const POST = createApiRoute(
  async (req: NextRequest, auth) => {
    const { user, userId } = auth;
    const data: CreateCategoryInput = await req.json();

    if (!data.name) {
      return badRequestResponse("Missing required field: name");
    }

    const now = new Date();
    const categoryId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newCategory] = await db
      .insert(inventoryCategories)
      .values({
        id: categoryId,
        schoolId: user.schoolId || "",
        name: data.name,
        code: data.code || null,
        description: data.description || null,
        parentId: data.parentId || null,
        level: data.level ?? 0,
        depreciationRate: data.depreciationRate || null,
        usefulLifeYears: data.usefulLifeYears || null,
        alertThreshold: data.alertThreshold || 10,
        isActive: true,
        displayOrder: data.displayOrder || null,
        icon: data.icon || null,
        color: data.color || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Created inventory category", { userId, categoryId });

    return successResponse({
      category: newCategory,
      message: "Category created successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// PATCH /api/inventory/categories - Update category
// ============================================================================

export const PATCH = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const data: UpdateCategoryInput = await req.json();

    if (!data.id) {
      return badRequestResponse("Category ID is required");
    }

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.id, data.id))
      .limit(1);

    if (!existingCategory) {
      return notFoundResponse("Category");
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: Array<"name" | "code" | "description" | "parentId" | "level" | "depreciationRate" | "usefulLifeYears" | "alertThreshold" | "icon" | "color" | "displayOrder" | "isActive"> = [
      "name",
      "code",
      "description",
      "parentId",
      "level",
      "depreciationRate",
      "usefulLifeYears",
      "alertThreshold",
      "icon",
      "color",
      "displayOrder",
      "isActive",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updatedCategory] = await db
      .update(inventoryCategories)
      .set(updateData)
      .where(eq(inventoryCategories.id, data.id))
      .returning();

    logger.info("Updated inventory category", { userId, categoryId: data.id });

    return successResponse({
      category: updatedCategory,
      message: "Category updated successfully",
    });
  },
  ["admin"]
);

// ============================================================================
// DELETE /api/inventory/categories - Delete category
// ============================================================================

export const DELETE = createApiRoute(
  async (req: NextRequest, auth) => {
    const { userId } = auth;
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return badRequestResponse("Category ID is required");
    }

    // Check if category exists
    const [existingCategory] = await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.id, categoryId))
      .limit(1);

    if (!existingCategory) {
      return notFoundResponse("Category");
    }

    // Check if category has child categories
    const childCategories = await db
      .select()
      .from(inventoryCategories)
      .where(eq(inventoryCategories.parentId, categoryId));

    if (childCategories.length > 0) {
      return errorResponse(
        "Cannot delete category with child categories. Please delete or reassign child categories first.",
        400
      );
    }

    await db.delete(inventoryCategories).where(eq(inventoryCategories.id, categoryId));

    logger.info("Deleted inventory category", { userId, categoryId });

    return successResponse({ message: "Category deleted successfully" });
  },
  ["admin"]
);
