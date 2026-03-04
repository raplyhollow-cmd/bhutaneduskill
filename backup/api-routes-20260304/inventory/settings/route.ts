/**
 * Inventory Settings API
 * Handles per-school inventory settings and configuration
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { inventorySettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";

// ============================================================================
// GET /api/inventory/settings - Get inventory settings for school
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    // Get settings for user's school
    let [settings] = await db
      .select()
      .from(inventorySettings)
      .where(eq(inventorySettings.schoolId, user.schoolId || ""))
      .limit(1);

    // If settings don't exist, create default settings
    if (!settings) {
      const now = new Date();
      const settingsId = `settings-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const [newSettings] = await db
        .insert(inventorySettings)
        .values({
          id: settingsId,
          schoolId: user.schoolId || "",
          defaultReorderLevel: 10,
          defaultMinimumStock: 5,
          lowStockAlertEnabled: true,
          expiryAlertEnabled: true,
          expiryAlertDays: 30,
          purchaseOrderApprovalRequired: true,
          purchaseOrderApprovalThreshold: 10000,
          disposalApprovalRequired: true,
          depreciationMethod: "straight_line",
          defaultUsefulLife: 5,
          assetNumberPrefix: "AST",
          purchaseOrderPrefix: "PO",
          purchaseOrderNextNumber: 1,
          alertEmails: [],
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      settings = newSettings;
    }

    logger.info("Fetched inventory settings", { userId, schoolId: user.schoolId });

    return { settings };
  },
  ['admin']
);

// ============================================================================
// PATCH /api/inventory/settings - Update inventory settings
// ============================================================================

interface UpdateSettingsInput {
  defaultReorderLevel?: number;
  defaultMinimumStock?: number;
  lowStockAlertEnabled?: boolean;
  expiryAlertEnabled?: boolean;
  expiryAlertDays?: number;
  purchaseOrderApprovalRequired?: boolean;
  purchaseOrderApprovalThreshold?: number;
  disposalApprovalRequired?: boolean;
  depreciationMethod?: string;
  defaultUsefulLife?: number;
  assetNumberPrefix?: string;
  purchaseOrderPrefix?: string;
  purchaseOrderNextNumber?: number;
  alertEmails?: string[];
}

export const PATCH = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user, userId } = auth;

    const data: UpdateSettingsInput = await request.json();

    // Get existing settings
    let [settings] = await db
      .select()
      .from(inventorySettings)
      .where(eq(inventorySettings.schoolId, user.schoolId || ""))
      .limit(1);

    // If settings don't exist, create them first
    if (!settings) {
      const now = new Date();
      const settingsId = `settings-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      const [newSettings] = await db
        .insert(inventorySettings)
        .values({
          id: settingsId,
          schoolId: user.schoolId || "",
          defaultReorderLevel: 10,
          defaultMinimumStock: 5,
          lowStockAlertEnabled: true,
          expiryAlertEnabled: true,
          expiryAlertDays: 30,
          purchaseOrderApprovalRequired: true,
          purchaseOrderApprovalThreshold: 10000,
          disposalApprovalRequired: true,
          depreciationMethod: "straight_line",
          defaultUsefulLife: 5,
          assetNumberPrefix: "AST",
          purchaseOrderPrefix: "PO",
          purchaseOrderNextNumber: 1,
          alertEmails: [],
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      settings = newSettings;
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    const allowedFields: (keyof UpdateSettingsInput)[] = [
      "defaultReorderLevel",
      "defaultMinimumStock",
      "lowStockAlertEnabled",
      "expiryAlertEnabled",
      "expiryAlertDays",
      "purchaseOrderApprovalRequired",
      "purchaseOrderApprovalThreshold",
      "disposalApprovalRequired",
      "depreciationMethod",
      "defaultUsefulLife",
      "assetNumberPrefix",
      "purchaseOrderPrefix",
      "purchaseOrderNextNumber",
      "alertEmails",
    ];

    for (const field of allowedFields) {
      if (field in data && data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    const [updatedSettings] = await db
      .update(inventorySettings)
      .set(updateData)
      .where(eq(inventorySettings.id, settings.id))
      .returning();

    logger.info("Updated inventory settings", { userId, settingsId: settings.id });

    return { settings: updatedSettings };
  },
  ['admin']
);
