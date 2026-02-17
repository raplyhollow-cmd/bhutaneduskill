import { logger } from "@/lib/logger";
/**
 * HOSTEL ALLOCATIONS API ROUTE
 *
 * Comprehensive management of hostel room allocations
 * Handles allocation requests, approvals, room changes, and checkouts
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  users,
  hostelAllocations,
  hostelRooms,
  hostelBuildings,
  hostelPayments,
  hostelFees,
} from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// GET - Fetch allocations
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        type: true,
        role: true,
        schoolId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get("schoolId") || currentUser.schoolId;
    const hostelId = searchParams.get("hostelId");
    const status = searchParams.get("status") || "active";
    const roomId = searchParams.get("roomId");

    const whereConditions: any[] = [
      eq(hostelAllocations.schoolId, schoolId || ""),
    ];

    if (status !== "all") {
      whereConditions.push(eq(hostelAllocations.status, status));
    }

    if (hostelId) {
      whereConditions.push(eq(hostelAllocations.hostelId, hostelId));
    }

    if (roomId) {
      whereConditions.push(eq(hostelAllocations.roomId, roomId));
    }

    // Fetch allocations with room and hostel details
    const allocations = await db.query.hostelAllocations.findMany({
      where: and(...whereConditions),
      orderBy: [desc(hostelAllocations.createdAt)],
      limit: 100,
    });

    // Enrich with room and hostel details
    const enrichedAllocations = await Promise.all(
      allocations.map(async (allocation) => {
        let room = null;
        let hostel = null;

        if (allocation.roomId) {
          room = await db.query.hostelRooms.findFirst({
            where: eq(hostelRooms.id, allocation.roomId),
          });
        }

        if (allocation.hostelId) {
          hostel = await db.query.hostelBuildings.findFirst({
            where: eq(hostelBuildings.id, allocation.hostelId),
          });
        }

        // Get payment history
        const payments = await db.query.hostelPayments.findMany({
          where: eq(hostelPayments.allocationId, allocation.id),
          orderBy: [desc(hostelPayments.paymentDate)],
          limit: 5,
        });

        return {
          ...allocation,
          room,
          hostel,
          paymentHistory: payments,
        };
      })
    );

    // Calculate stats
    const stats = {
      total: enrichedAllocations.length,
      active: enrichedAllocations.filter((a) => a.status === "active").length,
      pending: enrichedAllocations.filter((a) => a.status === "pending").length,
      totalCapacity: 0,
      occupied: 0,
      pendingFees: enrichedAllocations
        .filter((a) => (a.feeOutstanding || 0) > 0)
        .reduce((sum, a) => sum + (a.feeOutstanding || 0), 0),
    };

    return NextResponse.json({
      data: {
        allocations: enrichedAllocations,
        stats,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch allocations", status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create allocation
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        type: true,
        role: true,
        schoolId: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      studentId,
      hostelId,
      roomId,
      bedNumber,
      roomType,
      feeType,
      feeAmount,
      allocationDate,
      academicYear,
      semester,
      emergencyContact,
      medicalConditions,
    } = body;

    // Verify student exists
    const student = await db.query.users.findFirst({
      where: eq(users.id, studentId),
      columns: { id: true, firstName: true, lastName: true, type: true },
    });

    if (!student || student.type !== "student") {
      return NextResponse.json(
        { error: "Student not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Check for existing active allocation
    const existingAllocation = await db.query.hostelAllocations.findFirst({
      where: and(
        eq(hostelAllocations.studentId, studentId),
        eq(hostelAllocations.status, "active")
      ),
    });

    if (existingAllocation) {
      return NextResponse.json(
        {
          error: "Student already has an active hostel allocation",
          status: 400,
          details: { existingAllocation },
        } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Verify room exists and has capacity
    if (roomId) {
      const room = await db.query.hostelRooms.findFirst({
        where: eq(hostelRooms.id, roomId),
      });

      if (!room) {
        return NextResponse.json(
          { error: "Room not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      if ((room.occupiedBeds || 0) >= room.capacity) {
        return NextResponse.json(
          { error: "Room is at full capacity" } as ApiErrorResponse,
          { status: 400 }
        );
      }
    }

    // Get fee structure if not provided
    let finalFeeAmount = feeAmount;
    if (!finalFeeAmount && roomType) {
      const feeStructure = await db.query.hostelFees.findFirst({
        where: and(
          eq(hostelFees.schoolId, currentUser.schoolId || ""),
          eq(hostelFees.academicYear, academicYear || new Date().getFullYear().toString()),
          eq(hostelFees.roomType, roomType)
        ),
      });

      finalFeeAmount =
        feeStructure?.semesterFee ||
        feeStructure?.annualFee ||
        feeStructure?.monthlyFee ||
        5000;
    }

    // Create allocation
    const allocationId = `alloc-${Date.now()}-${nanoid(8)}`;
    const [allocation] = await db
      .insert(hostelAllocations)
      .values({
        id: allocationId,
        schoolId: currentUser.schoolId || "",
        studentId,
        studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
        hostelId: hostelId || "",
        roomId: roomId || "",
        bedNumber: bedNumber || "",
        allocationDate: allocationDate || new Date().toISOString().split("T")[0],
        academicYear: academicYear || new Date().getFullYear().toString(),
        semester: semester || getCurrentSemester(),
        status: roomId ? "active" : "pending",
        feeType: feeType || "semester",
        feeAmount: finalFeeAmount || 0,
        feePaid: 0,
        feeOutstanding: finalFeeAmount || 0,
        emergencyContactName: emergencyContact?.name || "",
        emergencyContactPhone: emergencyContact?.phone || "",
        emergencyContactRelation: emergencyContact?.relation || "",
        bloodGroup: medicalConditions?.bloodGroup || "",
        medicalConditions: medicalConditions?.conditions || "",
        allergies: medicalConditions?.allergies || "",
        notes: medicalConditions?.specialRequirements || "",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Update room occupancy if room assigned
    if (roomId) {
      await db
        .update(hostelRooms)
        .set({
          occupiedBeds: sql`${hostelRooms.occupiedBeds} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, roomId));
    }

    return NextResponse.json({
      success: true,
      allocation: allocation[0],
      message: "Hostel allocation created successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to create allocation", status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update allocation
// ============================================================================

export async function PATCH(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const body = await request.json();
    const { allocationId, action, ...updateData } = body;

    if (!allocationId) {
      return NextResponse.json(
        { error: "Allocation ID is required" } as ApiErrorResponse,
        { status: 400 }
      );
    }

    const existingAllocation = await db.query.hostelAllocations.findFirst({
      where: eq(hostelAllocations.id, allocationId),
    });

    if (!existingAllocation) {
      return NextResponse.json(
        { error: "Allocation not found" } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Handle different update actions
    if (action === "assign-room") {
      const { roomId, bedNumber, hostelId } = updateData;

      // Verify room capacity
      const room = await db.query.hostelRooms.findFirst({
        where: eq(hostelRooms.id, roomId),
      });

      if (!room) {
        return NextResponse.json(
          { error: "Room not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      if ((room.occupiedBeds || 0) >= room.capacity) {
        return NextResponse.json(
          { error: "Room is at full capacity" } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Update allocation
      const [updated] = await db
        .update(hostelAllocations)
        .set({
          hostelId: hostelId || room.hostelId,
          roomId,
          bedNumber,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocationId))
        .returning();

      // Update old room occupancy if changing rooms
      if (existingAllocation.roomId && existingAllocation.roomId !== roomId) {
        await db
          .update(hostelRooms)
          .set({
            occupiedBeds: sql`GREATEST(0, ${hostelRooms.occupiedBeds} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(hostelRooms.id, existingAllocation.roomId));
      }

      // Update new room occupancy
      await db
        .update(hostelRooms)
        .set({
          occupiedBeds: sql`${hostelRooms.occupiedBeds} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, roomId));

      return NextResponse.json({
        success: true,
        allocation: updated,
        message: "Room assigned successfully",
      });
    }

    if (action === "checkout") {
      const { checkoutReason } = updateData;

      const [updated] = await db
        .update(hostelAllocations)
        .set({
          status: "completed",
          checkoutDate: new Date().toISOString().split("T")[0],
          checkoutReason,
          checkoutProcessedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocationId))
        .returning();

      // Free up the room
      if (existingAllocation.roomId) {
        await db
          .update(hostelRooms)
          .set({
            occupiedBeds: sql`GREATEST(0, ${hostelRooms.occupiedBeds} - 1)`,
            status: "available",
            updatedAt: new Date(),
          })
          .where(eq(hostelRooms.id, existingAllocation.roomId));
      }

      return NextResponse.json({
        success: true,
        allocation: updated,
        message: "Student checked out successfully",
      });
    }

    if (action === "change-room") {
      const { newRoomId, newBedNumber, reason } = updateData;

      // Verify new room has capacity
      const newRoom = await db.query.hostelRooms.findFirst({
        where: eq(hostelRooms.id, newRoomId),
      });

      if (!newRoom) {
        return NextResponse.json(
          { error: "New room not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      if ((newRoom.occupiedBeds || 0) >= newRoom.capacity) {
        return NextResponse.json(
          { error: "New room is at full capacity" } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Get old room for occupancy update
      const oldRoomId = existingAllocation.roomId;

      // Update allocation
      const [updated] = await db
        .update(hostelAllocations)
        .set({
          roomId: newRoomId,
          bedNumber: newBedNumber,
          hostelId: newRoom.hostelId,
          notes: `${existingAllocation.notes || ""}\nRoom change: ${reason || "No reason provided"}`,
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocationId))
        .returning();

      // Update room occupancies
      if (oldRoomId && oldRoomId !== newRoomId) {
        await db
          .update(hostelRooms)
          .set({
            occupiedBeds: sql`GREATEST(0, ${hostelRooms.occupiedBeds} - 1)`,
            updatedAt: new Date(),
          })
          .where(eq(hostelRooms.id, oldRoomId));
      }

      await db
        .update(hostelRooms)
        .set({
          occupiedBeds: sql`${hostelRooms.occupiedBeds} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, newRoomId));

      return NextResponse.json({
        success: true,
        allocation: updated,
        message: "Room changed successfully",
      });
    }

    if (action === "update-fee") {
      const { feeAmount, feePaid, feeOutstanding } = updateData;

      const [updated] = await db
        .update(hostelAllocations)
        .set({
          feeAmount: feeAmount !== undefined ? feeAmount : existingAllocation.feeAmount,
          feePaid: feePaid !== undefined ? feePaid : existingAllocation.feePaid,
          feeOutstanding:
            feeOutstanding !== undefined
              ? feeOutstanding
              : (feeAmount || existingAllocation.feeAmount || 0) -
                (feePaid || existingAllocation.feePaid || 0),
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocationId))
        .returning();

      return NextResponse.json({
        success: true,
        allocation: updated,
        message: "Fee information updated",
      });
    }

    // Default update
    const [updated] = await db
      .update(hostelAllocations)
      .set({
        ...updateData,
        updatedAt: new Date(),
      })
      .where(eq(hostelAllocations.id, allocationId))
      .returning();

    return NextResponse.json({
      success: true,
      allocation: updated,
      message: "Allocation updated successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to update allocation", status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Remove allocation
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const allocationId = searchParams.get("id");

    if (!allocationId) {
      return NextResponse.json(
        { error: "Allocation ID is required" } as ApiErrorResponse,
        { status: 400 }
      );
    }

    const allocation = await db.query.hostelAllocations.findFirst({
      where: eq(hostelAllocations.id, allocationId),
    });

    if (!allocation) {
      return NextResponse.json(
        { error: "Allocation not found" } as ApiErrorResponse,
        { status: 404 }
      );
    }

    // Free up the room
    if (allocation.roomId) {
      await db
        .update(hostelRooms)
        .set({
          occupiedBeds: sql`GREATEST(0, ${hostelRooms.occupiedBeds} - 1)`,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, allocation.roomId));
    }

    // Delete allocation
    await db.delete(hostelAllocations).where(eq(hostelAllocations.id, allocationId));

    return NextResponse.json({
      success: true,
      message: "Allocation deleted successfully",
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to delete allocation", status: 500 } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getCurrentSemester(): string {
  const month = new Date().getMonth();
  if (month >= 0 && month < 4) return "spring";
  if (month >= 4 && month < 8) return "summer";
  if (month >= 8 && month < 11) return "fall";
  return "winter";
}
