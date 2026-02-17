import { logger } from "@/lib/logger";
/**
 * RBAC PERMISSIONS API
 *
 * GET /api/admin/permissions - List all permissions (grouped by module)
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { permissions } from "@/lib/db/schema";
import { requireAuth } from "@/lib/auth-utils";

// GET /api/admin/permissions - List all permissions (grouped by module)
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { success: false, error: authResult.error },
      { status: authResult.status }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const module = searchParams.get("module");

    const allPermissions = await db
      .select()
      .from(permissions)
      .orderBy(permissions.module, permissions.resource, permissions.action);

    // Group by module if no specific module requested
    if (!module) {
      const grouped = allPermissions.reduce<Record<string, typeof allPermissions>>((acc, perm) => {
        const moduleName = perm.module || "other";
        if (!acc[moduleName]) {
          acc[moduleName] = [];
        }
        acc[moduleName].push(perm);
        return acc;
      }, {});

      return NextResponse.json({
        success: true,
        data: {
          grouped,
          modules: Object.keys(grouped),
          total: allPermissions.length,
        },
      });
    }

    // Filter by specific module
    const filtered = allPermissions.filter(p => p.module === module);

    return NextResponse.json({
      success: true,
      data: {
        permissions: filtered,
        total: filtered.length,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to fetch permissions" },
      { status: 500 }
    );
  }
}
