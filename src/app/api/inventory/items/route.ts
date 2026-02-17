/**
 * Inventory Items API
 * Handles CRUD operations for inventory items
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { inventoryItems, inventoryCategories, users } from "@/lib/db/schema";
import { eq, and, desc, like, sql, or, isNull } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse, Pagination, ListQueryParams } from "@/types";

interface PaginatedData<T> {
  items: T[];
  pagination: Pagination;
}

// ============================================================================
// GET /api/inventory/items - List inventory items
// ============================================================================

interface InventoryItemFilters {
  search?: string;
  category?: string;
  itemType?: string;
  status?: string;
  condition?: string;
  lowStock?: boolean;
  location?: string;
}

interface GetItemsQuery extends ListQueryParams {
  category?: string;
  itemType?: string;
  status?: string;
  condition?: string;
  lowStock?: string;
  location?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 20));
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const itemType = searchParams.get("itemType") || "";
    const status = searchParams.get("status") || "";
    const condition = searchParams.get("condition") || "";
    const lowStock = searchParams.get("lowStock") === "true";
    const location = searchParams.get("location") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    // Build where conditions
    const conditions: ReturnType<typeof sql>[] = [];

    // Only show items from user's school (for school admin) or all items (for platform admin)
    if (user.schoolId) {
      conditions.push(eq(inventoryItems.schoolId, user.schoolId));
    }

    if (search) {
      const searchConditions = [
        like(inventoryItems.name, `%${search}%`),
        like(inventoryItems.sku, `%${search}%`),
      ];
      if (inventoryItems.description !== null) {
        searchConditions.push(like(inventoryItems.description, `%${search}%`));
      }
      conditions.push(or(...searchConditions)!);
    }

    if (category) {
      conditions.push(eq(inventoryItems.categoryId, category));
    }

    if (itemType) {
      conditions.push(eq(inventoryItems.itemType, itemType));
    }

    if (status) {
      conditions.push(eq(inventoryItems.status, status));
    }

    if (condition) {
      conditions.push(eq(inventoryItems.condition, condition));
    }

    if (lowStock) {
      conditions.push(
        sql`${inventoryItems.quantity} <= COALESCE(${inventoryItems.minimumStock}, 10)`
      );
    }

    if (location) {
      conditions.push(
        inventoryItems.location !== null ? like(inventoryItems.location, `%${location}%`) : sql`1=0`
      );
    }

    // Get total count
    const countResult = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = countResult[0]?.count || 0;

    // Build order by
    let orderByColumn:
      | typeof inventoryItems.name
      | typeof inventoryItems.quantity
      | typeof inventoryItems.createdAt
      | typeof inventoryItems.updatedAt = inventoryItems.createdAt;

    if (sortBy === "name") orderByColumn = inventoryItems.name;
    if (sortBy === "quantity") orderByColumn = inventoryItems.quantity;
    if (sortBy === "updatedAt") orderByColumn = inventoryItems.updatedAt;

    const orderByDirection = sortOrder === "asc" ? orderByColumn : desc(orderByColumn);

    // Get items with pagination
    const items = await db
      .select({
        id: inventoryItems.id,
        schoolId: inventoryItems.schoolId,
        name: inventoryItems.name,
        description: inventoryItems.description,
        sku: inventoryItems.sku,
        barcode: inventoryItems.barcode,
        qrCode: inventoryItems.qrCode,
        categoryId: inventoryItems.categoryId,
        itemType: inventoryItems.itemType,
        isFixedAsset: inventoryItems.isFixedAsset,
        assetTag: inventoryItems.assetTag,
        serialNumber: inventoryItems.serialNumber,
        purchaseDate: inventoryItems.purchaseDate,
        purchasePrice: inventoryItems.purchasePrice,
        currentValue: inventoryItems.currentValue,
        depreciation: inventoryItems.depreciation,
        manufacturer: inventoryItems.manufacturer,
        model: inventoryItems.model,
        year: inventoryItems.year,
        specifications: inventoryItems.specifications,
        location: inventoryItems.location,
        buildingId: inventoryItems.buildingId,
        roomId: inventoryItems.roomId,
        shelf: inventoryItems.shelf,
        rack: inventoryItems.rack,
        bin: inventoryItems.bin,
        quantity: inventoryItems.quantity,
        minimumStock: inventoryItems.minimumStock,
        maximumStock: inventoryItems.maximumStock,
        reorderLevel: inventoryItems.reorderLevel,
        reorderQuantity: inventoryItems.reorderQuantity,
        unit: inventoryItems.unit,
        condition: inventoryItems.condition,
        status: inventoryItems.status,
        assignedTo: inventoryItems.assignedTo,
        assignedDate: inventoryItems.assignedDate,
        assignedUntil: inventoryItems.assignedUntil,
        lastMaintenanceDate: inventoryItems.lastMaintenanceDate,
        nextMaintenanceDate: inventoryItems.nextMaintenanceDate,
        warrantyExpiry: inventoryItems.warrantyExpiry,
        photoUrls: inventoryItems.photoUrls,
        notes: inventoryItems.notes,
        createdAt: inventoryItems.createdAt,
        updatedAt: inventoryItems.updatedAt,
      })
      .from(inventoryItems)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderByDirection)
      .limit(limit)
      .offset((page - 1) * limit);

    // Fetch categories for category names
    const categoryIds = Array.from(new Set(items.map((item) => item.categoryId)));
    const categories = await db
      .select()
      .from(inventoryCategories)
      .where(categoryIds.length > 0 ? sql`id = ANY(${categoryIds})` : undefined);

    const categoryMap = new Map(categories.map((cat) => [cat.id, cat]));

    // Attach category names and check low stock
    const itemsWithCategory = items.map((item) => {
      const category = categoryMap.get(item.categoryId);
      const isLowStock =
        item.quantity <= (item.minimumStock || category?.alertThreshold || 10);

      return {
        ...item,
        categoryName: category?.name || "Uncategorized",
        categoryCode: category?.code,
        isLowStock,
      };
    });

    const pagination: Pagination = {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };

    logger.info("Fetched inventory items", { userId, count: items.length });

    return NextResponse.json({
      data: {
        items: itemsWithCategory,
        pagination,
      },
    } satisfies ApiSuccess<PaginatedData<typeof itemsWithCategory[0]>>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/items", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch inventory items", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/inventory/items - Create new inventory item
// ============================================================================

interface CreateItemInput {
  name: string;
  description?: string;
  sku?: string;
  barcode?: string;
  categoryId: string;
  itemType: string;
  isFixedAsset?: boolean;
  assetTag?: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  manufacturer?: string;
  model?: string;
  year?: number;
  specifications?: Record<string, unknown>;
  location?: string;
  buildingId?: string;
  roomId?: string;
  shelf?: string;
  rack?: string;
  bin?: string;
  quantity?: number;
  minimumStock?: number;
  maximumStock?: number;
  reorderLevel?: number;
  reorderQuantity?: number;
  unit?: string;
  condition?: string;
  status?: string;
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  warrantyExpiry?: string;
  photoUrls?: string[];
  notes?: string;
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

    const data: CreateItemInput = await request.json();

    // Validate required fields
    if (!data.name || !data.categoryId || !data.itemType) {
      return NextResponse.json(
        { error: "Missing required fields: name, categoryId, itemType", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Generate unique IDs
    const itemId = `item-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    const sku = data.sku || `SKU-${Date.now()}`;

    // Validate category exists
    const category = await db.query.inventoryCategories.findFirst({
      where: eq(inventoryCategories.id, data.categoryId),
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const now = new Date();

    const [newItem] = await db
      .insert(inventoryItems)
      .values({
        id: itemId,
        schoolId: user.schoolId || "",
        name: data.name,
        description: data.description || null,
        sku,
        barcode: data.barcode || null,
        qrCode: null,
        categoryId: data.categoryId,
        itemType: data.itemType,
        isFixedAsset: data.isFixedAsset || false,
        assetTag: data.assetTag || null,
        serialNumber: data.serialNumber || null,
        purchaseDate: data.purchaseDate || null,
        purchasePrice: data.purchasePrice || null,
        currentValue: data.purchasePrice || null,
        depreciation: null,
        manufacturer: data.manufacturer || null,
        model: data.model || null,
        year: data.year || null,
        specifications: data.specifications || null,
        location: data.location || null,
        buildingId: data.buildingId || null,
        roomId: data.roomId || null,
        shelf: data.shelf || null,
        rack: data.rack || null,
        bin: data.bin || null,
        quantity: data.quantity || 0,
        minimumStock: data.minimumStock ?? category.alertThreshold ?? 10,
        maximumStock: data.maximumStock || null,
        reorderLevel: data.reorderLevel ?? category.alertThreshold ?? 10,
        reorderQuantity: data.reorderQuantity || null,
        unit: data.unit || "pieces",
        condition: data.condition || "new",
        status: data.status || "available",
        assignedTo: null,
        assignedDate: null,
        assignedUntil: null,
        lastMaintenanceDate: data.lastMaintenanceDate || null,
        nextMaintenanceDate: data.nextMaintenanceDate || null,
        warrantyExpiry: data.warrantyExpiry || null,
        photoUrls: data.photoUrls || null,
        notes: data.notes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    logger.info("Created inventory item", { userId, itemId });

    return NextResponse.json({
      data: newItem,
      message: "Inventory item created successfully",
    } satisfies ApiSuccess<typeof newItem>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/items", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create inventory item", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/inventory/items - Update inventory item
// ============================================================================

interface UpdateItemInput extends Partial<CreateItemInput> {
  id: string;
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

    const data: UpdateItemInput = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Item ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, data.id),
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: (keyof CreateItemInput)[] = [
      "name",
      "description",
      "sku",
      "barcode",
      "categoryId",
      "itemType",
      "isFixedAsset",
      "assetTag",
      "serialNumber",
      "purchaseDate",
      "purchasePrice",
      "manufacturer",
      "model",
      "year",
      "specifications",
      "location",
      "buildingId",
      "roomId",
      "shelf",
      "rack",
      "bin",
      "quantity",
      "minimumStock",
      "maximumStock",
      "reorderLevel",
      "reorderQuantity",
      "unit",
      "condition",
      "status",
      "lastMaintenanceDate",
      "nextMaintenanceDate",
      "warrantyExpiry",
      "photoUrls",
      "notes",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updatedItem] = await db
      .update(inventoryItems)
      .set(updateData)
      .where(eq(inventoryItems.id, data.id))
      .returning();

    logger.info("Updated inventory item", { userId, itemId: data.id });

    return NextResponse.json({
      data: updatedItem,
      message: "Inventory item updated successfully",
    } satisfies ApiSuccess<typeof updatedItem>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/items", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update inventory item", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/inventory/items - Delete inventory item
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
    const itemId = searchParams.get("id");

    if (!itemId) {
      return NextResponse.json(
        { error: "Item ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check if item exists
    const existingItem = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItems.id, itemId),
    });

    if (!existingItem) {
      return NextResponse.json(
        { error: "Item not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    await db.delete(inventoryItems).where(eq(inventoryItems.id, itemId));

    logger.info("Deleted inventory item", { userId, itemId });

    return NextResponse.json({
      data: { message: "Inventory item deleted successfully" },
    } satisfies ApiSuccess<{ message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/items", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete inventory item", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
