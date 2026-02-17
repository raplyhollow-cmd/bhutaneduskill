/**
 * TRANSPORT VEHICLE TRACKING API
 *
 * Real-time vehicle location tracking and status
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { users, vehicleTracking, vehicles, transportRoutes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety - NO 'any'
interface VehicleTrackingData {
  id: string;
  vehicleId: string;
  latitude: string;
  longitude: string;
  speed: number;
  heading: number;
  status: "moving" | "stopped" | "idle" | "out_of_service";
  currentTripId: string | null;
  routeId: string | null;
  studentsOnBoard: number;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date | null;
}

interface VehicleData {
  id: string;
  schoolId: string;
  routeId: string;
  assignedRouteId: string | null;
  registrationNumber: string;
  vehicleNumber: string | null;
  vehicleType: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  conductorName: string | null;
  conductorPhone: string | null;
  status: string;
  gpsEnabled: boolean;
  trackingDeviceId: string | null;
  insuranceExpiry: string | null;
  pollutionExpiry: string | null;
  fitnessExpiry: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface RouteData {
  id: string;
  schoolId: string;
  name: string;
  routeNumber: string;
  routeName: string;
  startLocation: string;
  endLocation: string;
  stops: Array<{
    name: string;
    location: { lat: string; lng: string };
    time: string;
  }> | null;
  distance: number | null;
  totalDistance: number | null;
  estimatedTime: number | null;
  estimatedDuration: number | null;
  fee: number | null;
  morningStartTime: string | null;
  afternoonEndTime: string | null;
  capacity: number | null;
  isActive: boolean;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TrackingUpdateBody {
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  status?: "moving" | "stopped" | "idle" | "out_of_service";
  studentsOnBoard?: number;
  currentTripId?: string;
  routeId?: string;
}

// ============================================================================
// GET - Fetch vehicle tracking data
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
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

    const { vehicleId } = await params;

    // Get vehicle details
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    }) as VehicleData | null;

    if (!vehicle) {
      return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });
    }

    // Check user has access to this vehicle (same school)
    if (vehicle.schoolId !== currentUser.schoolId && currentUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get latest tracking data
    const tracking = await db.query.vehicleTracking.findFirst({
      where: eq(vehicleTracking.vehicleId, vehicleId),
      orderBy: [desc(vehicleTracking.timestamp)],
    }) as VehicleTrackingData | null;

    // Get route info if available
    let route: RouteData | null = null;
    if (vehicle.assignedRouteId) {
      const routeResult = await db.query.transportRoutes.findFirst({
        where: eq(transportRoutes.id, vehicle.assignedRouteId),
      });
      route = routeResult ? routeResult as unknown as RouteData : null;
    } else if (vehicle.routeId) {
      const routeResult = await db.query.transportRoutes.findFirst({
        where: eq(transportRoutes.id, vehicle.routeId),
      });
      route = routeResult ? routeResult as unknown as RouteData : null;
    }

    return NextResponse.json({
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber || vehicle.registrationNumber,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        status: vehicle.status,
        driverName: vehicle.driverName,
        driverPhone: vehicle.driverPhone,
      },
      route: route
        ? {
            id: route.id,
            routeNumber: route.routeNumber,
            routeName: route.name,
            startLocation: route.startLocation,
            endLocation: route.endLocation,
            morningStartTime: route.morningStartTime,
            afternoonEndTime: route.afternoonEndTime,
          }
        : null,
      tracking: tracking
        ? {
            latitude: parseFloat(tracking.latitude),
            longitude: parseFloat(tracking.longitude),
            speed: tracking.speed,
            heading: tracking.heading,
            status: tracking.status,
            studentsOnBoard: tracking.studentsOnBoard,
            lastUpdate: tracking.timestamp,
          }
        : {
            latitude: null,
            longitude: null,
            speed: 0,
            heading: 0,
            status: "unknown" as const,
            studentsOnBoard: 0,
            lastUpdate: null,
            message: "No tracking data available",
          },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/tracking/[vehicleId]", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch vehicle tracking" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Update vehicle location (used by GPS devices/mobile apps)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
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

    const { vehicleId } = await params;
    const body: TrackingUpdateBody = await request.json();
    const {
      latitude,
      longitude,
      speed = 0,
      heading = 0,
      status = "stopped",
      studentsOnBoard = 0,
      currentTripId = null,
      routeId = null,
    } = body;

    // Validate required fields
    if (latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: latitude, longitude" },
        { status: 400 }
      );
    }

    // Verify vehicle belongs to user's school
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });

    if (!vehicle || (vehicle.schoolId !== currentUser.schoolId && currentUser.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new tracking record
    const trackingId = `tracking-${nanoid()}`;
    const timestamp = new Date();

    const [tracking] = await db
      .insert(vehicleTracking)
      .values({
        id: trackingId,
        vehicleId,
        assignedRouteId: routeId,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        speed,
        heading,
        status,
        currentTripId,
        routeId,
        studentsOnBoard,
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      })
      .returning();

    logger.info("Vehicle tracking updated", {
      trackingId,
      vehicleId,
      latitude,
      longitude,
      status,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      tracking,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/tracking/[vehicleId]", method: "POST" });
    return NextResponse.json(
      { error: "Failed to update vehicle tracking" },
      { status: 500 }
    );
  }
}
