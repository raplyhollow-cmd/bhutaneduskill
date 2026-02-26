import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { medicineInventory, medicineTransactions } from "@/lib/db/schema";
import { eq, and, desc, sql, Sql } from "drizzle-orm";

type DrizzleCondition = Sql<boolean> | ReturnType<typeof eq>;

/**
 * GET /api/school-admin/medical/inventory - Get medicine inventory
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);

    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const lowStock = searchParams.get('lowStock') === 'true';

    const whereConditions: DrizzleCondition[] = [eq(medicineInventory.schoolId, user.schoolId)];

    if (category) {
      whereConditions.push(eq(medicineInventory.category, category));
    }
    if (status) {
      whereConditions.push(eq(medicineInventory.status, status));
    }
    if (lowStock) {
      // Use SQL for low stock comparison
      whereConditions.push(sql`${medicineInventory.currentStock} <= ${medicineInventory.minimumStock}`);
    }

    const inventory = await db.query.medicineInventory.findMany({
      where: whereConditions.length > 1 ? and(...whereConditions) : whereConditions[0],
      orderBy: [desc(medicineInventory.createdAt)],
    });

    // Calculate summary
    const summary = {
      totalItems: inventory.length,
      totalValue: inventory.reduce((sum, item) => {
        const cost = parseFloat(item.unitCost || '0');
        return sum + (cost * item.currentStock);
      }, 0),
      lowStockItems: inventory.filter(item => item.currentStock <= item.minimumStock).length,
      expiredItems: inventory.filter(item => {
        if (!item.expiryDate) return false;
        return new Date(item.expiryDate) < new Date();
      }).length,
    };

    return NextResponse.json({
      success: true,
      data: { inventory, summary },
    });
  } catch (error) {
    logger.error("Medicine inventory fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch inventory" }, { status: 500 });
  }
}

/**
 * POST /api/school-admin/medical/inventory - Add new medicine to inventory
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, userId } = authResult;
    const body = await request.json();

    const {
      medicineName,
      genericName,
      category,
      description,
      currentStock,
      minimumStock,
      maximumStock,
      unit,
      unitCost,
      expiryDate,
      batchNumber,
      manufacturer,
      supplier,
      storageLocation,
      storageConditions,
      isPrescriptionRequired,
      notes,
    } = body;

    if (!medicineName || !category || !unit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const medicineId = `med-inv-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

    const [newItem] = await db.insert(medicineInventory).values({
      id: medicineId,
      schoolId: user.schoolId,
      medicineName,
      genericName,
      category,
      description,
      currentStock: currentStock || 0,
      minimumStock: minimumStock || 10,
      maximumStock,
      unit,
      unitCost: unitCost?.toString(),
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      batchNumber,
      manufacturer,
      supplier,
      storageLocation,
      storageConditions,
      isPrescriptionRequired: isPrescriptionRequired || false,
      status: 'available',
      lastRestocked: new Date(),
      notes,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();

    // Create transaction record for initial stock
    if (currentStock > 0) {
      await db.insert(medicineTransactions).values({
        id: `med-tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        medicineId,
        schoolId: user.schoolId,
        transactionType: 'restock',
        quantity: currentStock,
        transactionDate: new Date(),
        referenceType: 'restock',
        performedBy: userId,
        stockAfter: currentStock,
        createdAt: new Date(),
      });
    }

    logger.info("Medicine added to inventory", { medicineId, schoolId: user.schoolId });

    return NextResponse.json({
      success: true,
      data: { item: newItem },
    });
  } catch (error) {
    logger.error("Medicine inventory add error:", error);
    return NextResponse.json({ error: "Failed to add medicine" }, { status: 500 });
  }
}

/**
 * PATCH /api/school-admin/medical/inventory - Update medicine inventory
 */
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(['school-admin', 'admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { user, userId } = authResult;
    const body = await request.json();

    const { id, action, quantity, notes } = body;

    if (!id || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Get current item
    const item = await db.query.medicineInventory.findFirst({
      where: eq(medicineInventory.id, id),
    });

    if (!item) {
      return NextResponse.json({ error: "Medicine not found" }, { status: 404 });
    }

    let newStock = item.currentStock;
    let transactionType = 'adjustment';

    if (action === 'restock') {
      newStock = item.currentStock + (quantity || 0);
      transactionType = 'restock';
    } else if (action === 'usage') {
      newStock = item.currentStock - (quantity || 0);
      transactionType = 'usage';
    } else if (action === 'discard') {
      newStock = item.currentStock - (quantity || 0);
      transactionType = 'discard';
    } else if (action === 'adjustment') {
      newStock = quantity || item.currentStock;
    }

    if (newStock < 0) {
      return NextResponse.json({ error: "Insufficient stock" }, { status: 400 });
    }

    // Update inventory
    const [updatedItem] = await db.update(medicineInventory)
      .set({
        currentStock: newStock,
        status: newStock <= item.minimumStock ? 'low_stock' : 'available',
        lastUsed: action === 'usage' ? new Date() : item.lastUsed,
        lastRestocked: action === 'restock' ? new Date() : item.lastRestocked,
        updatedAt: new Date(),
      })
      .where(eq(medicineInventory.id, id))
      .returning();

    // Create transaction record
    await db.insert(medicineTransactions).values({
      id: `med-tx-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      medicineId: id,
      schoolId: user.schoolId,
      transactionType,
      quantity: action === 'restock' ? (quantity || 0) : -(quantity || 0),
      transactionDate: new Date(),
      referenceType: body.referenceType || 'adjustment',
      referenceId: body.referenceId,
      performedBy: userId,
      notes,
      stockAfter: newStock,
      createdAt: new Date(),
    });

    logger.info("Medicine inventory updated", { id, action, newStock, schoolId: user.schoolId });

    return NextResponse.json({
      success: true,
      data: { item: updatedItem },
    });
  } catch (error) {
    logger.error("Medicine inventory update error:", error);
    return NextResponse.json({ error: "Failed to update inventory" }, { status: 500 });
  }
}
