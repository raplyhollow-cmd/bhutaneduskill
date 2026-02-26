/**
 * TRANSPORT DRIVERS API
 *
 * Complete CRUD for transport drivers
 * - GET: Fetch drivers (with filtering)
 * - POST: Create new driver
 * - PATCH: Update driver
 * - DELETE: Delete driver
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { drivers, users, vehicles } from "@/lib/db/schema";
import { eq, and, desc, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";

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

export const GET = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return notFoundResponse("User");
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
        return notFoundResponse("Driver");
      }

      // Check user has access to this driver (same school)
      if (driver.schoolId !== currentUser.schoolId && currentUser.role !== "admin") {
        return errorResponse("Forbidden", 403);
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

      return successResponse({
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

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

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

    return successResponse({
      drivers: enrichedDrivers,
      total: enrichedDrivers.length,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// POST - Create transport driver
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return notFoundResponse("User");
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
      return badRequestResponse("Missing required fields: firstName, phone, licenseNumber");
    }

    // Check if license number already exists
    const existingDriver = await db.query.drivers.findFirst({
      where: eq(drivers.licenseNumber, licenseNumber),
    });

    if (existingDriver) {
      return badRequestResponse("Driver with this license number already exists");
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

    return successResponse({
      success: true,
      driver: newDriver,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// PATCH - Update transport driver
// ============================================================================

export const PATCH = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const body: UpdateDriverBody = await request.json();
    const { driverId, ...updateData } = body;

    if (!driverId) {
      return badRequestResponse("driverId is required");
    }

    // Update driver
    const [updatedDriver] = await db
      .update(drivers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(drivers.id, driverId))
      .returning();

    if (!updatedDriver) {
      return notFoundResponse("Driver");
    }

    logger.info("Transport driver updated", {
      driverId,
      updatedBy: userId,
    });

    return successResponse({
      success: true,
      driver: updatedDriver,
    });
  },
  ['admin', 'school-admin']
);

// ============================================================================
// DELETE - Delete transport driver
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest) => {
    const auth = getAuth(request);
    if (!auth) {
      return errorResponse("Unauthorized", 401);
    }

    const { userId } = auth;

    const { searchParams } = new URL(request.url);
    const driverId = searchParams.get("id");

    if (!driverId) {
      return badRequestResponse("Driver id is required");
    }

    // Check if driver is assigned to any vehicle
    const driver = await db.query.drivers.findFirst({
      where: eq(drivers.id, driverId),
    });

    if (!driver) {
      return notFoundResponse("Driver");
    }

    const driverFullName = `${driver.firstName} ${driver.lastName || ""}`.trim();
    const assignedVehicles = await db.query.vehicles.findMany({
      where: eq(vehicles.schoolId, driver.schoolId),
    });

    const activeAssignments = assignedVehicles.filter(
      (v) => v.driverName === driverFullName && v.status === "active"
    );

    if (activeAssignments.length > 0) {
      return badRequestResponse("Cannot delete driver assigned to active vehicles");
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

    return successResponse({
      success: true,
      message: "Driver deleted successfully",
    });
  },
  ['admin', 'school-admin']
);