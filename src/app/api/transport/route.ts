import { logger } from "@/lib/logger";
/**
 * TRANSPORT MANAGEMENT API ROUTE
 *
 * Handles bus routes, vehicle tracking, and student allocations
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { transportRoutes, transportAllocations, vehicles, drivers, users } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { createApiRoute } from "@/lib/api/route-handler";

// Types for transport data
interface TransportRouteInsert {
  id: string;
  schoolId: string;
  routeNumber: string;
  routeName: string;
  description?: string;
  morningStartTime?: string;
  morningEndTime?: string;
  afternoonStartTime?: string;
  afternoonEndTime?: string;
  totalDistance?: number;
  estimatedDuration?: number;
  fee?: number;
  vehicleId?: string;
  driverId?: string;
  stops: Array<{
    id: string;
    name: string;
    location: { latitude: number; longitude: number };
    time: string;
    order: number;
    morningPickup: boolean;
    afternoonDrop: boolean;
  }>;
  capacity: number;
  currentStudents: number;
  isActive: boolean;
  academicYear: string;
  createdAt: Date;
  updatedAt: Date;
}

interface TransportAllocationInsert {
  id: string;
  schoolId: string;
  studentId: string;
  routeId: string;
  vehicleId?: string;
  pickupPoint?: string;
  dropPoint?: string;
  pickupTime?: string;
  dropTime?: string;
  academicYear: string;
  status: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// GET - Fetch transport data
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

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
      return { error: "User not found", status: 404 };
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // routes, allocations, my-transport

    if (action === "my-transport") {
      // Get student's transport allocation
      const allocation = await db
        .select({
          id: transportAllocations.id,
          studentId: transportAllocations.studentId,
          routeId: transportAllocations.routeId,
          vehicleId: transportAllocations.vehicleId,
          stopName: transportAllocations.stopName,
          pickupPoint: transportAllocations.pickupPoint,
          dropPoint: transportAllocations.dropPoint,
          pickupTime: transportAllocations.pickupTime,
          dropTime: transportAllocations.dropTime,
          academicYear: transportAllocations.academicYear,
          fee: transportAllocations.fee,
          isPaid: transportAllocations.isPaid,
          isActive: transportAllocations.isActive,
          createdAt: transportAllocations.createdAt,
          updatedAt: transportAllocations.updatedAt,
          // Route fields
          routeId_route: transportRoutes.id,
          routeNumber: transportRoutes.routeNumber,
          routeName: transportRoutes.name,
          routeStartLocation: transportRoutes.startLocation,
          routeEndLocation: transportRoutes.endLocation,
          routeFee: transportRoutes.fee,
          routeStops: transportRoutes.stops,
          // Vehicle fields
          vehicleRegistrationNumber: vehicles.registrationNumber,
          vehicleType: vehicles.vehicleType,
          vehicleCapacity: vehicles.capacity,
          vehicleDriverName: vehicles.driverName,
          vehicleDriverPhone: vehicles.driverPhone,
          // Driver fields
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverPhone: drivers.phone,
        })
        .from(transportAllocations)
        .leftJoin(transportRoutes, eq(transportAllocations.routeId, transportRoutes.id))
        .leftJoin(vehicles, eq(transportRoutes.vehicleId, vehicles.id))
        .leftJoin(drivers, eq(vehicles.driverName, sql`${drivers.firstName} || ' ' || COALESCE(${drivers.lastName}, '')`))
        .where(
          and(
            eq(transportAllocations.studentId, currentUser.id),
            eq(transportAllocations.isActive, true)
          )
        )
        .limit(1)
        .then(rows => {
          if (rows.length === 0) return null;
          const row = rows[0];
          return {
            id: row.id,
            studentId: row.studentId,
            routeId: row.routeId,
            vehicleId: row.vehicleId,
            stopName: row.stopName,
            pickupPoint: row.pickupPoint,
            dropPoint: row.dropPoint,
            pickupTime: row.pickupTime,
            dropTime: row.dropTime,
            academicYear: row.academicYear,
            fee: row.fee,
            isPaid: row.isPaid,
            isActive: row.isActive,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            route: row.routeId_route ? {
              id: row.routeId_route,
              routeNumber: row.routeNumber,
              name: row.routeName,
              startLocation: row.routeStartLocation,
              endLocation: row.routeEndLocation,
              fee: row.routeFee,
              stops: row.routeStops,
            } : null,
            vehicle: row.vehicleRegistrationNumber ? {
              registrationNumber: row.vehicleRegistrationNumber,
              vehicleType: row.vehicleType,
              capacity: row.vehicleCapacity,
              driverName: row.vehicleDriverName,
              driverPhone: row.vehicleDriverPhone,
            } : null,
            driver: row.driverFirstName ? {
              firstName: row.driverFirstName,
              lastName: row.driverLastName,
              phone: row.driverPhone,
            } : null,
          };
        });

      if (!allocation) {
        return {
          allocation: null,
          message: "No transport allocation found",
        };
      }

      return {
        allocation,
        hasTransport: true,
      };
    }

    if (action === "routes") {
      // Get all routes for the school
      const routes = await db
        .select({
          id: transportRoutes.id,
          schoolId: transportRoutes.schoolId,
          routeNumber: transportRoutes.routeNumber,
          name: transportRoutes.name,
          routeName: transportRoutes.routeName,
          startLocation: transportRoutes.startLocation,
          endLocation: transportRoutes.endLocation,
          stops: transportRoutes.stops,
          distance: transportRoutes.distance,
          totalDistance: transportRoutes.totalDistance,
          estimatedTime: transportRoutes.estimatedTime,
          estimatedDuration: transportRoutes.estimatedDuration,
          fee: transportRoutes.fee,
          morningStartTime: transportRoutes.morningStartTime,
          morningEndTime: transportRoutes.morningEndTime,
          afternoonStartTime: transportRoutes.afternoonStartTime,
          afternoonEndTime: transportRoutes.afternoonEndTime,
          capacity: transportRoutes.capacity,
          currentStudents: transportRoutes.currentStudents,
          isActive: transportRoutes.isActive,
          vehicleId: transportRoutes.vehicleId,
          driverId: transportRoutes.driverId,
          createdAt: transportRoutes.createdAt,
          updatedAt: transportRoutes.updatedAt,
          // Vehicle fields
          vehicleRegistrationNumber: vehicles.registrationNumber,
          vehicleType: vehicles.vehicleType,
          vehicleCapacity: vehicles.capacity,
          vehicleDriverName: vehicles.driverName,
          // Driver fields
          driverFirstName: drivers.firstName,
          driverLastName: drivers.lastName,
          driverPhone: drivers.phone,
        })
        .from(transportRoutes)
        .leftJoin(vehicles, eq(transportRoutes.vehicleId, vehicles.id))
        .leftJoin(drivers, eq(transportRoutes.driverId, drivers.id))
        .where(
          and(
            eq(transportRoutes.schoolId, currentUser.schoolId || ""),
            eq(transportRoutes.isActive, true)
          )
        )
        .orderBy(transportRoutes.routeNumber);

      const enrichedRoutes = routes.map(row => ({
        id: row.id,
        schoolId: row.schoolId,
        routeNumber: row.routeNumber,
        name: row.name,
        routeName: row.routeName,
        startLocation: row.startLocation,
        endLocation: row.endLocation,
        stops: row.stops,
        distance: row.distance,
        totalDistance: row.totalDistance,
        estimatedTime: row.estimatedTime,
        estimatedDuration: row.estimatedDuration,
        fee: row.fee,
        morningStartTime: row.morningStartTime,
        morningEndTime: row.morningEndTime,
        afternoonStartTime: row.afternoonStartTime,
        afternoonEndTime: row.afternoonEndTime,
        capacity: row.capacity,
        currentStudents: row.currentStudents,
        isActive: row.isActive,
        vehicleId: row.vehicleId,
        driverId: row.driverId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        vehicle: row.vehicleRegistrationNumber ? {
          registrationNumber: row.vehicleRegistrationNumber,
          vehicleType: row.vehicleType,
          capacity: row.vehicleCapacity,
          driverName: row.vehicleDriverName,
        } : null,
        driver: row.driverFirstName ? {
          firstName: row.driverFirstName,
          lastName: row.driverLastName,
          phone: row.driverPhone,
        } : null,
      }));

      return { routes: enrichedRoutes };
    }

    if (action === "allocations") {
      // Get all student allocations
      const allocations = await db
        .select({
          id: transportAllocations.id,
          studentId: transportAllocations.studentId,
          routeId: transportAllocations.routeId,
          vehicleId: transportAllocations.vehicleId,
          stopName: transportAllocations.stopName,
          pickupPoint: transportAllocations.pickupPoint,
          dropPoint: transportAllocations.dropPoint,
          pickupTime: transportAllocations.pickupTime,
          dropTime: transportAllocations.dropTime,
          academicYear: transportAllocations.academicYear,
          fee: transportAllocations.fee,
          isPaid: transportAllocations.isPaid,
          isActive: transportAllocations.isActive,
          createdAt: transportAllocations.createdAt,
          updatedAt: transportAllocations.updatedAt,
          // Student fields
          studentId_student: users.id,
          studentFirstName: users.firstName,
          studentLastName: users.lastName,
          studentClassGrade: users.classGrade,
          studentSection: users.section,
          // Route fields
          routeId_route: transportRoutes.id,
          routeNumber: transportRoutes.routeNumber,
          routeName: transportRoutes.name,
        })
        .from(transportAllocations)
        .leftJoin(users, eq(transportAllocations.studentId, users.id))
        .leftJoin(transportRoutes, eq(transportAllocations.routeId, transportRoutes.id))
        .where(eq(transportAllocations.schoolId, currentUser.schoolId || ""))
        .orderBy(desc(transportAllocations.createdAt));

      const enrichedAllocations = allocations.map(row => ({
        id: row.id,
        studentId: row.studentId,
        routeId: row.routeId,
        vehicleId: row.vehicleId,
        stopName: row.stopName,
        pickupPoint: row.pickupPoint,
        dropPoint: row.dropPoint,
        pickupTime: row.pickupTime,
        dropTime: row.dropTime,
        academicYear: row.academicYear,
        fee: row.fee,
        isPaid: row.isPaid,
        isActive: row.isActive,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        student: row.studentId_student ? {
          id: row.studentId_student,
          firstName: row.studentFirstName,
          lastName: row.studentLastName,
          classGrade: row.studentClassGrade,
          section: row.studentSection,
        } : null,
        route: row.routeId_route ? {
          id: row.routeId_route,
          routeNumber: row.routeNumber,
          name: row.routeName,
        } : null,
      }));

      return { allocations: enrichedAllocations };
    }

    // Default: return routes
    const routes = await db
      .select({
        id: transportRoutes.id,
        schoolId: transportRoutes.schoolId,
        routeNumber: transportRoutes.routeNumber,
        name: transportRoutes.name,
        routeName: transportRoutes.routeName,
        startLocation: transportRoutes.startLocation,
        endLocation: transportRoutes.endLocation,
        stops: transportRoutes.stops,
        distance: transportRoutes.distance,
        totalDistance: transportRoutes.totalDistance,
        estimatedTime: transportRoutes.estimatedTime,
        estimatedDuration: transportRoutes.estimatedDuration,
        fee: transportRoutes.fee,
        morningStartTime: transportRoutes.morningStartTime,
        morningEndTime: transportRoutes.morningEndTime,
        afternoonStartTime: transportRoutes.afternoonStartTime,
        afternoonEndTime: transportRoutes.afternoonEndTime,
        capacity: transportRoutes.capacity,
        currentStudents: transportRoutes.currentStudents,
        isActive: transportRoutes.isActive,
        vehicleId: transportRoutes.vehicleId,
        driverId: transportRoutes.driverId,
        createdAt: transportRoutes.createdAt,
        updatedAt: transportRoutes.updatedAt,
        // Vehicle fields
        vehicleRegistrationNumber: vehicles.registrationNumber,
        vehicleType: vehicles.vehicleType,
        vehicleCapacity: vehicles.capacity,
        vehicleDriverName: vehicles.driverName,
        // Driver fields
        driverFirstName: drivers.firstName,
        driverLastName: drivers.lastName,
        driverPhone: drivers.phone,
      })
      .from(transportRoutes)
      .leftJoin(vehicles, eq(transportRoutes.vehicleId, vehicles.id))
      .leftJoin(drivers, eq(transportRoutes.driverId, drivers.id))
      .where(
        and(
          eq(transportRoutes.schoolId, currentUser.schoolId || ""),
          eq(transportRoutes.isActive, true)
        )
      )
      .orderBy(transportRoutes.routeNumber);

    const enrichedRoutes = routes.map(row => ({
      id: row.id,
      schoolId: row.schoolId,
      routeNumber: row.routeNumber,
      name: row.name,
      routeName: row.routeName,
      startLocation: row.startLocation,
      endLocation: row.endLocation,
      stops: row.stops,
      distance: row.distance,
      totalDistance: row.totalDistance,
      estimatedTime: row.estimatedTime,
      estimatedDuration: row.estimatedDuration,
      fee: row.fee,
      morningStartTime: row.morningStartTime,
      morningEndTime: row.morningEndTime,
      afternoonStartTime: row.afternoonStartTime,
      afternoonEndTime: row.afternoonEndTime,
      capacity: row.capacity,
      currentStudents: row.currentStudents,
      isActive: row.isActive,
      vehicleId: row.vehicleId,
      driverId: row.driverId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      vehicle: row.vehicleRegistrationNumber ? {
        registrationNumber: row.vehicleRegistrationNumber,
        vehicleType: row.vehicleType,
        capacity: row.vehicleCapacity,
        driverName: row.vehicleDriverName,
      } : null,
      driver: row.driverFirstName ? {
        firstName: row.driverFirstName,
        lastName: row.driverLastName,
        phone: row.driverPhone,
      } : null,
    }));

    return {
      routes,
      user: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
      },
    };
  }
);

// POST - Create or update transport data
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

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
      return { error: "User not found", status: 404 };
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
      } as TransportRouteInsert).returning();

      return {
        route: route[0],
      };
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
      } as TransportAllocationInsert).returning();

      return {
        allocation: allocation[0],
      };
    }

    return { error: "Invalid action", status: 400 };
  },
  ['admin', 'school-admin']
);
