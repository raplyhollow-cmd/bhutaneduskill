/**
 * TRANSPORT ALLOCATIONS API
 *
 * Handles student transport route allocations
 * - GET: Fetch allocations (with filtering)
 * - POST: Create new allocation
 * - PATCH: Update existing allocation
 * - DELETE: Remove allocation
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { db } from "@/lib/db";
import { transportAllocations, transportRoutes, vehicles, users } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import { logger } from "@/lib/logger";

// Types for proper TypeScript safety
interface TransportAllocationWithDetails {
  id: string;
  studentId: string;
  routeId: string;
  vehicleId: string | null;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  academicYear: string;
  fee: number;
  isPaid: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    classGrade: string;
    section: string;
  };
  route?: {
    id: string;
    name: string;
    routeNumber: string;
    startLocation: string;
    endLocation: string;
    fee: number;
  };
  vehicle?: {
    id: string;
    registrationNumber: string;
    vehicleType: string;
    capacity: number;
    driverName: string;
    driverPhone: string;
  };
}

// ============================================================================
// GET - Fetch transport allocations
// ============================================================================

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
    const action = searchParams.get("action");
    const studentId = searchParams.get("studentId");
    const routeId = searchParams.get("routeId");
    const academicYear = searchParams.get("academicYear");

    // Student viewing their own allocation
    if (action === "my-allocation" || (!action && currentUser.type === "student")) {
      const allocation = await db.query.transportAllocations.findFirst({
        where: and(
          eq(transportAllocations.studentId, currentUser.id),
          eq(transportAllocations.isActive, true)
        ),
        with: {
          route: true,
          vehicle: true,
        },
      });

      if (!allocation) {
        return NextResponse.json({
          allocation: null,
          hasTransport: false,
          message: "No transport allocation found",
        });
      }

      // Get student details
      const student = await db.query.users.findFirst({
        where: eq(users.id, currentUser.id),
        columns: { id: true, firstName: true, lastName: true, classGrade: true, section: true },
      });

      // Get driver info from vehicle
      let driver: { id: string; firstName: string; lastName: string; phone?: string } | null = null;
      const vehicleData = allocation.vehicle as unknown as {
        id: string;
        registrationNumber: string;
        vehicleType: string;
        capacity: number;
        driverName?: string;
        driverPhone?: string;
      } | null;

      if (vehicleData) {
        const nameParts = (vehicleData.driverName || "").split(" ");
        driver = {
          id: vehicleData.id,
          firstName: nameParts[0] || "",
          lastName: nameParts.slice(1).join(" ") || "",
          phone: vehicleData.driverPhone,
        };
      }

      const routeData = allocation.route as unknown as {
        id: string;
        routeNumber: string;
        name: string;
        routeName?: string;
        startLocation: string;
        endLocation: string;
        fee: number;
        stops?: Array<{
          name: string;
          location: { lat: string; lng: string };
          time: string;
        }>;
      } | null;

      return NextResponse.json({
        allocation: {
          id: allocation.id,
          studentId: allocation.studentId,
          routeId: allocation.routeId,
          vehicleId: allocation.vehicleId,
          pickupPoint: allocation.pickupPoint || allocation.stopName || "",
          dropPoint: routeData?.endLocation || allocation.dropPoint || allocation.stopName || "",
          pickupTime: allocation.pickupTime,
          dropTime: allocation.dropTime,
          status: allocation.isActive ? "active" : "inactive",
          fee: allocation.fee ?? routeData?.fee,
          isPaid: allocation.isPaid,
          route: routeData ? {
            id: routeData.id,
            routeNumber: routeData.routeNumber,
            routeName: routeData.routeName || routeData.name,
            description: `${routeData.startLocation} to ${routeData.endLocation}`,
            fee: routeData.fee,
          } : undefined,
          vehicle: vehicleData ? {
            id: vehicleData.id,
            registrationNumber: vehicleData.registrationNumber,
            make: vehicleData.vehicleType,
            model: "",
            capacity: vehicleData.capacity,
          } : undefined,
          driver,
        },
        hasTransport: true,
      });
    }

    // Admin/School-admin viewing all allocations
    if (currentUser.role === "admin" || currentUser.role === "school-admin") {
      const conditions: Array<unknown> = [];

      // Filter by student
      if (studentId) {
        conditions.push(eq(transportAllocations.studentId, studentId));
      }

      // Filter by route
      if (routeId) {
        conditions.push(eq(transportAllocations.routeId, routeId));
      }

      // Filter by academic year
      if (academicYear) {
        conditions.push(eq(transportAllocations.academicYear, academicYear));
      }

      // Only active allocations
      conditions.push(eq(transportAllocations.isActive, true));

      const whereClause = conditions.length > 0 ? and(...conditions as Array<any>) : undefined;

      const allocations = await db.query.transportAllocations.findMany({
        where: whereClause,
        with: {
          route: true,
          vehicle: true,
        },
        orderBy: [desc(transportAllocations.createdAt)],
      });

      // Enrich with student details
      const allocationsWithStudents: TransportAllocationWithDetails[] = [];

      for (const allocation of allocations) {
        const student = await db.query.users.findFirst({
          where: eq(users.id, allocation.studentId),
          columns: { id: true, firstName: true, lastName: true, classGrade: true, section: true },
        });

        const studentData = student ? {
          id: student.id,
          firstName: student.firstName,
          lastName: student.lastName,
          classGrade: student.classGrade?.toString() || "",
          section: student.section || "",
        } : undefined;

        // Create a properly typed allocation object
        const allocationWithDetails: TransportAllocationWithDetails = {
          id: allocation.id,
          studentId: allocation.studentId,
          routeId: allocation.routeId,
          vehicleId: allocation.vehicleId ?? null,
          stopName: allocation.stopName ?? allocation.pickupPoint ?? "",
          pickupTime: allocation.pickupTime,
          dropTime: allocation.dropTime,
          academicYear: allocation.academicYear,
          fee: allocation.fee ?? 0,
          isPaid: allocation.isPaid ?? false,
          isActive: allocation.isActive ?? false,
          createdAt: allocation.createdAt,
          updatedAt: allocation.updatedAt,
          student: studentData,
          route: allocation.route as unknown as TransportAllocationWithDetails["route"],
          vehicle: allocation.vehicle as unknown as TransportAllocationWithDetails["vehicle"],
        };

        allocationsWithStudents.push(allocationWithDetails);
      }

      return NextResponse.json({
        allocations: allocationsWithStudents,
        total: allocationsWithStudents.length,
      });
    }

    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/allocations", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch transport allocations" },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create transport allocation
// ============================================================================

interface CreateAllocationBody {
  studentId: string;
  routeId: string;
  vehicleId?: string;
  stopName: string;
  pickupTime: string;
  dropTime: string;
  academicYear?: string;
  fee?: number;
}

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

    const body: CreateAllocationBody = await request.json();
    const {
      studentId,
      routeId,
      vehicleId,
      stopName,
      pickupTime,
      dropTime,
      academicYear = new Date().getFullYear().toString(),
      fee,
    } = body;

    // Validate required fields
    if (!studentId || !routeId || !stopName || !pickupTime || !dropTime) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, routeId, stopName, pickupTime, dropTime" },
        { status: 400 }
      );
    }

    // Verify student exists
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Verify route exists
    const route = await db.query.transportRoutes.findFirst({
      where: eq(transportRoutes.id, routeId),
    });

    if (!route) {
      return NextResponse.json({ error: "Route not found" }, { status: 404 });
    }

    // Deactivate existing allocation for this student
    await db
      .update(transportAllocations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(transportAllocations.studentId, studentId));

    // Create new allocation
    const allocationId = `allocation-${nanoid()}`;
    const [newAllocation] = await db
      .insert(transportAllocations)
      .values({
        id: allocationId,
        studentId,
        routeId,
        vehicleId: vehicleId || null,
        schoolId: currentUser.schoolId || student.schoolId || "",
        stopName,
        pickupTime,
        dropTime,
        academicYear,
        fee: fee || route.fee,
        isPaid: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    logger.info("Transport allocation created", {
      allocationId,
      studentId,
      routeId,
      createdBy: userId,
    });

    return NextResponse.json({
      success: true,
      allocation: newAllocation,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/allocations", method: "POST" });
    return NextResponse.json(
      { error: "Failed to create transport allocation" },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update transport allocation
// ============================================================================

interface UpdateAllocationBody {
  allocationId: string;
  routeId?: string;
  vehicleId?: string;
  stopName?: string;
  pickupTime?: string;
  dropTime?: string;
  isActive?: boolean;
  isPaid?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const body: UpdateAllocationBody = await request.json();
    const { allocationId, ...updateData } = body;

    if (!allocationId) {
      return NextResponse.json(
        { error: "allocationId is required" },
        { status: 400 }
      );
    }

    // Update allocation
    const [updatedAllocation] = await db
      .update(transportAllocations)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(transportAllocations.id, allocationId))
      .returning();

    if (!updatedAllocation) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    logger.info("Transport allocation updated", {
      allocationId,
      updatedBy: userId,
    });

    return NextResponse.json({
      success: true,
      allocation: updatedAllocation,
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/allocations", method: "PATCH" });
    return NextResponse.json(
      { error: "Failed to update transport allocation" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Deactivate transport allocation
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { userId } = authResult;

    const { searchParams } = new URL(request.url);
    const allocationId = searchParams.get("id");

    if (!allocationId) {
      return NextResponse.json(
        { error: "Allocation id is required" },
        { status: 400 }
      );
    }

    // Soft delete (deactivate)
    const [deletedAllocation] = await db
      .update(transportAllocations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(transportAllocations.id, allocationId))
      .returning();

    if (!deletedAllocation) {
      return NextResponse.json({ error: "Allocation not found" }, { status: 404 });
    }

    logger.info("Transport allocation deactivated", {
      allocationId,
      deletedBy: userId,
    });

    return NextResponse.json({
      success: true,
      message: "Allocation deactivated successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/transport/allocations", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to deactivate transport allocation" },
      { status: 500 }
    );
  }
}
