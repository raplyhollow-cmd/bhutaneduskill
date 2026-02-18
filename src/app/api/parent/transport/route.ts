/**
 * PARENT TRANSPORT API
 *
 * Fetches transport allocations for parent's children
 * - GET: Fetch all children's transport allocations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, transportAllocations, transportRoutes, vehicles, drivers } from "@/lib/db/schema";
import { eq, and, or } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - Fetch children's transport allocations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get children for this parent
    const children = await db.query.users.findMany({
      where: eq(users.parentId, userId),
      columns: {
        id: true,
        firstName: true,
        lastName: true,
        classGrade: true,
        section: true,
      },
    });

    if (children.length === 0) {
      return NextResponse.json({
        children: [],
        message: "No children found",
      });
    }

    // Get transport allocations for all children
    const childrenWithTransport = await Promise.all(
      children.map(async (child) => {
        const allocation = await db.query.transportAllocations.findFirst({
          where: and(
            eq(transportAllocations.studentId, child.id),
            eq(transportAllocations.isActive, true)
          ),
          with: {
            route: true,
            vehicle: true,
          },
        });

        if (!allocation) {
          return {
            ...child,
            transportAllocation: null,
          };
        }

        // Get driver info from vehicle
        let driver: { id: string; firstName: string; lastName: string; phone?: string } | null = null;
        const vehicleData = allocation.vehicle as unknown as {
          id: string;
          registrationNumber: string;
          vehicleType: string;
          capacity: number;
          driverName?: string;
          driverPhone?: string;
        } | null;

        if (vehicleData?.driverName) {
          const nameParts = vehicleData.driverName.split(" ");
          driver = {
            id: vehicleData.id,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: vehicleData.driverPhone,
          };
        }

        const routeData = allocation.route as unknown as {
          id: string;
          routeNumber: string;
          name: string;
          routeName?: string;
          startLocation: string;
          endLocation: string;
          fee: number;
          stops?: Array<{
            name: string;
            location: { lat: string; lng: string };
            time: string;
          }>;
        } | null;

        return {
          ...child,
          transportAllocation: {
            id: allocation.id,
            studentId: allocation.studentId,
            routeId: allocation.routeId,
            vehicleId: allocation.vehicleId,
            pickupPoint: allocation.pickupPoint || allocation.stopName || "",
            dropPoint: routeData?.endLocation || allocation.dropPoint || allocation.stopName || "",
            pickupTime: allocation.pickupTime,
            dropTime: allocation.dropTime,
            status: allocation.isActive ? "active" : "inactive",
            fee: allocation.fee ?? routeData?.fee,
            isPaid: allocation.isPaid,
            route: routeData ? {
              id: routeData.id,
              routeNumber: routeData.routeNumber,
              routeName: routeData.routeName || routeData.name,
              name: routeData.name,
              description: `${routeData.startLocation} to ${routeData.endLocation}`,
              fee: routeData.fee,
              stops: routeData.stops,
            } : undefined,
            vehicle: vehicleData ? {
              id: vehicleData.id,
              registrationNumber: vehicleData.registrationNumber,
              vehicleType: vehicleData.vehicleType,
              capacity: vehicleData.capacity,
            } : undefined,
            driver,
          },
        };
      })
    );

    return NextResponse.json({
      children: childrenWithTransport,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/transport", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transport data" },
      { status: 500 }
    );
  }
}
