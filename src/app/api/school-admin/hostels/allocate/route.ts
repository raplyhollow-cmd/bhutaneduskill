import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hostelRooms, hostelBuildings, hostelAllocations } from "@/lib/db/hostel-schema";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { successResponse, errorResponse, badRequestResponse, notFoundResponse } from "@/lib/api/response-helpers";
import { eq, and, sql, desc } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

interface AllocateRoomRequest {
  studentId: string;
  studentName: string;
  roomId: string;
  bedNumber?: string;
}

interface RoomAllocationResult {
  success: boolean;
  roomNumber: string;
  hostelName: string;
  previousOccupancy: number;
  newOccupancy: number;
  capacity: number;
}

// ============================================================================
// POST /api/school-admin/hostels/allocate - Allocate student to hostel room
// ============================================================================

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const permCheck = await requirePermission(userId, "hostels.allocate");
    if (permCheck) return permCheck;

    const body: AllocateRoomRequest = await request.json();
    const { studentId, studentName, roomId, bedNumber } = body;

    if (!studentId || !roomId) {
      return badRequestResponse("studentId and roomId are required");
    }

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return badRequestResponse("School ID not found");
    }

    const result = await db.transaction(async (tx) => {
      const [roomDetails] = await tx
        .select({
          id: hostelRooms.id,
          roomNumber: hostelRooms.roomNumber,
          capacity: hostelRooms.capacity,
          occupiedBeds: hostelRooms.occupiedBeds,
          hostelId: hostelRooms.hostelId,
          hostelName: hostelBuildings.name,
          schoolId: hostelBuildings.schoolId,
        })
        .from(hostelRooms)
        .innerJoin(hostelBuildings, eq(hostelRooms.hostelId, hostelBuildings.id))
        .where(eq(hostelRooms.id, roomId))
        .limit(1);

      if (!roomDetails) {
        throw new Error("Room not found");
      }

      if (roomDetails.schoolId !== schoolId) {
        throw new Error("Room does not belong to your school");
      }

      if (roomDetails.occupiedBeds >= roomDetails.capacity) {
        throw new Error(
          `Room ${roomDetails.roomNumber} is at full capacity (${roomDetails.capacity} beds)`
        );
      }

      // Check for existing allocation and free up if needed
      const [existingAllocation] = await tx
        .select()
        .from(hostelAllocations)
        .where(
          and(
            eq(hostelAllocations.studentId, studentId),
            eq(hostelAllocations.status, "active")
          )
        )
        .orderBy(desc(hostelAllocations.allocationDate))
        .limit(1);

      if (existingAllocation) {
        await tx
          .update(hostelRooms)
          .set({
            occupiedBeds: sql`${hostelRooms.occupiedBeds} - 1`,
            updatedAt: new Date(),
          })
          .where(eq(hostelRooms.id, existingAllocation.roomId));

        await tx
          .update(hostelAllocations)
          .set({
            status: "inactive",
            updatedAt: new Date(),
          })
          .where(eq(hostelAllocations.id, existingAllocation.id));
      }

      // Create new allocation
      const allocationId = `alloc_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const currentYear = new Date().getFullYear().toString();

      await tx.insert(hostelAllocations).values({
        id: allocationId,
        schoolId,
        studentId,
        studentName: studentName || null,
        hostelId: roomDetails.hostelId,
        roomId,
        bedNumber: bedNumber || null,
        allocationDate: new Date().toISOString().split("T")[0],
        academicYear: currentYear,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const [updatedRoom] = await tx
        .update(hostelRooms)
        .set({
          occupiedBeds: roomDetails.occupiedBeds + 1,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, roomId))
        .returning();

      return {
        roomNumber: roomDetails.roomNumber,
        hostelName: roomDetails.hostelName,
        previousOccupancy: roomDetails.occupiedBeds,
        newOccupancy: updatedRoom.occupiedBeds,
        capacity: roomDetails.capacity,
      };
    });

    logger.info("Hostel room allocated successfully", {
      schoolId,
      studentId,
      roomId,
      allocatedBy: userId,
      result,
    });

    return successResponse(
      {
        success: true,
        ...result,
      } satisfies RoomAllocationResult,
      `Student allocated to room ${result.roomNumber} in ${result.hostelName}`
    );
  },
  ["school-admin", "admin"]
);

// ============================================================================
// GET /api/school-admin/hostels/allocate - Get hostel occupancy report
// ============================================================================

export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { user } = auth;

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return badRequestResponse("School ID not found");
    }

    const buildings = await db
      .select()
      .from(hostelBuildings)
      .where(eq(hostelBuildings.schoolId, schoolId));

    if (buildings.length === 0) {
      return successResponse({
        hostels: [],
        summary: {
          totalHostels: 0,
          totalRooms: 0,
          totalCapacity: 0,
          totalOccupied: 0,
          totalAvailable: 0,
          overallOccupancyRate: 0,
        },
      } satisfies HostelAllocationReportData);
    }

    type HostelAllocationReportData = {
      buildings: Array<{
        id: string;
        name: string;
        type: string;
        capacity: number;
        occupied: number;
        available: number;
        occupancyRate: number;
      }>;
      summary: {
        totalHostels: number;
        totalRooms: number;
        totalCapacity: number;
        totalOccupied: number;
        totalAvailable: number;
        overallOccupancyRate: number;
      };
    };

    const buildingIds = buildings.map((b) => b.id);
    const allRooms = await db
      .select()
      .from(hostelRooms)
      .where(sql`${hostelRooms.hostelId} = ANY(${buildingIds})`);

    const report = buildings.map((building) => {
      const buildingRooms = allRooms.filter((r) => r.hostelId === building.id);
      const hostelCapacity = buildingRooms.reduce((sum, r) => sum + r.capacity, 0);
      const hostelOccupied = buildingRooms.reduce((sum, r) => sum + r.occupiedBeds, 0);
      const occupancyRate = hostelCapacity > 0 ? Math.round((hostelOccupied / hostelCapacity) * 100) : 0;

      return {
        id: building.id,
        name: building.name,
        type: building.type,
        capacity: hostelCapacity,
        occupied: hostelOccupied,
        available: hostelCapacity - hostelOccupied,
        occupancyRate,
        rooms: buildingRooms.map((room) => ({
          id: room.id,
          roomNumber: room.roomNumber,
          capacity: room.capacity,
          occupied: room.occupiedBeds,
          available: room.capacity - room.occupiedBeds,
          isFull: room.occupiedBeds >= room.capacity,
        })),
      };
    });

    const totalCapacity = report.reduce((sum, h) => sum + h.capacity, 0);
    const totalOccupied = report.reduce((sum, h) => sum + h.occupied, 0);

    return successResponse({
      hostels: report,
      summary: {
        totalHostels: buildings.length,
        totalRooms: allRooms.length,
        totalCapacity,
        totalOccupied,
        totalAvailable: totalCapacity - totalOccupied,
        overallOccupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
      },
    } satisfies HostelAllocationReportData);
  },
  ["school-admin", "admin"]
);

// ============================================================================
// DELETE /api/school-admin/hostels/allocate - Deallocate student from room
// ============================================================================

export const DELETE = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const permCheck = await requirePermission(userId, "hostels.allocate");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return badRequestResponse("studentId is required");
    }

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return badRequestResponse("School ID not found");
    }

    const [allocation] = await db
      .select()
      .from(hostelAllocations)
      .where(
        and(
          eq(hostelAllocations.studentId, studentId),
          eq(hostelAllocations.status, "active")
        )
      )
      .orderBy(desc(hostelAllocations.allocationDate))
      .limit(1);

    if (!allocation) {
      return badRequestResponse("Student is not allocated to any room");
    }

    await db.transaction(async (tx) => {
      await tx
        .update(hostelAllocations)
        .set({
          status: "inactive",
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocation.id));

      await tx
        .update(hostelRooms)
        .set({
          occupiedBeds: sql`${hostelRooms.occupiedBeds} - 1`,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, allocation.roomId));
    });

    logger.info("Student deallocated from hostel room", {
      schoolId,
      studentId,
      deallocatedBy: userId,
    });

    return successResponse(
      { success: true },
      `Student removed from room successfully`
    );
  },
  ["school-admin", "admin"]
);
