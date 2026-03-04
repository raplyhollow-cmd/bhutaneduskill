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
        const [allocation] = await db
          .select({
            id: transportAllocations.id,
            studentId: transportAllocations.studentId,
            routeId: transportAllocations.routeId,
            vehicleId: transportAllocations.vehicleId,
            pickupPoint: transportAllocations.pickupPoint,
            dropPoint: transportAllocations.dropPoint,
            stopName: transportAllocations.stopName,
            pickupTime: transportAllocations.pickupTime,
            dropTime: transportAllocations.dropTime,
            fee: transportAllocations.fee,
            isPaid: transportAllocations.isPaid,
            isActive: transportAllocations.isActive,
            route: {
              id: transportRoutes.id,
              routeNumber: transportRoutes.routeNumber,
              name: transportRoutes.name,
              routeName: transportRoutes.routeName,
              startLocation: transportRoutes.startLocation,
              endLocation: transportRoutes.endLocation,
              fee: transportRoutes.fee,
              stops: transportRoutes.stops,
            },
            vehicle: {
              id: vehicles.id,
              registrationNumber: vehicles.registrationNumber,
              vehicleType: vehicles.vehicleType,
              capacity: vehicles.capacity,
              driverName: vehicles.driverName,
              driverPhone: vehicles.driverPhone,
            },
          })
          .from(transportAllocations)
          .leftJoin(transportRoutes, eq(transportAllocations.routeId, transportRoutes.id))
          .leftJoin(vehicles, eq(transportAllocations.vehicleId, vehicles.id))
          .where(
            and(
              eq(transportAllocations.studentId, child.id),
              eq(transportAllocations.isActive, true)
            )
          )
          .limit(1);

        if (!allocation) {
          return {
            ...child,
            transportAllocation: null,
          };
        }

        // Get driver info from vehicle
        let driver: { id: string; firstName: string; lastName: string; phone?: string } | null = null;
        const vehicleData = allocation.vehicle;

        if (vehicleData?.driverName) {
          const nameParts = vehicleData.driverName.split(" ");
          driver = {
            id: vehicleData.id,
            firstName: nameParts[0] || "",
            lastName: nameParts.slice(1).join(" ") || "",
            phone: vehicleData.driverPhone,
          };
        }

        const routeData = allocation.route;

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
