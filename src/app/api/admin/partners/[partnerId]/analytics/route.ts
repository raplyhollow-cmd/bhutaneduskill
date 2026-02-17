/**
 * Partner Analytics API
 *
 * GET /api/admin/partners/[partnerId]/analytics - Get partner analytics
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  const authResult = await requireAuth(["admin"]);
  if ("error" in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status },
      { status: authResult.status }
    );
  }

  try {
    const { partnerId } = await params;

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID is required" }, { status: 400 });
    }

    // Verify partner exists
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("range") || "6m"; // 3m, 6m, 1y

    // TODO: Implement actual analytics from data
    // For now, generate mock analytics based on partner stats
    const workshops = partner.workshopsConducted || 0;
    const placements = partner.studentsPlaced || 0;

    // Generate mock monthly data
    const monthlyPlacements = [
      { month: "Sep", count: Math.max(0, placements - 30) },
      { month: "Oct", count: Math.max(0, placements - 25) },
      { month: "Nov", count: Math.max(0, placements - 18) },
      { month: "Dec", count: Math.max(0, placements - 10) },
      { month: "Jan", count: Math.max(0, placements) },
    ];

    const monthlyRevenue = monthlyPlacements.map((item) => ({
      month: item.month,
      amount: item.count * 10000, // Assuming Nu. 10,000 per placement
    }));

    const topPrograms = [
      { program: "Engineering", count: Math.floor(placements * 0.35) },
      { program: "Business Studies", count: Math.floor(placements * 0.25) },
      { program: "IT", count: Math.floor(placements * 0.20) },
      { program: "Health Sciences", count: Math.floor(placements * 0.15) },
      { program: "Hospitality", count: Math.floor(placements * 0.05) },
    ].filter((p) => p.count > 0);

    const analytics = {
      timeRange,
      monthlyPlacements,
      monthlyRevenue,
      topPrograms,
      summary: {
        totalPlacements: placements,
        totalRevenue: placements * 10000,
        avgPlacementsPerMonth: Math.round((placements / 5) * 10) / 10,
        topProgram: topPrograms[0]?.program || "N/A",
      },
    };

    logger.info("Partner analytics fetched", {
      userId: authResult.userId,
      partnerId,
      timeRange,
    });

    return NextResponse.json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/analytics", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch analytics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
