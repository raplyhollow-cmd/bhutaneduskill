import { logger } from "@/lib/logger";
/**
 * TRANSPORT MANAGEMENT API ROUTE
 *
 * Handles bus routes, vehicle tracking, and student allocations
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transportRoutes, transportAllocations, vehicles, drivers, users } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - Fetch transport data
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth();
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // routes, allocations, my-transport

    if (action === "my-transport") {
      // Get student's transport allocation
      const allocation = await db.query.transportAllocations.findFirst({
        where: and(
          eq(transportAllocations.studentId, currentUser.id),
          eq(transportAllocations.isActive, true)
        ),
        with: {
          route: {
            with: {
              vehicle: true,
              driver: true,
            },
          },
        },
      });

      if (!allocation) {
        return NextResponse.json({
          allocation: null,
          message: "No transport allocation found",
        });
      }

      return NextResponse.json({
        allocation,
        hasTransport: true,
      });
    }

    if (action === "routes") {
      // Get all routes for the school
      const routes = await db.query.transportRoutes.findMany({
        where: and(
          eq(transportRoutes.schoolId, currentUser.schoolId || ""),
          eq(transportRoutes.isActive, true)
        ),
        with: {
          vehicle: true,
          driver: true,
        },
        orderBy: [transportRoutes.routeNumber],
      });

      return NextResponse.json({ routes });
    }

    if (action === "allocations") {
      // Get all student allocations
      const allocations = await db.query.transportAllocations.findMany({
        where: eq(transportAllocations.schoolId, currentUser.schoolId || ""),
        with: {
          student: {
            columns: { id: true, firstName: true, lastName: true, classGrade: true, section: true },
          },
          route: true,
        },
        orderBy: [desc(transportAllocations.createdAt)],
      });

      return NextResponse.json({ allocations });
    }

    // Default: return routes
    const routes = await db.query.transportRoutes.findMany({
      where: and(
        eq(transportRoutes.schoolId, currentUser.schoolId || ""),
        eq(transportRoutes.isActive, true)
      ),
      with: {
        vehicle: true,
        driver: true,
      },
      orderBy: [transportRoutes.routeNumber],
    });

    return NextResponse.json({
      routes,
      user: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
      },
    });
  } catch (error) {
    logger.error("Error fetching transport data:", error);
    return NextResponse.json(
      { error: "Failed to fetch transport data" },
      { status: 500 }
    );
  }
}

// POST - Create or update transport data
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'school-admin']);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId, user } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "create-route") {
      const {
        routeNumber,
        routeName,
        description,
        morningStartTime,
        morningEndTime,
        afternoonStartTime,
        afternoonEndTime,
        totalDistance,
        estimatedDuration,
        fee,
        vehicleId,
        driverId,
        stops,
      } = body;

      const [route] = await db.insert(transportRoutes).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        routeNumber,
        routeName,
        description,
        morningStartTime,
        morningEndTime,
        afternoonStartTime,
        afternoonEndTime,
        totalDistance,
        estimatedDuration,
        fee,
        vehicleId,
        driverId,
        stops: stops || [],
        capacity: 40, // Default capacity
        currentStudents: 0,
        isActive: true,
        academicYear: new Date().getFullYear().toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning();

      return NextResponse.json({
        success: true,
        route: route[0],
      });
    }

    if (action === "allocate-student") {
      const { studentId, routeId, vehicleId, pickupPoint, dropPoint, pickupTime, dropTime } = body;

      const [allocation] = await db.insert(transportAllocations).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        studentId,
        routeId,
        vehicleId,
        pickupPoint,
        dropPoint,
        pickupTime,
        dropTime,
        academicYear: new Date().getFullYear().toString(),
        status: "active",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any).returning();

      return NextResponse.json({
        success: true,
        allocation: allocation[0],
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    logger.error("Error processing transport request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
