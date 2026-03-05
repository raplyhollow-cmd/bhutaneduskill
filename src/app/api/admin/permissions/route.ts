import { logger } from "@/lib/logger";
/**
 * RBAC PERMISSIONS API
 *
 * GET /api/admin/permissions - List all permissions (grouped by module)
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { permissions } from "@/lib/db/schema";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/admin/permissions - List all permissions (grouped by module)
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
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

      return {
        data: {
          grouped,
          modules: Object.keys(grouped),
          total: allPermissions.length,
        },
      };
    }

    // Filter by specific module
    const filtered = allPermissions.filter(p => p.module === module);

    return {
      data: {
        permissions: filtered,
        total: filtered.length,
      },
    };
  },
  ["admin"]
);
