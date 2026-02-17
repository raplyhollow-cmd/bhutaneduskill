/**
 * Inventory Categories API
 * Handles inventory item categories
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { inventoryCategories } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination } from "@/types";

// ============================================================================
// GET /api/inventory/categories - List inventory categories
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user } = authResult;

    const { searchParams } = new URL(request.url);
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

    return NextResponse.json({
      data: categories,
    } satisfies ApiSuccess<typeof categories>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/categories", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch categories", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory/categories - Create new category
// ============================================================================

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const data: CreateCategoryInput = await request.json();

    if (!data.name) {
      return NextResponse.json(
        { error: "Missing required field: name", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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

    return NextResponse.json({
      data: newCategory,
      message: "Category created successfully",
    } satisfies ApiSuccess<typeof newCategory>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/categories", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create category", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/inventory/categories - Update category
// ============================================================================

interface UpdateCategoryInput extends Partial<Omit<CreateCategoryInput, 'isActive'>> {
  id: string;
  isActive?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const data: UpdateCategoryInput = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Category ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.query.inventoryCategories.findFirst({
      where: eq(inventoryCategories.id, data.id),
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
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

    return NextResponse.json({
      data: updatedCategory,
      message: "Category updated successfully",
    } satisfies ApiSuccess<typeof updatedCategory>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/categories", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update category", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/inventory/categories - Delete category
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("id");

    if (!categoryId) {
      return NextResponse.json(
        { error: "Category ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if category exists
    const existingCategory = await db.query.inventoryCategories.findFirst({
      where: eq(inventoryCategories.id, categoryId),
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: "Category not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Check if category has child categories
    const childCategories = await db.query.inventoryCategories.findMany({
      where: eq(inventoryCategories.parentId, categoryId),
    });

    if (childCategories.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category with child categories. Please delete or reassign child categories first.",
          status: 400,
        } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    await db.delete(inventoryCategories).where(eq(inventoryCategories.id, categoryId));

    logger.info("Deleted inventory category", { userId, categoryId });

    return NextResponse.json({
      data: { message: "Category deleted successfully" },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/categories", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete category", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
