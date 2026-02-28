/**
 * TRANSPORT ROUTES API
 *
 * Complete CRUD for transport routes with bus stop management
 * - GET: Fetch routes (with filtering)
 * - POST: Create new route
 * - PATCH: Update route
 * - DELETE: Delete route
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { transportRoutes, vehicles, users, transportAllocations } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// Types for proper TypeScript safety
interface RouteStop {
  name: string;
  location: { lat: string; lng: string };
  time: string;
  order?: number;
}

interface ProcessedRouteStop {
  id: string;
  name: string;
  location: { latitude: number; longitude: number };
  time: string;
  order: number;
  morningPickup: boolean;
  afternoonDrop: boolean;
}

// Type for Drizzle condition array - using the actual return type of eq() and similar functions
type DbCondition = ReturnType<typeof eq>;

interface CreateRouteBody {
  routeNumber: string;
  name: string;
  routeName?: string;
  startLocation: string;
  endLocation: string;
  stops: RouteStop[];
  distance: number;
  estimatedTime: number;
  fee: number;
  morningStartTime?: string;
  afternoonEndTime?: string;
  vehicleId?: string;
  capacity?: number;
  isActive?: boolean;
}

interface UpdateRouteBody {
  routeId: string;
  routeNumber?: string;
  name?: string;
  routeName?: string;
  startLocation?: string;
  endLocation?: string;
  stops?: RouteStop[];
  distance?: number;
  estimatedTime?: number;
  fee?: number;
  morningStartTime?: string;
  afternoonEndTime?: string;
  vehicleId?: string;
  capacity?: number;
  isActive?: boolean;
}

// ============================================================================
// GET - Fetch transport routes
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!currentUser) {
      return notFoundResponse("User");
    }

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("id");
    const vehicleId = searchParams.get("vehicleId");
    const isActive = searchParams.get("isActive");
    const includeVehicle = searchParams.get("includeVehicle") === "true";
    const includeAllocations = searchParams.get("includeAllocations") === "true";

    // Get specific route by ID
    if (routeId) {
      const route = await db
        .select()
        .from(transportRoutes)
        .where(eq(transportRoutes.id, routeId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!route) {
        return notFoundResponse("Route");
      }

      // Get vehicle details if requested
      let vehicleData = null;
      if (includeVehicle && route.vehicleId) {
        vehicleData = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, route.vehicleId))
          .limit(1)
          .then(rows => rows[0] || null);
      }

      // Get student count if requested
      let studentCount = 0;
      if (includeAllocations) {
        const allocations = await db
          .select()
          .from(transportAllocations)
          .where(
            and(
              eq(transportAllocations.routeId, routeId),
              eq(transportAllocations.isActive, true)
            )
          );
        studentCount = allocations.length;
      }

      return successResponse({
        route: {
          ...route,
          vehicle: vehicleData,
          studentCount,
        },
      });
    }

    // Get routes for vehicle
    if (vehicleId) {
      const routes = await db
        .select()
        .from(transportRoutes)
        .where(eq(transportRoutes.schoolId, currentUser.schoolId || ""));

      // Filter routes assigned to this vehicle
      const vehicleRoutes = routes.filter(
        (r) => r.vehicleId === vehicleId
      );

      return successResponse({ routes: vehicleRoutes });
    }

    // Build conditions
    const conditions: Array<unknown> = [];

    // Filter by school
    if (currentUser.schoolId) {
      conditions.push(eq(transportRoutes.schoolId, currentUser.schoolId));
    }

    // Filter by active status
    if (isActive === "true") {
      conditions.push(eq(transportRoutes.isActive, true));
    } else if (isActive === "false") {
      conditions.push(eq(transportRoutes.isActive, false));
    }

    const whereClause = conditions.length > 0 ? and(...conditions as DbCondition[]) : undefined;

    // Get all routes
    const routes = await db
      .select()
      .from(transportRoutes)
      .where(whereClause)
      .orderBy(transportRoutes.routeNumber);

    // Enrich with student counts and vehicle data if requested
    const enrichedRoutes: Array<Record<string, unknown>> = [];
    for (const route of routes) {
      const allocations = await db
        .select()
        .from(transportAllocations)
        .where(
          and(
            eq(transportAllocations.routeId, route.id),
            eq(transportAllocations.isActive, true)
          )
        );

      const enrichedRoute: Record<string, unknown> = {
        ...route,
        currentStudents: allocations.length,
        availableSeats: route.capacity ? route.capacity - allocations.length : null,
      };

      // Add vehicle data if requested
      if (includeVehicle && route.vehicleId) {
        const vehicle = await db
          .select()
          .from(vehicles)
          .where(eq(vehicles.id, route.vehicleId))
          .limit(1)
          .then(rows => rows[0] || null);
        enrichedRoute.vehicle = vehicle;
      }

      enrichedRoutes.push(enrichedRoute);
    }

    return successResponse({
      routes: enrichedRoutes,
      total: enrichedRoutes.length,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST - Create transport route
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const currentUser = await db
      .select({
        id: users.id,
        type: users.type,
        role: users.role,
        schoolId: users.schoolId,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!currentUser) {
      return notFoundResponse("User");
    }

    const body: CreateRouteBody = await request.json();
    const {
      routeNumber,
      name,
      routeName,
      startLocation,
      endLocation,
      stops,
      distance,
      estimatedTime,
      fee,
      morningStartTime,
      afternoonEndTime,
      vehicleId,
      capacity = 40,
      isActive = true,
    } = body;

    // Validate required fields
    if (!routeNumber || !name || !startLocation || !endLocation || !stops) {
      return badRequestResponse("Missing required fields: routeNumber, name, startLocation, endLocation, stops");
    }

    // Check if route number already exists
    const existingRoute = await db
      .select()
      .from(transportRoutes)
      .where(eq(transportRoutes.routeNumber, routeNumber))
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingRoute) {
      return badRequestResponse("Route number already exists");
    }

    // Process stops with order
    const processedStops = stops.map((stop, index) => ({
      id: `stop-${nanoid()}`,
      name: stop.name,
      location: {
        latitude: parseFloat(stop.location.lat),
        longitude: parseFloat(stop.location.lng),
      },
      time: stop.time,
      order: index,
      morningPickup: true,
      afternoonDrop: true,
    }));

    // Create route
    const routeId = `route-${nanoid()}`;
    const [newRoute] = await db
      .insert(transportRoutes)
      .values({
        id: routeId,
        schoolId: currentUser.schoolId || "",
        name,
        routeName: routeName || name,
        routeNumber,
        startLocation,
        endLocation,
        stops: processedStops as any,
        distance,
        totalDistance: distance,
        estimatedTime,
        estimatedDuration: estimatedTime,
        fee,
        morningStartTime,
        afternoonEndTime,
        capacity,
        isActive,
        academicYear: new Date().getFullYear().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Transport route created", {
      routeId,
      routeNumber,
      createdBy: userId,
    });

    return successResponse({
      success: true,
      route: newRoute,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// PATCH - Update transport route
// ============================================================================

export const PATCH = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const body: UpdateRouteBody = await request.json();
    const { routeId, stops, distance, estimatedTime, ...updateData } = body;

    if (!routeId) {
      return badRequestResponse("routeId is required");
    }

    // Process stops with order if provided
    const processedUpdateData: Record<string, unknown> = { ...updateData };
    if (stops) {
      processedUpdateData.stops = stops.map((stop, index) => ({
        id: `stop-${nanoid()}`,
        name: stop.name,
        location: {
          latitude: parseFloat(stop.location.lat),
          longitude: parseFloat(stop.location.lng),
        },
        time: stop.time,
        order: index,
        morningPickup: true,
        afternoonDrop: true,
      }));
    }
    // Also update distance/estimatedTime if provided
    if (distance !== undefined) {
      processedUpdateData.distance = distance;
      processedUpdateData.totalDistance = distance;
    }
    if (estimatedTime !== undefined) {
      processedUpdateData.estimatedTime = estimatedTime;
      processedUpdateData.estimatedDuration = estimatedTime;
    }

    // Update route
    const [updatedRoute] = await db
      .update(transportRoutes)
      .set({ ...processedUpdateData, updatedAt: new Date() })
      .where(eq(transportRoutes.id, routeId))
      .returning();

    if (!updatedRoute) {
      return notFoundResponse("Route");
    }

    logger.info("Transport route updated", {
      routeId,
      updatedBy: userId,
    });

    return successResponse({
      success: true,
      route: updatedRoute,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// DELETE - Delete transport route
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("id");

    if (!routeId) {
      return badRequestResponse("Route id is required");
    }

    // Check for active allocations
    const allocations = await db
      .select()
      .from(transportAllocations)
      .where(
        and(
          eq(transportAllocations.routeId, routeId),
          eq(transportAllocations.isActive, true)
        )
      );

    if (allocations.length > 0) {
      return badRequestResponse("Cannot delete route with active allocations");
    }

    // Delete route
    const deletedRoute = await db
      .delete(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .returning();

    if (!deletedRoute || deletedRoute.length === 0) {
      return notFoundResponse("Route");
    }

    logger.info("Transport route deleted", {
      routeId,
      deletedBy: userId,
    });

    return successResponse({
      success: true,
      message: "Route deleted successfully",
    });
  },
  ['admin', 'school-admin']
);