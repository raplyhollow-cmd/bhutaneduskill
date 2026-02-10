import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq, and, desc, like, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// GET /api/inventory/items - Get inventory items
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") || currentUser.schoolId;
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const itemType = searchParams.get("itemType");
    const status = searchParams.get("status");
    const lowStock = searchParams.get("lowStock") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const {
      inventoryItems: inventoryItemsTable,
      inventoryCategories: inventoryCategoriesTable,
    } = await import("@/lib/db/inventory-schema");

    // Build conditions
    const conditions = [eq(inventoryItemsTable.schoolId, schoolId || "")];

    if (search) {
      conditions.push(
        or(
          like(inventoryItemsTable.name, `%${search}%`),
          like(inventoryItemsTable.sku || "", `%${search}%`),
          like(inventoryItemsTable.barcode || "", `%${search}%`)
        )!
      );
    }

    if (category) {
      conditions.push(eq(inventoryItemsTable.categoryId, category));
    }

    if (itemType) {
      conditions.push(eq(inventoryItemsTable.itemType, itemType));
    }

    if (status) {
      conditions.push(eq(inventoryItemsTable.status, status));
    }

    if (lowStock) {
      // Will filter in code after query
    }

    // Get total count
    const { count } = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryItemsTable)
      .where(and(...conditions.filter(Boolean)))
      .then(([res]) => ({ count: res?.count || 0 }));

    // Get items
    const items = await db.query.inventoryItems.findMany({
      where: and(...conditions.filter(Boolean)),
      orderBy: [desc(inventoryItemsTable.createdAt)],
      limit,
      offset,
    });

    // Filter low stock in code and enrich with category
    const enrichedItems = await Promise.all(
      items
        .filter((item) => {
          if (lowStock) {
            return item.quantity <= (item.minimumStock || 0);
          }
          return true;
        })
        .map(async (item) => {
          const category = await db.query.inventoryCategories.findFirst({
            where: eq(inventoryCategoriesTable.id, item.categoryId),
          });

          return {
            ...item,
            category: category
              ? {
                  id: category.id,
                  name: category.name,
                  code: category.code,
                }
              : null,
            isLowStock: item.quantity <= (item.minimumStock || 0),
            stockStatus:
              item.quantity <= (item.minimumStock || 0)
                ? "low"
                : item.quantity >= (item.maximumStock || Infinity)
                ? "overstock"
                : "normal",
          };
        })
    );

    return NextResponse.json({
      items: enrichedItems,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    console.error("Inventory items fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}

// ============================================================================
// POST /api/inventory/items - Add new inventory item
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admins can add items
    if (currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      description,
      sku,
      barcode,
      categoryId,
      itemType,
      isFixedAsset,
      serialNumber,
      manufacturer,
      model,
      specifications,
      location,
      quantity,
      unit,
      minimumStock,
      maximumStock,
      reorderLevel,
      purchasePrice,
      condition,
    } = body;

    // Validate required fields
    if (!name || !categoryId || !itemType || !unit) {
      return NextResponse.json(
        { error: "Missing required fields: name, categoryId, itemType, unit" },
        { status: 400 }
      );
    }

    const { inventoryItems: inventoryItemsTable, inventoryTransactions: inventoryTransactionsTable } =
      await import("@/lib/db/inventory-schema");

    // Check SKU uniqueness
    if (sku) {
      const existing = await db.query.inventoryItems.findFirst({
        where: eq(inventoryItemsTable.sku || "", sku),
      });

      if (existing) {
        return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
      }
    }

    // Generate SKU if not provided
    const generatedSku = sku || `${itemType.toUpperCase().substring(0, 3)}-${Date.now().toString().slice(-6)}`;

    // Create item
    const [item] = await db.insert(inventoryItemsTable).values({
      id: nanoid(),
      schoolId: currentUser.schoolId || "",
      name,
      description,
      sku: generatedSku,
      barcode,
      categoryId,
      itemType,
      isFixedAsset: isFixedAsset || false,
      assetTag: isFixedAsset ? `AST-${Date.now().toString().slice(-6)}` : null,
      serialNumber,
      manufacturer,
      model,
      specifications,
      location,
      quantity: quantity || 0,
      unit,
      minimumStock: minimumStock || 0,
      maximumStock: maximumStock || 0,
      reorderLevel: reorderLevel || 0,
      purchasePrice: purchasePrice || null,
      currentValue: purchasePrice || null,
      condition: condition || "new",
      status: quantity > 0 ? "available" : "out_of_stock",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create initial transaction if quantity > 0
    if (quantity > 0) {
      await db.insert(inventoryTransactionsTable).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        itemId: item.id,
        transactionType: "purchase",
        transactionDate: new Date().toISOString(),
        quantity: quantity,
        balanceAfter: quantity,
        unitPrice: purchasePrice || 0,
        totalValue: (purchasePrice || 0) * quantity,
        performedBy: currentUser.id,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("Inventory item creation error:", error);
    return NextResponse.json({ error: "Failed to create item" }, { status: 500 });
  }
}

// ============================================================================
// PATCH /api/inventory/items - Update inventory item
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, action } = body; // action: "update", "adjust_stock", "assign", "return"

    if (!itemId || !action) {
      return NextResponse.json(
        { error: "Missing required fields: itemId, action" },
        { status: 400 }
      );
    }

    const {
      inventoryItems: inventoryItemsTable,
      inventoryTransactions: inventoryTransactionsTable,
      assetAssignments: assetAssignmentsTable,
    } = await import("@/lib/db/inventory-schema");

    const item = await db.query.inventoryItems.findFirst({
      where: eq(inventoryItemsTable.id, itemId),
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (action === "adjust_stock") {
      const { quantity, reason, transactionType } = body;

      if (quantity === undefined) {
        return NextResponse.json({ error: "Quantity required" }, { status: 400 });
      }

      const newQuantity = item.quantity + quantity;

      if (newQuantity < 0) {
        return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
      }

      // Update item
      const [updated] = await db
        .update(inventoryItemsTable)
        .set({
          quantity: newQuantity,
          status: newQuantity > 0 ? "available" : "out_of_stock",
          updatedAt: new Date(),
        })
        .where(eq(inventoryItemsTable.id, itemId))
        .returning();

      // Create transaction record
      await db.insert(inventoryTransactionsTable).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        itemId: item.id,
        transactionType: transactionType || "adjustment",
        transactionDate: new Date().toISOString(),
        quantity: quantity,
        balanceAfter: newQuantity,
        unitPrice: item.purchasePrice || 0,
        totalValue: (item.purchasePrice || 0) * Math.abs(quantity),
        performedBy: currentUser.id,
        reason,
        createdAt: new Date(),
      });

      return NextResponse.json({
        item: updated,
        message: "Stock adjusted successfully",
      });
    }

    if (action === "assign") {
      const { assignedToId, assignedToName, assignedToType, expectedReturnDate } = body;

      if (!assignedToId || !assignedToType) {
        return NextResponse.json(
          { error: "Missing required fields: assignedToId, assignedToType" },
          { status: 400 }
        );
      }

      if (item.quantity < 1) {
        return NextResponse.json({ error: "Item out of stock" }, { status: 400 });
      }

      // Create assignment
      const [assignment] = await db.insert(assetAssignmentsTable).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        itemId: item.id,
        itemName: item.name,
        assignedToId,
        assignedToName,
        assignedToType,
        assignmentType: "temporary",
        assignmentDate: new Date().toISOString(),
        expectedReturnDate,
        conditionAtAssignment: item.condition,
        status: "active",
        approvedBy: currentUser.id,
        approvedDate: new Date().toISOString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      // Update item
      const [updated] = await db
        .update(inventoryItemsTable)
        .set({
          quantity: item.quantity - 1,
          assignedTo: assignedToId,
          assignedDate: new Date().toISOString(),
          assignedUntil: expectedReturnDate,
          status: "in_use",
          updatedAt: new Date(),
        })
        .where(eq(inventoryItemsTable.id, itemId))
        .returning();

      // Create transaction
      await db.insert(inventoryTransactionsTable).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        itemId: item.id,
        transactionType: "transfer",
        transactionDate: new Date().toISOString(),
        quantity: -1,
        balanceAfter: item.quantity - 1,
        performedBy: currentUser.id,
        reason: `Assigned to ${assignedToName || assignedToId}`,
        destinationLocation: assignedToId,
        createdAt: new Date(),
      });

      return NextResponse.json({
        item: updated,
        assignment,
        message: "Item assigned successfully",
      });
    }

    if (action === "return") {
      const { assignmentId, condition } = body;

      if (!assignmentId) {
        return NextResponse.json({ error: "Assignment ID required" }, { status: 400 });
      }

      const assignment = await db.query.assetAssignments.findFirst({
        where: eq(assetAssignmentsTable.id, assignmentId),
      });

      if (!assignment) {
        return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
      }

      // Update assignment
      await db
        .update(assetAssignmentsTable)
        .set({
          status: "returned",
          actualReturnDate: new Date().toISOString(),
          conditionAtReturn: condition || item.condition,
          returnNotes: body.notes,
          updatedAt: new Date(),
        })
        .where(eq(assetAssignmentsTable.id, assignmentId));

      // Update item
      const [updated] = await db
        .update(inventoryItemsTable)
        .set({
          quantity: item.quantity + 1,
          assignedTo: null,
          assignedDate: null,
          assignedUntil: null,
          condition: condition || item.condition,
          status: "available",
          updatedAt: new Date(),
        })
        .where(eq(inventoryItemsTable.id, itemId))
        .returning();

      // Create transaction
      await db.insert(inventoryTransactionsTable).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        itemId: item.id,
        transactionType: "return",
        transactionDate: new Date().toISOString(),
        quantity: 1,
        balanceAfter: item.quantity + 1,
        performedBy: currentUser.id,
        reason: `Returned by ${assignment.assignedToName || assignment.assignedToId}`,
        sourceLocation: assignment.assignedToId,
        createdAt: new Date(),
      });

      return NextResponse.json({
        item: updated,
        message: "Item returned successfully",
      });
    }

    // Generic update
    const { name, description, location, unit, minimumStock, maximumStock, reorderLevel } = body;

    const [updated] = await db
      .update(inventoryItemsTable)
      .set({
        name: name || item.name,
        description: description !== undefined ? description : item.description,
        location: location || item.location,
        unit: unit || item.unit,
        minimumStock: minimumStock !== undefined ? minimumStock : item.minimumStock,
        maximumStock: maximumStock !== undefined ? maximumStock : item.maximumStock,
        reorderLevel: reorderLevel !== undefined ? reorderLevel : item.reorderLevel,
        updatedAt: new Date(),
      })
      .where(eq(inventoryItemsTable.id, itemId))
      .returning();

    return NextResponse.json({ item: updated, message: "Item updated successfully" });
  } catch (error) {
    console.error("Inventory item update error:", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}
