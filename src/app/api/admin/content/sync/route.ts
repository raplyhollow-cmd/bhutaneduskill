import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { db } from "@/lib/db";
import { dataSources } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/content/sync - Get sync status
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {

    const sources = await db.query.dataSources.findMany();

    logger.info("Sync status fetched", { userId, count: sources.length });

    return NextResponse.json({ data: sources } satisfies ApiSuccess<typeof sources>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/sync", method: "GET", userId });
    return NextResponse.json(
      { error: "Failed to fetch sync status", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/admin/content/sync - Trigger sync
export async function POST(request: NextRequest) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId } = authResult;

  try {
    const body = await request.json();
    const { source } = body; // "ipedx", "onet", "rub"

    // Update sync status
    await db.update(dataSources)
      .set({
        // syncStatus: "active",
        lastSyncAt: new Date(),
      })
      .where(eq(dataSources.type, source));

    // Trigger sync process (placeholder - in production, this would call the actual sync service)
    // For now, just return success

    logger.info("Sync triggered", { source, userId });

    return NextResponse.json({
      data: { success: true, message: `Sync initiated for ${source}` },
    } satisfies ApiSuccess<{ success: boolean; message: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/content/sync", method: "POST", userId });
    return NextResponse.json(
      { error: "Failed to trigger sync", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
