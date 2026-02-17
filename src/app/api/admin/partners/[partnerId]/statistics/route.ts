/**
 * Partner Statistics API
 *
 * GET /api/admin/partners/[partnerId]/statistics - Get partner statistics
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

    // Get partner details
    const partner = await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    // Calculate statistics
    const partnershipStart = new Date(partner.partnershipDate || partner.createdAt);
    const now = new Date();
    const activeMonths = Math.max(
      1,
      Math.floor((now.getTime() - partnershipStart.getTime()) / (1000 * 60 * 60 * 24 * 30))
    );

    const workshopsConducted = partner.workshopsConducted || 0;
    const studentsPlaced = partner.studentsPlaced || 0;
    const avgPlacementsPerWorkshop = workshopsConducted > 0
      ? Math.round((studentsPlaced / workshopsConducted) * 10) / 10
      : 0;

    const statistics = {
      totalWorkshops: workshopsConducted,
      totalPlacements: studentsPlaced,
      avgPlacementsPerWorkshop,
      activeMonths,
      avgWorkshopsPerMonth: parseFloat((workshopsConducted / activeMonths).toFixed(2)),
      avgPlacementsPerMonth: parseFloat((studentsPlaced / activeMonths).toFixed(2)),
    };

    logger.info("Partner statistics fetched", {
      userId: authResult.userId,
      partnerId,
    });

    return NextResponse.json({
      success: true,
      data: statistics,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/admin/partners/[partnerId]/statistics", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch partner statistics", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
