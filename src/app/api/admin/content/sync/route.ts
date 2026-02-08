import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { dataSources, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/admin/content/sync - Get sync status
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const sources = await db.query.dataSources.findMany();

    return NextResponse.json({ sources });
  } catch (error) {
    console.error("Sync status fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch sync status" }, { status: 500 });
  }
}

// POST /api/admin/content/sync - Trigger sync
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { source } = body; // "ipedx", "onet", "rub"

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser || currentUser.type !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update sync status
    await db.update(dataSources)
      .set({
        syncStatus: "active",
        lastSyncAt: new Date(),
      })
      .where(eq(dataSources.type, source));

    // Trigger sync process (placeholder - in production, this would call the actual sync service)
    // For now, just return success

    return NextResponse.json({
      success: true,
      message: `Sync initiated for ${source}`,
      syncStatus: "active",
    });
  } catch (error) {
    console.error("Sync trigger error:", error);
    return NextResponse.json({ error: "Failed to trigger sync" }, { status: 500 });
  }
}
