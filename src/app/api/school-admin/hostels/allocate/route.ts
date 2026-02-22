import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hostelRooms, hostelBuildings, hostelAllocations } from "@/lib/db/hostel-schema";
import { requireAuth } from "@/lib/auth-utils";
import { requirePermission } from "@/lib/rbac";
import { logger } from "@/lib/logger";
import { eq, and, sql, desc } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

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

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const permCheck = await requirePermission(userId, "hostels.allocate");
    if (permCheck) return permCheck;

    const body: AllocateRoomRequest = await request.json();
    const { studentId, studentName, roomId, bedNumber } = body;

    if (!studentId || !roomId) {
      return NextResponse.json(
        { error: "studentId and roomId are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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

    return NextResponse.json({
      data: {
        success: true,
        ...result,
      } satisfies RoomAllocationResult,
      message: `Student allocated to room ${result.roomNumber} in ${result.hostelName}`,
    } satisfies ApiSuccess<RoomAllocationResult>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/hostels/allocate", method: "POST" });

    const message = error instanceof Error ? error.message : "Failed to allocate room";

    return NextResponse.json(
      { error: message, status: message.includes("not found") ? 404 : 400 } satisfies ApiErrorResponse,
      { status: message.includes("not found") ? 404 : 400 }
    );
  }
}

// ============================================================================
// GET /api/school-admin/hostels/allocate - Get hostel occupancy report
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { user } = authResult;

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const buildings = await db
      .select()
      .from(hostelBuildings)
      .where(eq(hostelBuildings.schoolId, schoolId));

    if (buildings.length === 0) {
      return NextResponse.json({
        data: {
          hostels: [],
          summary: {
            totalHostels: 0,
            totalRooms: 0,
            totalCapacity: 0,
            totalOccupied: 0,
            totalAvailable: 0,
            overallOccupancyRate: 0,
          },
        },
      } satisfies ApiSuccess<any>);
    }

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

    return NextResponse.json({
      data: {
        hostels: report,
        summary: {
          totalHostels: buildings.length,
          totalRooms: allRooms.length,
          totalCapacity,
          totalOccupied,
          totalAvailable: totalCapacity - totalOccupied,
          overallOccupancyRate: totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0,
        },
      },
    } satisfies ApiSuccess<any>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/hostels/allocate", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch occupancy report", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/school-admin/hostels/allocate - Deallocate student from room
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["school-admin", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const permCheck = await requirePermission(userId, "hostels.allocate");
    if (permCheck) return permCheck;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const schoolId = user.type === "admin"
      ? request.headers.get("x-school-id")
      : user.schoolId;

    if (!schoolId) {
      return NextResponse.json(
        { error: "School ID not found", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Student is not allocated to any room", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
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

    return NextResponse.json({
      data: { success: true },
      message: `Student removed from room successfully`,
    } satisfies ApiSuccess<{ success: boolean }>);

  } catch (error) {
    logger.apiError(error, { route: "/api/school-admin/hostels/allocate", method: "DELETE" });
    return NextResponse.json(
      { error: "Failed to deallocate room", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
