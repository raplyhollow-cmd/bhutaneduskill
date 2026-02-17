/**
 * Inventory Settings API
 * Handles per-school inventory settings and configuration
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { inventorySettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// GET /api/inventory/settings - Get inventory settings for school
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
    const { user, userId } = authResult;

    // Get settings for user's school
    let settings = await db.query.inventorySettings.findFirst({
      where: eq(inventorySettings.schoolId, user.schoolId || ""),
    });

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

    return NextResponse.json({
      data: settings,
      message: "Settings fetched successfully",
    } satisfies ApiSuccess<typeof settings>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/settings", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch settings", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

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

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user, userId } = authResult;

    const data: UpdateSettingsInput = await request.json();

    // Get existing settings
    let settings = await db.query.inventorySettings.findFirst({
      where: eq(inventorySettings.schoolId, user.schoolId || ""),
    });

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

    return NextResponse.json({
      data: updatedSettings,
      message: "Settings updated successfully",
    } satisfies ApiSuccess<typeof updatedSettings>);
  } catch (error) {
    logger.apiError(error, { route: "/api/inventory/settings", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update settings", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
