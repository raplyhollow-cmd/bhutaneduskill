/**
 * Partner Statistics API
 *
 * GET /api/admin/partners/[partnerId]/statistics - Get partner statistics
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export const GET = createApiRoute(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ partnerId: string }> }
  ) => {
    const { partnerId } = await params;

    if (!partnerId) {
      return { error: "Partner ID is required", status: 400 };
    }

    // Get partner details
    const partnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);
    const partner = partnerResult[0];

    if (!partner) {
      return { error: "Partner not found", status: 404 };
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
      userId: auth.userId,
      partnerId,
    });

    return {
      data: statistics,
    };
  },
  ["admin"]
);
