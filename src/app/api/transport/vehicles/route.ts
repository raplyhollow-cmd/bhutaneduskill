/**
 * TRANSPORT VEHICLES API
 *
 * Complete CRUD for transport vehicles
 * - GET: Fetch vehicles (with filtering)
 * - POST: Create new vehicle
 * - PATCH: Update vehicle
 * - DELETE: Delete vehicle
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { vehicles, users, transportRoutes, drivers } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety
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
    const vehicleId = searchParams.get("id");
    const status = searchParams.get("status");
    const vehicleType = searchParams.get("vehicleType");
    const includeRoute = searchParams.get("includeRoute") === "true";

    // Get specific vehicle by ID
    if (vehicleId) {
      const vehicle = await db.query.vehicles.findFirst({
        where: eq(vehicles.id, vehicleId),
      });

      if (!vehicle) {
        return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
      }

      // Check user has access to this vehicle (same school)
      if (vehicle.schoolId !== currentUser.schoolId && currentUser.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Get route info if requested
      let routeData = null;
      if (includeRoute && vehicle.routeId) {
        routeData = await db.query.transportRoutes.findFirst({
          where: eq(transportRoutes.id, vehicle.routeId),
        });
      }

      return NextResponse.json({
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

    const whereClause = conditions.length > 0 ? and(...conditions as Array<any>) : undefined;

    // Get all vehicles
    const vehicleList = await db.query.vehicles.findMany({
      where: whereClause,
      orderBy: [vehicles.registrationNumber],
    });

    // Enrich with route data and student count if requested
    const enrichedVehicles: Array<Record<string, unknown>> = [];
    for (const vehicle of vehicleList) {
      const enrichedVehicle: Record<string, unknown> = {
        ...vehicle,
      };

      // Add route data if requested
      if (includeRoute && vehicle.routeId) {
        const route = await db.query.transportRoutes.findFirst({
          where: eq(transportRoutes.id, vehicle.routeId),
        });
        enrichedVehicle.route = route;
      }

      enrichedVehicles.push(enrichedVehicle);
    }

    return NextResponse.json({
      vehicles: enrichedVehicles,
      total: enrichedVehicles.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/vehicles", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transport vehicles" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create transport vehicle
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
      return NextResponse.json(
        { error: "Missing required fields: registrationNumber, vehicleType, seatingCapacity" },
        { status: 400 }
      );
    }

    // Check if registration number already exists
    const existingVehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.registrationNumber, registrationNumber),
    });

    if (existingVehicle) {
      return NextResponse.json(
        { error: "Vehicle with this registration number already exists" },
        { status: 400 }
      );
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

    return NextResponse.json({
      success: true,
      vehicle: newVehicle,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/vehicles", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create transport vehicle" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update transport vehicle
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body: UpdateVehicleBody = await request.json();
    const { vehicleId, ...updateData } = body;

    if (!vehicleId) {
      return NextResponse.json(
        { error: "vehicleId is required" },
        { status: 400 }
      );
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
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    logger.info("Transport vehicle updated", {
      vehicleId,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      vehicle: updatedVehicle,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/vehicles", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update transport vehicle" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete transport vehicle
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const vehicleId = searchParams.get("id");

    if (!vehicleId) {
      return NextResponse.json(
        { error: "Vehicle id is required" },
        { status: 400 }
      );
    }

    // Check if vehicle is assigned to any active route
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    if (vehicle.routeId) {
      const activeRoute = await db.query.transportRoutes.findFirst({
        where: and(
          eq(transportRoutes.id, vehicle.routeId),
          eq(transportRoutes.isActive, true)
        ),
      });

      if (activeRoute) {
        return NextResponse.json(
          {
            error: "Cannot delete vehicle assigned to an active route",
            routeId: vehicle.routeId,
          },
          { status: 400 }
        );
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

    return NextResponse.json({
      success: true,
      message: "Vehicle deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/vehicles", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete transport vehicle" },
      { status: 500 }
    );
  }
}
