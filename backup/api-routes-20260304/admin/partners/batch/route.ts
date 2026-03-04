/**
 * Partners Batch Operations API
 *
 * POST /api/admin/partners/batch - Bulk operations on multiple partners
 *
 * Supported operations:
 * - activate: Set status = "active" for multiple partners
 * - deactivate: Set status = "inactive" for multiple partners
 * - delete: Soft delete multiple partners (set status = "inactive")
 * - export: Generate CSV export of partners
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { eq, inArray, and, or, sql } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

type BatchOperation = "activate" | "deactivate" | "delete" | "export";

interface BatchRequest {
  operation: BatchOperation;
  partnerIds: string[];
  filters?: {
    type?: string;
    status?: string;
    schoolId?: string;
  };
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateBatchRequest(data: BatchRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.operation) {
    errors.push("Operation is required");
  } else if (!["activate", "deactivate", "delete", "export"].includes(data.operation)) {
    errors.push("Invalid operation. Must be one of: activate, deactivate, delete, export");
  }

  // For non-export operations, partnerIds is required
  if (data.operation !== "export" && (!data.partnerIds || data.partnerIds.length === 0)) {
    errors.push("Partner IDs are required for this operation");
  }

  // Limit batch size
  if (data.partnerIds && data.partnerIds.length > 100) {
    errors.push("Cannot process more than 100 partners at once");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert array of objects to CSV string
 */
function arrayToCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";

  // Get headers from first object
  const headers = Object.keys(data[0]);

  // Create CSV header
  const headerRow = headers.join(",");

  // Create CSV rows
  const rows = data.map((obj) => {
    return headers
      .map((header) => {
        const value = obj[header];
        // Handle values that contain commas or quotes
        if (value === null || value === undefined) return '""';
        const stringValue = String(value);
        if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",");
  });

  return [headerRow, ...rows].join("\n");
}

/**
 * Get partners based on IDs or filters
 */
async function getPartnersForBatch(partnerIds?: string[], filters?: BatchRequest["filters"]) {
  const conditions = [];

  // Filter by IDs if provided
  if (partnerIds && partnerIds.length > 0) {
    conditions.push(inArray(partners.id, partnerIds));
  }

  // Apply additional filters
  if (filters?.type) {
    conditions.push(eq(partners.type, filters.type));
  }

  if (filters?.status) {
    conditions.push(eq(partners.status, filters.status));
  }

  if (filters?.schoolId) {
    conditions.push(eq(partners.schoolId, filters.schoolId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const result = await db
    .select()
    .from(partners)
    .where(whereClause || sql`1=1`);
  return result;
}

// ============================================================================
// POST - Batch Operations
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const body = await request.json();

    // Validate request
    const validation = validateBatchRequest(body);
    if (!validation.valid) {
      return {
        error: "Validation failed",
        details: validation.errors,
        status: 400,
      };
    }

    const { operation, partnerIds, filters } = body as BatchRequest;

    // Get partners to operate on
    const targetPartners = await getPartnersForBatch(partnerIds, filters);

    if (targetPartners.length === 0) {
      return {
        error: "No partners found matching the criteria",
        status: 404,
      };
    }

    const targetPartnerIds = targetPartners.map((p) => p.id);
    const results = {
      operation,
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    };

    switch (operation) {
      case "activate":
        // Set status to "active" for all selected partners
        await db
          .update(partners)
          .set({
            status: "active",
            updatedAt: new Date(),
          })
          .where(inArray(partners.id, targetPartnerIds));

        results.processed = targetPartnerIds.length;
        results.succeeded = targetPartnerIds.length;

        logger.info("Batch activate partners", {
          userId: auth.userId,
          count: targetPartnerIds.length,
        });

        return {
          success: true,
          message: `Activated ${targetPartnerIds.length} partner(s)`,
          data: results,
        };

      case "deactivate":
        // Set status to "inactive" for all selected partners
        await db
          .update(partners)
          .set({
            status: "inactive",
            updatedAt: new Date(),
          })
          .where(inArray(partners.id, targetPartnerIds));

        results.processed = targetPartnerIds.length;
        results.succeeded = targetPartnerIds.length;

        logger.info("Batch deactivate partners", {
          userId: auth.userId,
          count: targetPartnerIds.length,
        });

        return {
          success: true,
          message: `Deactivated ${targetPartnerIds.length} partner(s)`,
          data: results,
        };

      case "delete":
        // Soft delete: set status to "inactive" for all selected partners
        await db
          .update(partners)
          .set({
            status: "inactive",
            updatedAt: new Date(),
          })
          .where(inArray(partners.id, targetPartnerIds));

        results.processed = targetPartnerIds.length;
        results.succeeded = targetPartnerIds.length;

        logger.info("Batch delete partners (soft delete)", {
          userId: auth.userId,
          count: targetPartnerIds.length,
        });

        return {
          success: true,
          message: `Deleted ${targetPartnerIds.length} partner(s)`,
          data: results,
        };

      case "export":
        // Generate CSV export
        const exportData = targetPartners.map((partner) => ({
          ID: partner.id,
          Name: partner.name,
          Type: partner.type,
          Email: partner.email || "",
          Phone: partner.phone || "",
          Address: partner.address || "",
          "Contact Person": partner.contactPerson || "",
          Description: partner.description || "",
          "Partnership Date": partner.partnershipDate,
          Status: partner.status,
          "Workshops Conducted": partner.workshopsConducted || 0,
          "Students Placed": partner.studentsPlaced || 0,
          "School ID": partner.schoolId || "",
          "Created At": partner.createdAt.toISOString(),
          "Updated At": partner.updatedAt.toISOString(),
        }));

        const csv = arrayToCSV(exportData);

        logger.info("Partners export generated", {
          userId: auth.userId,
          count: exportData.length,
        });

        // Return CSV file
        return new NextResponse(csv, {
          status: 200,
          headers: {
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="partners-export-${new Date().toISOString().split("T")[0]}.csv"`,
          },
        });

      default:
        return {
          error: "Invalid operation",
          status: 400,
        };
    }
  },
  ["admin"]
);

// ============================================================================
// GET - Get Batch Operation Status/Info
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    // Return available batch operations and their descriptions
    return {
      data: {
        operations: [
          {
            name: "activate",
            description: "Set status to 'active' for selected partners",
            requiresIds: true,
          },
          {
            name: "deactivate",
            description: "Set status to 'inactive' for selected partners",
            requiresIds: true,
          },
          {
            name: "delete",
            description: "Soft delete selected partners (set status to 'inactive')",
            requiresIds: true,
          },
          {
            name: "export",
            description: "Generate CSV export of partners",
            requiresIds: false,
            supportsFilters: true,
          },
        ],
        limits: {
          maxBatchSize: 100,
        },
      },
    };
  },
  ["admin"]
);
