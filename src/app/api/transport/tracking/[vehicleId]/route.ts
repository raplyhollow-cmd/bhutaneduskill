/**
 * TRANSPORT VEHICLE TRACKING API
 *
 * Real-time vehicle location tracking and status
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, vehicleTracking, vehicles, transportRoutes } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { vehicleId } = await params;

    // Get vehicle details
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

    // Get latest tracking data
    const tracking = await db.query.vehicleTracking.findFirst({
      where: eq(vehicleTracking.vehicleId, vehicleId),
      orderBy: [desc(vehicleTracking.timestamp)],
    });

    // Get route info if available
    const route = vehicle.assignedRouteId
      ? await db.query.transportRoutes.findFirst({
          where: eq(transportRoutes.id, vehicle.assignedRouteId),
        })
      : null;

    return NextResponse.json({
      vehicle: {
        id: vehicle.id,
        vehicleNumber: vehicle.vehicleNumber,
        vehicleType: vehicle.vehicleType,
        capacity: vehicle.capacity,
        status: vehicle.status,
      },
      route: route
        ? {
            id: route.id,
            routeNumber: route.routeNumber,
            routeName: route.routeName,
            morningStartTime: route.morningStartTime,
            afternoonEndTime: route.afternoonEndTime,
          }
        : null,
      tracking: tracking
        ? {
            latitude: tracking.latitude,
            longitude: tracking.longitude,
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
            status: "unknown",
            studentsOnBoard: 0,
            lastUpdate: null,
            message: "No tracking data available",
          },
    });
  } catch (error) {
    console.error("Error fetching vehicle tracking:", error);
    return NextResponse.json(
      { error: "Failed to fetch vehicle tracking" },
      { status: 500 }
    );
  }
}

// POST - Update vehicle location (used by GPS devices/mobile apps)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vehicleId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { vehicleId } = await params;
    const body = await request.json();
    const { latitude, longitude, speed, heading, status, studentsOnBoard } = body;

    // Verify vehicle belongs to user's school
    const vehicle = await db.query.vehicles.findFirst({
      where: eq(vehicles.id, vehicleId),
    });

    if (!vehicle || (vehicle.schoolId !== currentUser.schoolId && currentUser.role !== "admin")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Create new tracking record
    const { nanoid } = await import("nanoid");
    const [tracking] = await db.insert(vehicleTracking).values({
      id: nanoid(),
      vehicleId,
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      speed: speed || 0,
      heading: heading || 0,
      status: status || "stopped",
      studentsOnBoard: studentsOnBoard || 0,
      timestamp: new Date(),
      createdAt: new Date(),
    }).returning();

    return NextResponse.json({
      success: true,
      tracking: tracking[0],
    });
  } catch (error) {
    console.error("Error updating vehicle tracking:", error);
    return NextResponse.json(
      { error: "Failed to update vehicle tracking" },
      { status: 500 }
    );
  }
}
