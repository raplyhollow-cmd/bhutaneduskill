/**
 * TRANSPORT VEHICLES API
 *
 * Complete CRUD for transport vehicles
 * - GET: Fetch vehicles (with filtering)
 * - POST: Create new vehicle
 * - PATCH: Update vehicle
 * - DELETE: Delete vehicle
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { vehicles, users, transportRoutes, drivers } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

// Types for proper TypeScript safety
type DbCondition = ReturnType<typeof eq>;

interface CreateVehicleBody {
  registrationNumber: string;
  vehicleNumber?: string;
  vehicleType: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  seatingCapacity: number;
  standingCapacity?: number;
  hasAC?: boolean;
  hasCCTV?: boolean;
  hasGPS?: boolean;
  hasSpeedLimiter?: boolean;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  pollutionExpiry?: string;
  driverName?: string;
  driverPhone?: string;
  conductorName?: string;
  conductorPhone?: string;
  trackingDeviceId?: string;
  gpsEnabled?: boolean;
  notes?: string;
}

interface UpdateVehicleBody {
  vehicleId: string;
  registrationNumber?: string;
  vehicleNumber?: string;
  vehicleType?: string;
  make?: string;
  model?: string;
  year?: number;
  color?: string;
  seatingCapacity?: number;
  standingCapacity?: number;
  hasAC?: boolean;
  hasCCTV?: boolean;
  hasGPS?: boolean;
  hasSpeedLimiter?: boolean;
  insuranceExpiry?: string;
  fitnessExpiry?: string;
  pollutionExpiry?: string;
  status?: string;
  driverName?: string;
  driverPhone?: string;
  conductorName?: string;
  conductorPhone?: string;
  trackingDeviceId?: string;
  gpsEnabled?: boolean;
  routeId?: string;
  notes?: string;
}

// ============================================================================
// GET - Fetch transport vehicles
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
    const vehicleId = searchParams.get("id");
    const status = searchParams.get("status");
    const vehicleType = searchParams.get("vehicleType");
    const includeRoute = searchParams.get("includeRoute") === "true";

    // Get specific vehicle by ID
    if (vehicleId) {
      const vehicle = await db
        .select()
        .from(vehicles)
        .where(eq(vehicles.id, vehicleId))
        .limit(1)
        .then(rows => rows[0] || null);

      if (!vehicle) {
        return notFoundResponse("Vehicle");
      }

      // Check user has access to this vehicle (same school)
      if (vehicle.schoolId !== currentUser.schoolId && currentUser.role !== "admin") {
        return errorResponse("Forbidden", 403);
      }

      // Get route info if requested
      let routeData = null;
      if (includeRoute && vehicle.routeId) {
        routeData = await db
          .select()
          .from(transportRoutes)
          .where(eq(transportRoutes.id, vehicle.routeId))
          .limit(1)
          .then(rows => rows[0] || null);
      }

      return successResponse({
        vehicle: {
          ...vehicle,
          route: routeData,
        },
      });
    }

    // Build conditions
    const conditions: Array<unknown> = [];

    // Filter by school
    if (currentUser.schoolId) {
      conditions.push(eq(vehicles.schoolId, currentUser.schoolId));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(vehicles.status, status));
    }

    // Filter by vehicle type
    if (vehicleType) {
      conditions.push(eq(vehicles.vehicleType, vehicleType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions as DbCondition[]) : undefined;

    // Get all vehicles
    const vehicleList = await db
      .select()
      .from(vehicles)
      .where(whereClause)
      .orderBy(vehicles.registrationNumber);

    // Enrich with route data if requested
    const enrichedVehicles: Array<Record<string, unknown>> = [];
    for (const vehicle of vehicleList) {
      const enrichedVehicle: Record<string, unknown> = {
        ...vehicle,
      };

      // Add route data if requested
      if (includeRoute && vehicle.routeId) {
        const route = await db
          .select()
          .from(transportRoutes)
          .where(eq(transportRoutes.id, vehicle.routeId))
          .limit(1)
          .then(rows => rows[0] || null);
        enrichedVehicle.route = route;
      }

      enrichedVehicles.push(enrichedVehicle);
    }

    return successResponse({
      vehicles: enrichedVehicles,
      total: enrichedVehicles.length,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST - Create transport vehicle
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

    const body: CreateVehicleBody = await request.json();
    const {
      registrationNumber,
      vehicleNumber,
      vehicleType,
      make,
      model,
      year,
      color,
      seatingCapacity,
      standingCapacity = 0,
      hasAC = false,
      hasCCTV = false,
      hasGPS = false,
      hasSpeedLimiter = false,
      insuranceExpiry,
      fitnessExpiry,
      pollutionExpiry,
      driverName,
      driverPhone,
      conductorName,
      conductorPhone,
      trackingDeviceId,
      gpsEnabled = false,
      notes,
    } = body;

    // Validate required fields
    if (!registrationNumber || !vehicleType || !seatingCapacity) {
      return badRequestResponse("Missing required fields: registrationNumber, vehicleType, seatingCapacity");
    }

    // Check if registration number already exists
    const existingVehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, registrationNumber))
      .limit(1)
      .then(rows => rows[0] || null);

    if (existingVehicle) {
      return badRequestResponse("Vehicle with this registration number already exists");
    }

    // Create vehicle
    const vehicleId = `vehicle-${nanoid()}`;
    const [newVehicle] = await db
      .insert(vehicles)
      .values({
        id: vehicleId,
        schoolId: currentUser.schoolId || "",
        registrationNumber,
        vehicleNumber,
        vehicleType,
        make,
        model,
        year,
        color,
        seatingCapacity,
        capacity: seatingCapacity,
        standingCapacity,
        hasAC,
        hasCCTV,
        hasGPS,
        hasSpeedLimiter,
        insuranceExpiry,
        fitnessExpiry,
        pollutionExpiry,
        status: "active",
        driverName,
        driverPhone,
        conductorName,
        conductorPhone,
        trackingDeviceId,
        gpsEnabled,
        notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Transport vehicle created", {
      vehicleId,
      registrationNumber,
      createdBy: userId,
    });

    return successResponse({
      success: true,
      vehicle: newVehicle,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// PATCH - Update transport vehicle
// ============================================================================

export const PATCH = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const body: UpdateVehicleBody = await request.json();
    const { vehicleId, ...updateData } = body;

    if (!vehicleId) {
      return badRequestResponse("vehicleId is required");
    }

    // Update seatingCapacity alias if provided
    const processedUpdateData: Record<string, unknown> = { ...updateData };
    if (updateData.seatingCapacity !== undefined) {
      processedUpdateData.capacity = updateData.seatingCapacity;
    }
    if (updateData.routeId !== undefined) {
      processedUpdateData.assignedRouteId = updateData.routeId;
    }

    // Update vehicle
    const [updatedVehicle] = await db
      .update(vehicles)
      .set({ ...processedUpdateData, updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId))
      .returning();

    if (!updatedVehicle) {
      return notFoundResponse("Vehicle");
    }

    logger.info("Transport vehicle updated", {
      vehicleId,
      updatedBy: userId,
    });

    return successResponse({
      success: true,
      vehicle: updatedVehicle,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// DELETE - Delete transport vehicle
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("id");

    if (!vehicleId) {
      return badRequestResponse("Vehicle id is required");
    }

    // Check if vehicle is assigned to any active route
    const vehicle = await db
      .select()
      .from(vehicles)
      .where(eq(vehicles.id, vehicleId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!vehicle) {
      return notFoundResponse("Vehicle");
    }

    if (vehicle.routeId) {
      const activeRoute = await db
        .select()
        .from(transportRoutes)
        .where(
          and(
            eq(transportRoutes.id, vehicle.routeId),
            eq(transportRoutes.isActive, true)
          )
        )
        .limit(1)
        .then(rows => rows[0] || null);

      if (activeRoute) {
        return badRequestResponse("Cannot delete vehicle assigned to an active route");
      }
    }

    // Soft delete (set status to retired)
    const [deletedVehicle] = await db
      .update(vehicles)
      .set({ status: "retired", updatedAt: new Date() })
      .where(eq(vehicles.id, vehicleId))
      .returning();

    logger.info("Transport vehicle deleted", {
      vehicleId,
      deletedBy: userId,
    });

    return successResponse({
      success: true,
      message: "Vehicle deleted successfully",
    });
  },
  ['admin', 'school-admin']
);