import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import type { ApiSuccess } from "@/types";
import { db } from "@/lib/db";
import { dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/content/sync - Get sync status
export const GET = createApiRoute(
  async (_request, auth) => {
    // Using select instead of query (neon-http driver)
    const sources = await db
      .select()
      .from(dataSources);

    return NextResponse.json({ data: sources } satisfies ApiSuccess<typeof sources>);
  },
  ['admin']
);

// POST /api/admin/content/sync - Trigger sync
export const POST = createApiRoute(
  async (request, auth) => {
    const body = await request.json();
    const { source } = body; // "ipedx", "onet", "rub"

    // Update sync status
    await db.update(dataSources)
      .set({
        lastSyncAt: new Date(),
      })
      .where(eq(dataSources.type, source));

    // Trigger sync process (placeholder - in production, this would call the actual sync service)
    // For now, just return success

    return NextResponse.json({
      data: { success: true, message: `Sync initiated for ${source}` },
    } satisfies ApiSuccess<{ success: boolean; message: string }>);
  },
  ['admin']
);
