import { logger } from "@/lib/logger";
/**
 * HOSTEL MANAGEMENT API ROUTE
 *
 * Handles hostel rooms, allocations, and attendance for students
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth-utils";
import {
  users,
  hostelAllocations,
  hostelRooms,
  hostelBuildings,
  hostelAttendance,
  hostelFacilities,
  hostelLeaveRequests,
  hostelFees,
  hostelPayments,
  hostelMess,
  roomInspections,
  hostelComplaints,
  hostelRules,
} from "@/lib/db/schema";
import { eq, and, desc, sql, or, gte, lte, count } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// GET - Fetch hostel data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin", "student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        type: true,
        role: true,
        schoolId: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // Action: my-allocation (Student's hostel allocation)
    if (action === "my-allocation" || action === "my-location") {
      const allocation = await db.query.hostelAllocations.findFirst({
        where: and(
          eq(hostelAllocations.studentId, currentUser.id),
          sql`${hostelAllocations.status} = ${"active"}`
        ),
        with: {
          room: true,
        },
      });

      if (!allocation) {
        return NextResponse.json({
          data: {
            allocation: null,
            message: "No hostel allocation found. Contact school admin for hostel allocation.",
          },
        });
      }

      // Get room and hostel details
      let hostel: typeof hostelBuildings.$inferSelect | null = null;
      if (allocation.hostelId) {
        hostel = await db.query.hostelBuildings.findFirst({
          where: eq(hostelBuildings.id, allocation.hostelId),
        });
      }

      // Get fee information
      const fees = await db.query.hostelPayments.findMany({
        where: eq(hostelPayments.studentId, currentUser.id),
        orderBy: [desc(hostelPayments.paymentDate)],
        limit: 10,
      });

      return NextResponse.json({
        data: {
          allocation: {
            ...allocation,
            hostel,
            roomType: (allocation.room as any)?.roomType || "standard",
            feeAmount: allocation.feeAmount,
            feePaid: allocation.feePaid,
            checkInDate: allocation.allocationDate,
            recentPayments: fees,
          },
        },
      });
    }

    // Action: facilities (Hostel facilities)
    if (action === "facilities") {
      const hostelId = searchParams.get("hostelId");

      let facilities = await db.query.hostelFacilities.findMany({
        where: hostelId
          ? eq(hostelFacilities.hostelId, hostelId)
          : eq(hostelFacilities.schoolId, currentUser.schoolId || ""),
      });

      // If no specific hostel, also get building-level facilities
      if (!hostelId && currentUser.schoolId) {
        const buildings = await db.query.hostelBuildings.findMany({
          where: eq(hostelBuildings.schoolId, currentUser.schoolId),
        });

        // Transform building facilities to facility format
        const buildingFacilities = buildings.flatMap((building) => {
          const facilityList = [];
          if (building.hasWiFi) facilityList.push({ id: `wifi-${building.id}`, name: "Wi-Fi", available: true, type: "wifi" });
          if (building.hasHotWater) facilityList.push({ id: `hotwater-${building.id}`, name: "Hot Water", available: true, type: "utility" });
          if (building.hasCommonRoom) facilityList.push({ id: `common-${building.id}`, name: "Common Room", available: true, type: "recreation" });
          if (building.hasStudyRoom) facilityList.push({ id: `study-${building.id}`, name: "Study Room", available: true, type: "study" });
          if (building.hasTVRoom) facilityList.push({ id: `tv-${building.id}`, name: "TV Lounge", available: true, type: "recreation" });
          if (building.hasLaundry) facilityList.push({ id: `laundry-${building.id}`, name: "Laundry", available: true, type: "washing" });
          if (building.hasGym) facilityList.push({ id: `gym-${building.id}`, name: "Gym", available: true, type: "sports" });
          if (building.hasPrayerRoom) facilityList.push({ id: `prayer-${building.id}`, name: "Prayer Room", available: true, type: "other" });
          return facilityList;
        });

        facilities = [...facilities, ...buildingFacilities];
      }

      return NextResponse.json({
        success: true,
        facilities,
      });
    }

    // Action: rooms (Available rooms)
    if (action === "rooms") {
      const hostelId = searchParams.get("hostelId");
      const status = searchParams.get("status") || "available";
      const roomType = searchParams.get("roomType");

      const whereConditions: any[] = [
        eq(hostelRooms.schoolId, currentUser.schoolId || ""),
      ];

      if (hostelId) {
        whereConditions.push(eq(hostelRooms.hostelId, hostelId));
      }

      if (status === "available") {
        whereConditions.push(sql`(${hostelRooms.occupiedBeds} < ${hostelRooms.capacity})`);
      } else {
        whereConditions.push(eq(hostelRooms.status, status));
      }

      if (roomType) {
        whereConditions.push(eq(hostelRooms.roomType, roomType));
      }

      const rooms = await db.query.hostelRooms.findMany({
        where: and(...whereConditions),
        with: {
          hostel: true,
        },
        orderBy: [hostelRooms.roomNumber],
      });

      return NextResponse.json({
        success: true,
        rooms,
      });
    }

    // Action: buildings (All hostel buildings)
    if (action === "buildings") {
      const buildings = await db.query.hostelBuildings.findMany({
        where: eq(hostelBuildings.schoolId, currentUser.schoolId || ""),
        orderBy: [hostelBuildings.name],
      });

      return NextResponse.json({
        success: true,
        buildings,
      });
    }

    // Action: attendance (Hostel attendance records)
    if (action === "attendance") {
      const studentId = searchParams.get("studentId") || currentUser.id;
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      const whereConditions: any[] = [];

      // Only allow viewing own attendance for students
      if (currentUser.type === "student") {
        whereConditions.push(eq(hostelAttendance.studentId, currentUser.id));
      } else if (studentId) {
        whereConditions.push(eq(hostelAttendance.studentId, studentId));
      }

      if (currentUser.schoolId) {
        whereConditions.push(eq(hostelAttendance.schoolId, currentUser.schoolId));
      }

      if (startDate) {
        whereConditions.push(gte(hostelAttendance.date, startDate));
      }
      if (endDate) {
        whereConditions.push(lte(hostelAttendance.date, endDate));
      }

      const attendance = await db.query.hostelAttendance.findMany({
        where: and(...whereConditions),
        orderBy: [desc(hostelAttendance.date)],
        limit: 31,
      });

      const stats = {
        total: attendance.length,
        present: attendance.filter((a) => a.status === "present").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        late: attendance.filter((a) => a.status === "late").length,
        excused: attendance.filter((a) => a.status === "excused").length,
        onLeave: attendance.filter((a) => a.status === "on_leave").length,
      };

      return NextResponse.json({
        success: true,
        attendance,
        stats,
      });
    }

    // Action: leave-requests (Leave requests)
    if (action === "leave-requests") {
      const studentId = searchParams.get("studentId");
      const status = searchParams.get("status");

      const whereConditions: any[] = [
        eq(hostelLeaveRequests.schoolId, currentUser.schoolId || ""),
      ];

      if (currentUser.type === "student") {
        whereConditions.push(eq(hostelLeaveRequests.studentId, currentUser.id));
      } else if (studentId) {
        whereConditions.push(eq(hostelLeaveRequests.studentId, studentId));
      }

      if (status) {
        whereConditions.push(eq(hostelLeaveRequests.status, status));
      }

      const leaveRequests = await db.query.hostelLeaveRequests.findMany({
        where: and(...whereConditions),
        orderBy: [desc(hostelLeaveRequests.createdAt)],
        limit: 20,
      });

      return NextResponse.json({
        success: true,
        leaveRequests,
      });
    }

    // Action: fees (Fee structure and payments)
    if (action === "fees") {
      const academicYear = searchParams.get("academicYear") || new Date().getFullYear().toString();
      const roomType = searchParams.get("roomType");

      const feeStructure = await db.query.hostelFees.findFirst({
        where: and(
          eq(hostelFees.schoolId, currentUser.schoolId || ""),
          eq(hostelFees.academicYear, academicYear),
          roomType ? eq(hostelFees.roomType, roomType) : sql`1=1`
        ),
      });

      let studentPayments = [];
      if (currentUser.type === "student") {
        studentPayments = await db.query.hostelPayments.findMany({
          where: eq(hostelPayments.studentId, currentUser.id),
          orderBy: [desc(hostelPayments.paymentDate)],
          limit: 20,
        });
      }

      return NextResponse.json({
        success: true,
        feeStructure,
        payments: studentPayments,
      });
    }

    // Action: mess (Mess/dining information)
    if (action === "mess") {
      const hostelId = searchParams.get("hostelId");

      let whereCondition = hostelId
        ? eq(hostelMess.hostelId, hostelId)
        : eq(hostelMess.schoolId, currentUser.schoolId || "");

      const messInfo = await db.query.hostelMess.findMany({
        where: whereCondition,
      });

      return NextResponse.json({
        success: true,
        mess: messInfo,
      });
    }

    // Action: rules (Hostel rules and regulations)
    if (action === "rules") {
      const hostelId = searchParams.get("hostelId");

      const whereConditions: any[] = [
        eq(hostelRules.schoolId, currentUser.schoolId || ""),
        eq(hostelRules.isActive, true),
      ];

      if (hostelId) {
        whereConditions.push(
          or(
            eq(hostelRules.appliesToHostel, hostelId),
            sql`${hostelRules.appliesToHostel} IS NULL`
          )
        );
      }

      const rules = await db.query.hostelRules.findMany({
        where: and(...whereConditions),
        orderBy: [hostelRules.displayOrder, hostelRules.category],
      });

      return NextResponse.json({
        success: true,
        rules,
      });
    }

    // Action: complaints (View complaints)
    if (action === "complaints") {
      const status = searchParams.get("status");

      const whereConditions: any[] = [
        eq(hostelComplaints.schoolId, currentUser.schoolId || ""),
      ];

      if (currentUser.type === "student") {
        whereConditions.push(eq(hostelComplaints.complainantId, currentUser.id));
      }

      if (status) {
        whereConditions.push(eq(hostelComplaints.status, status));
      }

      const complaints = await db.query.hostelComplaints.findMany({
        where: and(...whereConditions),
        orderBy: [desc(hostelComplaints.createdAt)],
        limit: 20,
      });

      return NextResponse.json({
        success: true,
        complaints,
      });
    }

    // Default: return summary
    return NextResponse.json({
      success: true,
      user: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
        schoolId: currentUser.schoolId,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to fetch hostel data" } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create hostel records (allocation, leave request, etc.)
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["admin", "school-admin", "student"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error } as ApiErrorResponse,
        { status: authResult.status }
      );
    }
    const { userId, user } = authResult;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
      columns: {
        id: true,
        type: true,
        role: true,
        schoolId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
      },
    });

    if (!currentUser) {
      return NextResponse.json(
        { error: "User not found", status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const body = await request.json();
    const { action } = body;

    // Action: request-allocation (Student requests hostel accommodation)
    if (action === "request-allocation") {
      if (currentUser.type !== "student") {
        return NextResponse.json(
          { error: "Only students can request hostel allocation" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const {
        hostelId,
        preferredRoomType,
        specialRequirements,
        medicalConditions,
        emergencyContact,
        localGuardian,
      } = body;

      // Check if student already has an active allocation
      const existingAllocation = await db.query.hostelAllocations.findFirst({
        where: and(
          eq(hostelAllocations.studentId, currentUser.id),
          eq(hostelAllocations.status, "active")
        ),
      });

      if (existingAllocation) {
        return NextResponse.json(
          {
            error: "You already have an active hostel allocation",
            status: 400,
            details: { existingAllocation },
          } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Get fee structure
      const feeStructure = await db.query.hostelFees.findFirst({
        where: and(
          eq(hostelFees.schoolId, currentUser.schoolId || ""),
          eq(hostelFees.academicYear, new Date().getFullYear().toString()),
          preferredRoomType
            ? eq(hostelFees.roomType, preferredRoomType)
            : sql`1=1`
        ),
      });

      const feeAmount = feeStructure?.semesterFee || feeStructure?.annualFee || 5000;

      // Create allocation request
      const allocationId = `alloc-${Date.now()}-${nanoid(8)}`;
      const [allocation] = await db
        .insert(hostelAllocations)
        .values({
          id: allocationId,
          schoolId: currentUser.schoolId || "",
          studentId: currentUser.id,
          studentName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
          hostelId: hostelId || "",
          roomId: "",
          bedNumber: "",
          allocationDate: new Date().toISOString().split("T")[0],
          academicYear: new Date().getFullYear().toString(),
          semester: getCurrentSemester(),
          status: "active",
          feeType: "semester",
          feeAmount,
          feePaid: 0,
          feeOutstanding: feeAmount,
          emergencyContactName: emergencyContact?.name || "",
          emergencyContactPhone: emergencyContact?.phone || "",
          emergencyContactRelation: emergencyContact?.relation || "",
          localGuardianName: localGuardian?.name || "",
          localGuardianPhone: localGuardian?.phone || "",
          localGuardianAddress: localGuardian?.address || "",
          bloodGroup: medicalConditions?.bloodGroup || "",
          medicalConditions: medicalConditions?.conditions || "",
          allergies: medicalConditions?.allergies || "",
          notes: specialRequirements || "",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        allocation: allocation[0],
        message:
          "Hostel allocation request submitted successfully. The school administration will assign your room shortly.",
      });
    }

    // Action: request-leave (Student requests leave from hostel)
    if (action === "request-leave") {
      if (currentUser.type !== "student") {
        return NextResponse.json(
          { error: "Only students can request leave" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const {
        leaveType,
        leaveReason,
        fromDate,
        fromTime,
        toDate,
        toTime,
        destination,
        companionName,
        companionPhone,
        parentApproval,
      } = body;

      // Calculate number of days
      const daysDiff =
        Math.ceil(
          (new Date(toDate).getTime() - new Date(fromDate).getTime()) /
            (1000 * 60 * 60 * 24)
        ) + 1;

      const leaveRequestId = `leave-${Date.now()}-${nanoid(8)}`;
      const [leaveRequest] = await db
        .insert(hostelLeaveRequests)
        .values({
          id: leaveRequestId,
          schoolId: currentUser.schoolId || "",
          studentId: currentUser.id,
          studentName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
          leaveType,
          leaveReason,
          fromDate,
          fromTime: fromTime || "17:00",
          toDate,
          toTime: toTime || "18:00",
          numberOfDays: daysDiff > 0 ? daysDiff : 1,
          destination,
          purpose: leaveReason,
          companionName,
          companionRelation: companionName ? "guardian" : "",
          companionPhone,
          parentApproved: parentApproval || false,
          parentApprovalDate: parentApproval ? new Date().toISOString() : undefined,
          parentName: parentApproval?.name || "",
          parentPhone: parentApproval?.phone || "",
          status: "pending",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        leaveRequest: leaveRequest[0],
        message: "Leave request submitted. Awaiting warden approval.",
      });
    }

    // Action: mark-attendance (Warden marks hostel attendance)
    if (action === "mark-attendance") {
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only wardens can mark attendance" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const { attendanceData } = body;
      // attendanceData is an array of { studentId, date, status, checkInTime, ... }

      const results = [];

      for (const record of attendanceData) {
        const {
          studentId,
          date,
          status,
          checkInTime,
          checkOutTime,
          leaveType,
          leaveReason,
          roomId,
          hostelId,
        } = record;

        // Check if attendance already exists
        const existing = await db.query.hostelAttendance.findFirst({
          where: and(
            eq(hostelAttendance.studentId, studentId),
            eq(hostelAttendance.date, date)
          ),
        });

        if (existing) {
          const [updated] = await db
            .update(hostelAttendance)
            .set({
              status,
              checkInTime,
              checkOutTime,
              leaveType,
              leaveReason,
              roomId,
              hostelId,
              markedBy: currentUser.id,
              updatedAt: new Date(),
            })
            .where(eq(hostelAttendance.id, existing.id))
            .returning();
          results.push(updated);
        } else {
          const attendanceId = `att-${Date.now()}-${nanoid(8)}`;
          const [inserted] = await db
            .insert(hostelAttendance)
            .values({
              id: attendanceId,
              schoolId: currentUser.schoolId || "",
              studentId,
              roomId,
              hostelId,
              date,
              status,
              checkInTime,
              checkOutTime,
              leaveType,
              leaveReason,
              markedBy: currentUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
            .returning();
          results.push(inserted);
        }
      }

      return NextResponse.json({
        success: true,
        attendance: results,
        message: `Attendance marked for ${results.length} student(s)`,
      });
    }

    // Action: allocate-room (Admin allocates room to student)
    if (action === "allocate-room") {
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can allocate rooms" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const { studentId, hostelId, roomId, bedNumber, feeType, feeAmount } = body;

      // Get student info
      const student = await db.query.users.findFirst({
        where: eq(users.id, studentId),
        columns: { id: true, firstName: true, lastName: true },
      });

      if (!student) {
        return NextResponse.json(
          { error: "Student not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      // Check room capacity
      const room = await db.query.hostelRooms.findFirst({
        where: eq(hostelRooms.id, roomId),
      });

      if (!room) {
        return NextResponse.json(
          { error: "Room not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      if (room.occupiedBeds >= room.capacity) {
        return NextResponse.json(
          { error: "Room is at full capacity" } as ApiErrorResponse,
          { status: 400 }
        );
      }

      // Create or update allocation
      const existingAllocation = await db.query.hostelAllocations.findFirst({
        where: eq(hostelAllocations.studentId, studentId),
      });

      if (existingAllocation) {
        await db
          .update(hostelAllocations)
          .set({
            hostelId: hostelId || "",
            roomId: roomId || "",
            bedNumber: bedNumber || "",
            feeType: feeType || "",
            feeAmount: feeAmount || 0,
            status: "active",
            updatedAt: new Date(),
          })
          .where(eq(hostelAllocations.id, existingAllocation.id));
      } else {
        const allocationId = `alloc-${Date.now()}-${nanoid(8)}`;
        await db.insert(hostelAllocations).values({
          id: allocationId,
          schoolId: currentUser.schoolId || "",
          studentId,
          studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
          hostelId: hostelId || "",
          roomId: roomId || "",
          bedNumber: bedNumber || "",
          allocationDate: new Date().toISOString().split("T")[0],
          academicYear: new Date().getFullYear().toString(),
          semester: getCurrentSemester(),
          status: "active",
          feeType: feeType || "",
          feeAmount: feeAmount || 0,
          feePaid: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // Update room occupancy
      await db
        .update(hostelRooms)
        .set({
          occupiedBeds: (room.occupiedBeds || 0) + 1,
          status: (room.occupiedBeds || 0) + 1 >= room.capacity ? "full" : room.status,
          updatedAt: new Date(),
        })
        .where(eq(hostelRooms.id, roomId));

      return NextResponse.json({
        success: true,
        message: "Room allocated successfully",
      });
    }

    // Action: checkout (Checkout student from hostel)
    if (action === "checkout") {
      const { allocationId, checkoutReason } = body;

      const allocation = await db.query.hostelAllocations.findFirst({
        where: eq(hostelAllocations.id, allocationId),
      });

      if (!allocation) {
        return NextResponse.json(
          { error: "Allocation not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      // Update allocation status
      await db
        .update(hostelAllocations)
        .set({
          status: "completed",
          checkoutDate: new Date().toISOString().split("T")[0],
          checkoutReason,
          checkoutProcessedBy: currentUser.id,
          updatedAt: new Date(),
        })
        .where(eq(hostelAllocations.id, allocationId));

      // Update room occupancy
      if (allocation.roomId) {
        const room = await db.query.hostelRooms.findFirst({
          where: eq(hostelRooms.id, allocation.roomId),
        });

        if (room) {
          await db
            .update(hostelRooms)
            .set({
              occupiedBeds: Math.max(0, (room.occupiedBeds || 0) - 1),
              status: "available",
              updatedAt: new Date(),
            })
            .where(eq(hostelRooms.id, allocation.roomId));
        }
      }

      return NextResponse.json({
        success: true,
        message: "Student checked out successfully",
      });
    }

    // Action: change-room (Request room change)
    if (action === "change-room") {
      const { allocationId, newRoomId, reason } = body;

      if (currentUser.type !== "student") {
        return NextResponse.json(
          { error: "Only students can request room changes" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      // Verify allocation belongs to student
      const allocation = await db.query.hostelAllocations.findFirst({
        where: and(
          eq(hostelAllocations.id, allocationId),
          eq(hostelAllocations.studentId, currentUser.id)
        ),
      });

      if (!allocation) {
        return NextResponse.json(
          { error: "Allocation not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      // Create a room change request (using complaints table for tracking)
      const requestId = `roomchange-${Date.now()}-${nanoid(8)}`;
      const [request] = await db
        .insert(hostelComplaints)
        .values({
          id: requestId,
          schoolId: currentUser.schoolId || "",
          complainantId: currentUser.id,
          complainantName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
          complainantType: "student",
          category: "other",
          title: "Room Change Request",
          description: reason || "Requesting room change",
          hostelId: allocation.hostelId,
          roomId: allocation.roomId,
          location: `Current Room: ${allocation.roomId}, Requested Room: ${newRoomId}`,
          priority: "medium",
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        request: request[0],
        message: "Room change request submitted. Awaiting admin approval.",
      });
    }

    // Action: record-payment (Record hostel fee payment)
    if (action === "record-payment") {
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can record payments" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const {
        studentId,
        allocationId,
        feeType,
        amount,
        paymentDate,
        paymentMethod,
        forMonth,
        forSemester,
        receiptNumber,
      } = body;

      const paymentId = `pay-${Date.now()}-${nanoid(8)}`;
      const [payment] = await db
        .insert(hostelPayments)
        .values({
          id: paymentId,
          schoolId: currentUser.schoolId || "",
          studentId,
          allocationId,
          feeType,
          amount,
          paymentDate: paymentDate || new Date().toISOString().split("T")[0],
          paymentMethod,
          forMonth,
          forSemester,
          receiptNumber,
          status: "paid",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      // Update allocation fee paid
      if (allocationId) {
        const allocation = await db.query.hostelAllocations.findFirst({
          where: eq(hostelAllocations.id, allocationId),
        });

        if (allocation) {
          await db
            .update(hostelAllocations)
            .set({
              feePaid: (allocation.feePaid || 0) + amount,
              feeOutstanding: Math.max(0, (allocation.feeOutstanding || 0) - amount),
              updatedAt: new Date(),
            })
            .where(eq(hostelAllocations.id, allocationId));
        }
      }

      return NextResponse.json({
        success: true,
        payment: payment[0],
        message: "Payment recorded successfully",
      });
    }

    // Action: approve-leave (Warden approves leave request)
    if (action === "approve-leave") {
      const { leaveRequestId, status, approvalNotes, gatePassNumber } = body;

      const leaveRequest = await db.query.hostelLeaveRequests.findFirst({
        where: eq(hostelLeaveRequests.id, leaveRequestId),
      });

      if (!leaveRequest) {
        return NextResponse.json(
          { error: "Leave request not found" } as ApiErrorResponse,
          { status: 404 }
        );
      }

      const [updated] = await db
        .update(hostelLeaveRequests)
        .set({
          status,
          approvedBy: currentUser.id,
          approvalDate: new Date().toISOString(),
          approvalNotes,
          rejectionReason: status === "rejected" ? approvalNotes : undefined,
          gatePassIssued: status === "approved" && !!gatePassNumber,
          gatePassNumber: status === "approved" ? gatePassNumber : undefined,
          updatedAt: new Date(),
        })
        .where(eq(hostelLeaveRequests.id, leaveRequestId))
        .returning();

      return NextResponse.json({
        success: true,
        leaveRequest: updated[0],
        message: `Leave request ${status} successfully`,
      });
    }

    // Action: create-building (Create new hostel building)
    if (action === "create-building") {
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can create buildings" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const buildingData = body;
      const buildingId = `hostel-${Date.now()}-${nanoid(8)}`;

      const [building] = await db
        .insert(hostelBuildings)
        .values({
          id: buildingId,
          schoolId: currentUser.schoolId || "",
          ...buildingData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        building: building[0],
        message: "Hostel building created successfully",
      });
    }

    // Action: create-room (Create new room in hostel)
    if (action === "create-room") {
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can create rooms" } as ApiErrorResponse,
          { status: 403 }
        );
      }

      const { hostelId, roomNumber, floor, roomType, capacity, ...roomData } = body;
      const roomId = `room-${Date.now()}-${nanoid(8)}`;

      // Initialize bed details
      const bedDetails = Array.from({ length: capacity || 1 }, (_, i) => ({
        bedNumber: `B${i + 1}`,
        occupied: false,
      }));

      const [room] = await db
        .insert(hostelRooms)
        .values({
          id: roomId,
          hostelId,
          schoolId: currentUser.schoolId || "",
          roomNumber,
          floor,
          roomType,
          capacity: capacity || 1,
          occupiedBeds: 0,
          bedDetails,
          status: "available",
          ...roomData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        room: room[0],
        message: "Room created successfully",
      });
    }

    // Action: submit-complaint (Submit hostel complaint)
    if (action === "submit-complaint") {
      const { category, title, description, hostelId, roomId, location, priority, photoUrls } = body;

      const complaintId = `comp-${Date.now()}-${nanoid(8)}`;
      const [complaint] = await db
        .insert(hostelComplaints)
        .values({
          id: complaintId,
          schoolId: currentUser.schoolId || "",
          complainantId: currentUser.id,
          complainantName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
          complainantType: currentUser.type === "student" ? "student" : "staff",
          category,
          title,
          description,
          hostelId,
          roomId,
          location,
          priority: priority || "medium",
          photoUrls,
          status: "open",
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json({
        success: true,
        complaint: complaint[0],
        message: "Complaint submitted successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" } as ApiErrorResponse,
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to process request" } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update hostel records
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
    const { action, id, ...updateData } = body;

    // Action: update-building
    if (action === "update-building") {
      const [updated] = await db
        .update(hostelBuildings)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(hostelBuildings.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        building: updated,
        message: "Building updated successfully",
      });
    }

    // Action: update-room
    if (action === "update-room") {
      const [updated] = await db
        .update(hostelRooms)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(hostelRooms.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        room: updated,
        message: "Room updated successfully",
      });
    }

    // Action: update-allocation
    if (action === "update-allocation") {
      const [updated] = await db
        .update(hostelAllocations)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(hostelAllocations.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        allocation: updated,
        message: "Allocation updated successfully",
      });
    }

    // Action: resolve-complaint
    if (action === "resolve-complaint") {
      const { resolutionDetails, complainantSatisfaction, complainantFeedback } = updateData;

      const [updated] = await db
        .update(hostelComplaints)
        .set({
          status: "resolved",
          resolutionDetails,
          resolvedDate: new Date().toISOString(),
          resolvedBy: userId,
          complainantSatisfaction,
          complainantFeedback,
          updatedAt: new Date(),
        })
        .where(eq(hostelComplaints.id, id))
        .returning();

      return NextResponse.json({
        success: true,
        complaint: updated,
        message: "Complaint resolved successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" } as ApiErrorResponse,
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to update record" } as ApiErrorResponse,
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete hostel records
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
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Action: delete-building
    if (action === "delete-building") {
      await db.delete(hostelBuildings).where(eq(hostelBuildings.id, id));
      return NextResponse.json({
        success: true,
        message: "Building deleted successfully",
      });
    }

    // Action: delete-room
    if (action === "delete-room") {
      await db.delete(hostelRooms).where(eq(hostelRooms.id, id));
      return NextResponse.json({
        success: true,
        message: "Room deleted successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" } as ApiErrorResponse,
      { status: 400 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/", method: "GET" });
    return NextResponse.json(
      { error: "Failed to delete record" } as ApiErrorResponse,
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
