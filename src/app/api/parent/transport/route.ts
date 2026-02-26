/**
 * PARENT TRANSPORT API
 *
 * Fetches transport allocations for parent's children
 * - GET: Fetch all children's transport allocations
 *
 * SECURITY: FERPA COMPLIANCE
 * - Uses parent_to_student join table for verification
 * - Only returns transport info for verified children
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";
import { db } from "@/lib/db";
import { users, parents, parentToStudent, transportAllocations, transportRoutes, vehicles, drivers } from "@/lib/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { logger } from "@/lib/logger";

// ============================================================================
// GET - Fetch children's transport allocations
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId } = auth;

    // FERPA COMPLIANCE: Get parent record first
    const [parentRecord] = await db
      .select()
      .from(parents)
      .where(eq(parents.userId, userId))
      .limit(1);

    if (!parentRecord) {
      logger.warn("No parent record found for user", { userId });
      return errorResponse("Parent record not found", 403);
    }

    // FERPA COMPLIANCE: Get verified children via parent_to_student join table
    const relationships = await db
      .select()
      .from(parentToStudent)
      .where(eq(parentToStudent.parentId, parentRecord.id));

    if (relationships.length === 0) {
      return successResponse({
        children: [],
        message: "No children found",
      });
    }

    const studentIds = relationships.map((r) => r.studentId);

    // Get children for this parent (only verified ones)
    const children = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
        section: users.section,
      })
      .from(users)
      .where(and(
        eq(users.type, "student"),
        inArray(users.id, studentIds)
      ));

    if (children.length === 0) {
      return successResponse({
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

    return successResponse({
      children: childrenWithTransport,
    });
  },
  ['parent']
);
