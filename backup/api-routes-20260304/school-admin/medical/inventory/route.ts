import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { medicineInventory, medicineTransactions } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

type DrizzleCondition = SQL | ReturnType<typeof eq>;

interface InventorySummary {
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  expiredItems: number;
}

interface InventoryResponse {
  inventory: unknown[];
  summary: InventorySummary;
}

interface InventoryItemResponse {
  item: unknown;
}

interface InventoryRequest {
  medicineName: string;
  genericName?: string;
  category: string;
  description?: string;
  currentStock?: number;
  minimumStock?: number;
  maximumStock?: number;
  unit: string;
  unitCost?: number;
  expiryDate?: string;
  batchNumber?: string;
  manufacturer?: string;
  supplier?: string;
  storageLocation?: string;
  storageConditions?: string;
  isPrescriptionRequired?: boolean;
  notes?: string;
}

interface InventoryUpdateRequest {
  id: string;
  action: 'restock' | 'usage' | 'discard' | 'adjustment';
  quantity?: number;
  notes?: string;
  referenceType?: string;
  referenceId?: string;
}

/**
 * GET /api/school-admin/medical/inventory - Get medicine inventory
 */
export const GET = createApiRoute<{}, InventoryResponse>(
  async (req, { user }) => {
    const { searchParams } = new URL(req.url);

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

    const inventory = await db
      .select()
      .from(medicineInventory)
      .where(whereConditions.length > 1 ? sql`${whereConditions[0]} AND ${whereConditions.slice(1).join(' AND ')}` : whereConditions[0])
      .orderBy(desc(medicineInventory.createdAt));

    // Calculate summary
    const summary: InventorySummary = {
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

    return { data: { inventory, summary } };
  },
  ['school-admin', 'admin']
);

/**
 * POST /api/school-admin/medical/inventory - Add new medicine to inventory
 */
export const POST = createApiRoute<{}, InventoryItemResponse>(
  async (req, { user, userId }) => {
    const body: InventoryRequest = await req.json();

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
      return { error: "Missing required fields", status: 400 };
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
    if (currentStock && currentStock > 0) {
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

    return { data: { item: newItem } };
  },
  ['school-admin', 'admin']
);

/**
 * PATCH /api/school-admin/medical/inventory - Update medicine inventory
 */
export const PATCH = createApiRoute<{}, InventoryItemResponse>(
  async (req, { user, userId }) => {
    const body: InventoryUpdateRequest = await req.json();

    const { id, action, quantity, notes } = body;

    if (!id || !action) {
      return { error: "Missing required fields", status: 400 };
    }

    // Get current item
    const [item] = await db
      .select()
      .from(medicineInventory)
      .where(eq(medicineInventory.id, id))
      .limit(1);

    if (!item) {
      return { error: "Medicine not found", status: 404 };
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
      return { error: "Insufficient stock", status: 400 };
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

    return { data: { item: updatedItem } };
  },
  ['school-admin', 'admin']
);
