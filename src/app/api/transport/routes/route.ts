/**
 * TRANSPORT ROUTES API
 *
 * Complete CRUD for transport routes with bus stop management
 * - GET: Fetch routes (with filtering)
 * - POST: Create new route
 * - PATCH: Update route
 * - DELETE: Delete route
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transportRoutes, vehicles, users, transportAllocations } from "@/lib/db/schema";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety
interface RouteStop {
  name: string;
  location: { lat: string; lng: string };
  time: string;
  order?: number;
  morningPickup?: boolean;
  afternoonDrop?: boolean;
}

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

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("id");
    const vehicleId = searchParams.get("vehicleId");
    const isActive = searchParams.get("isActive");
    const includeVehicle = searchParams.get("includeVehicle") === "true";
    const includeAllocations = searchParams.get("includeAllocations") === "true";

    // Get specific route by ID
    if (routeId) {
      const route = await db.query.transportRoutes.findFirst({
        where: eq(transportRoutes.id, routeId),
      });

      if (!route) {
        return NextResponse.json({ error: "Route not found" }, { status: 404 });
      }

      // Get vehicle details if requested
      let vehicleData = null;
      if (includeVehicle && route.vehicleId) {
        vehicleData = await db.query.vehicles.findFirst({
          where: eq(vehicles.id, route.vehicleId),
        });
      }

      // Get student count if requested
      let studentCount = 0;
      if (includeAllocations) {
        const allocations = await db.query.transportAllocations.findMany({
          where: and(
            eq(transportAllocations.routeId, routeId),
            eq(transportAllocations.isActive, true)
          ),
        });
        studentCount = allocations.length;
      }

      return NextResponse.json({
        route: {
          ...route,
          vehicle: vehicleData,
          studentCount,
        },
      });
    }

    // Get routes for vehicle
    if (vehicleId) {
      const routes = await db.query.transportRoutes.findMany({
        where: eq(transportRoutes.schoolId, currentUser.schoolId || ""),
      });

      // Filter routes assigned to this vehicle
      const vehicleRoutes = routes.filter(
        (r) => r.vehicleId === vehicleId
      );

      return NextResponse.json({ routes: vehicleRoutes });
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

    const whereClause = conditions.length > 0 ? and(...conditions as Array<any>) : undefined;

    // Get all routes
    const routes = await db.query.transportRoutes.findMany({
      where: whereClause,
      orderBy: [transportRoutes.routeNumber],
    });

    // Enrich with student counts and vehicle data if requested
    const enrichedRoutes: Array<Record<string, unknown>> = [];
    for (const route of routes) {
      const allocations = await db.query.transportAllocations.findMany({
        where: and(
          eq(transportAllocations.routeId, route.id),
          eq(transportAllocations.isActive, true)
        ),
      });

      const enrichedRoute: Record<string, unknown> = {
        ...route,
        currentStudents: allocations.length,
        availableSeats: route.capacity ? route.capacity - allocations.length : null,
      };

      // Add vehicle data if requested
      if (includeVehicle && route.vehicleId) {
        const vehicle = await db.query.vehicles.findFirst({
          where: eq(vehicles.id, route.vehicleId),
        });
        enrichedRoute.vehicle = vehicle;
      }

      enrichedRoutes.push(enrichedRoute);
    }

    return NextResponse.json({
      routes: enrichedRoutes,
      total: enrichedRoutes.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/routes", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transport routes" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create transport route
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
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
      return NextResponse.json(
        { error: "Missing required fields: routeNumber, name, startLocation, endLocation, stops" },
        { status: 400 }
      );
    }

    // Check if route number already exists
    const existingRoute = await db.query.transportRoutes.findFirst({
      where: eq(transportRoutes.routeNumber, routeNumber),
    });

    if (existingRoute) {
      return NextResponse.json(
        { error: "Route number already exists" },
        { status: 400 }
      );
    }

    // Process stops with order
    const processedStops = stops.map((stop, index) => ({
      ...stop,
      order: index,
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

    return NextResponse.json({
      success: true,
      route: newRoute,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/routes", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create transport route" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update transport route
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body: UpdateRouteBody = await request.json();
    const { routeId, stops, distance, estimatedTime, ...updateData } = body;

    if (!routeId) {
      return NextResponse.json(
        { error: "routeId is required" },
        { status: 400 }
      );
    }

    // Process stops with order if provided
    const processedUpdateData: Record<string, unknown> = { ...updateData };
    if (stops) {
      processedUpdateData.stops = stops.map((stop, index) => ({
        ...stop,
        order: index,
      })) as any;
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
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    logger.info("Transport route updated", {
      routeId,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      route: updatedRoute,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/routes", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update transport route" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete transport route
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get("id");

    if (!routeId) {
      return NextResponse.json(
        { error: "Route id is required" },
        { status: 400 }
      );
    }

    // Check for active allocations
    const allocations = await db.query.transportAllocations.findMany({
      where: and(
        eq(transportAllocations.routeId, routeId),
        eq(transportAllocations.isActive, true)
      ),
    });

    if (allocations.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete route with active allocations",
          activeAllocations: allocations.length,
        },
        { status: 400 }
      );
    }

    // Delete route
    const deletedRoute = await db
      .delete(transportRoutes)
      .where(eq(transportRoutes.id, routeId))
      .returning();

    if (!deletedRoute || deletedRoute.length === 0) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    logger.info("Transport route deleted", {
      routeId,
      deletedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Route deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/routes", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete transport route" },
      { status: 500 }
    );
  }
}
