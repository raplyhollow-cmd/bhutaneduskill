/**
 * TRANSPORT DRIVERS API
 *
 * Complete CRUD for transport drivers
 * - GET: Fetch drivers (with filtering)
 * - POST: Create new driver
 * - PATCH: Update driver
 * - DELETE: Delete driver
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { drivers, users, vehicles } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety
interface CreateDriverBody {
  firstName: string;
  lastName?: string;
  phone: string;
  emergencyContact?: string;
  address?: string;
  licenseNumber: string;
  licenseType?: string;
  licenseExpiry?: string;
  badgeNumber?: string;
  employeeId?: string;
  dateOfJoining?: string;
  backgroundCheckVerified?: boolean;
  backgroundCheckDate?: string;
}

interface UpdateDriverBody {
  driverId: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  emergencyContact?: string;
  address?: string;
  licenseNumber?: string;
  licenseType?: string;
  licenseExpiry?: string;
  badgeNumber?: string;
  employeeId?: string;
  dateOfJoining?: string;
  status?: string;
  backgroundCheckVerified?: boolean;
  backgroundCheckDate?: string;
}

// ============================================================================
// GET - Fetch transport drivers
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
    const driverId = searchParams.get("id");
    const status = searchParams.get("status");
    const includeAssignedVehicles = searchParams.get("includeVehicles") === "true";

    // Get specific driver by ID
    if (driverId) {
      const driver = await db.query.drivers.findFirst({
        where: eq(drivers.id, driverId),
      });

      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }

      // Check user has access to this driver (same school)
      if (driver.schoolId !== currentUser.schoolId && currentUser.role !== "admin") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Get assigned vehicles if requested
      let assignedVehicles = [];
      if (includeAssignedVehicles) {
        const allVehicles = await db.query.vehicles.findMany({
          where: eq(vehicles.schoolId, driver.schoolId),
        });
        assignedVehicles = allVehicles.filter(
          (v) => v.driverName === `${driver.firstName} ${driver.lastName || ""}`.trim()
        );
      }

      return NextResponse.json({
        driver: {
          ...driver,
          assignedVehicles,
        },
      });
    }

    // Build conditions
    const conditions: Array<unknown> = [];

    // Filter by school
    if (currentUser.schoolId) {
      conditions.push(eq(drivers.schoolId, currentUser.schoolId));
    }

    // Filter by status
    if (status) {
      conditions.push(eq(drivers.status, status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions as Array<any>) : undefined;

    // Get all drivers
    const driverList = await db.query.drivers.findMany({
      where: whereClause,
      orderBy: [drivers.firstName],
    });

    // Enrich with assigned vehicles if requested
    const enrichedDrivers: Array<Record<string, unknown>> = [];
    for (const driver of driverList) {
      const enrichedDriver: Record<string, unknown> = {
        ...driver,
      };

      // Add assigned vehicles count if requested
      if (includeAssignedVehicles) {
        const allVehicles = await db.query.vehicles.findMany({
          where: eq(vehicles.schoolId, driver.schoolId),
        });
        const assigned = allVehicles.filter(
          (v) => v.driverName === `${driver.firstName} ${driver.lastName || ""}`.trim()
        );
        enrichedDriver.assignedVehicles = assigned.length;
        enrichedDriver.assignedVehicleList = assigned;
      }

      enrichedDrivers.push(enrichedDriver);
    }

    return NextResponse.json({
      drivers: enrichedDrivers,
      total: enrichedDrivers.length,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/drivers", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transport drivers" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create transport driver
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

    const body: CreateDriverBody = await request.json();
    const {
      firstName,
      lastName,
      phone,
      emergencyContact,
      address,
      licenseNumber,
      licenseType,
      licenseExpiry,
      badgeNumber,
      employeeId,
      dateOfJoining,
      backgroundCheckVerified = false,
      backgroundCheckDate,
    } = body;

    // Validate required fields
    if (!firstName || !phone || !licenseNumber) {
      return NextResponse.json(
        { error: "Missing required fields: firstName, phone, licenseNumber" },
        { status: 400 }
      );
    }

    // Check if license number already exists
    const existingDriver = await db.query.drivers.findFirst({
      where: eq(drivers.licenseNumber, licenseNumber),
    });

    if (existingDriver) {
      return NextResponse.json(
        { error: "Driver with this license number already exists" },
        { status: 400 }
      );
    }

    // Create driver
    const driverId = `driver-${nanoid()}`;
    const [newDriver] = await db
      .insert(drivers)
      .values({
        id: driverId,
        schoolId: currentUser.schoolId || "",
        firstName,
        lastName,
        phone,
        emergencyContact,
        address,
        licenseNumber,
        licenseType,
        licenseExpiry,
        badgeNumber,
        employeeId,
        dateOfJoining,
        status: "active",
        backgroundCheckVerified,
        backgroundCheckDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Transport driver created", {
      driverId,
      firstName,
      lastName,
      createdBy: userId,
    });

    return NextResponse.json({
      success: true,
      driver: newDriver,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/drivers", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create transport driver" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update transport driver
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body: UpdateDriverBody = await request.json();
    const { driverId, ...updateData } = body;

    if (!driverId) {
      return NextResponse.json(
        { error: "driverId is required" },
        { status: 400 }
      );
    }

    // Update driver
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    logger.info("Transport driver updated", {
      driverId,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      driver: updatedDriver,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/drivers", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update transport driver" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete transport driver
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("id");

    if (!driverId) {
      return NextResponse.json(
        { error: "Driver id is required" },
        { status: 400 }
      );
    }

    // Check if driver is assigned to any vehicle
    const driver = await db.query.drivers.findFirst({
      where: eq(drivers.id, driverId),
    });

    if (!driver) {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }

    const driverFullName = `${driver.firstName} ${driver.lastName || ""}`.trim();
    const assignedVehicles = await db.query.vehicles.findMany({
      where: eq(vehicles.schoolId, driver.schoolId),
    });

    const activeAssignments = assignedVehicles.filter(
      (v) => v.driverName === driverFullName && v.status === "active"
    );

    if (activeAssignments.length > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete driver assigned to active vehicles",
          assignedVehicles: activeAssignments.length,
        },
        { status: 400 }
      );
    }

    // Soft delete (set status to inactive)
    const [deletedDriver] = await db
      .update(drivers)
      .set({ status: "inactive", updatedAt: new Date() })
      .where(eq(drivers.id, driverId))
      .returning();

    logger.info("Transport driver deleted", {
      driverId,
      deletedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Driver deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/drivers", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to delete transport driver" },
      { status: 500 }
    );
  }
}
