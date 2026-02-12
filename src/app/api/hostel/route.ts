/**
 * HOSTEL MANAGEMENT API ROUTE
 *
 * Handles hostel rooms, allocations, and attendance for students
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import {
  users,
  hostelAllocations,
  hostelRooms,
  hostelBuildings,
  hostelAttendance,
  hostelFacilities,
  hostelMess,
  hostelLeaveRequests,
} from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";
import { nanoid } from "nanoid";

// GET - Fetch hostel data
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action"); // my-allocation, facilities, rooms, buildings, attendance

    if (action === "my-allocation") {
      // Get student's hostel allocation
      if (currentUser.type !== "student") {
        return NextResponse.json({ error: "Only students can view their allocation" }, { status: 403 });
      }

      const allocation = await db.query.hostelAllocations.findFirst({
        where: and(
          eq(hostelAllocations.studentId, currentUser.id),
          sql`${hostelAllocations.status} = ${"active"}`
        ),
        with: {
          room: true,
          hostel: true,
        },
      });

      if (!allocation) {
        return NextResponse.json({
          allocation: null,
          message: "No hostel allocation found. Contact school admin for hostel allocation.",
        });
      }

      return NextResponse.json({
        allocation: {
          ...allocation,
          studentName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        },
        hasAllocation: true,
      });
    }

    if (action === "facilities") {
      // Get hostel facilities for the school
      const facilities = await db.query.hostelFacilities.findMany({
        where: eq(hostelFacilities.schoolId, currentUser.schoolId || ""),
      });

      return NextResponse.json({ facilities });
    }

    if (action === "rooms") {
      // Get hostel rooms with availability
      const hostelId = searchParams.get("hostelId");
      const status = searchParams.get("status") || "available";

      let whereConditions = [
        eq(hostelRooms.schoolId, currentUser.schoolId || ""),
      ];

      if (hostelId) {
        whereConditions.push(eq(hostelRooms.hostelId, hostelId));
      }

      if (status) {
        whereConditions.push(sql`${hostelRooms.status} = ${status}`);
      }

      const rooms = await db.query.hostelRooms.findMany({
        where: and(...whereConditions),
        with: {
          hostel: true,
        },
        orderBy: [hostelRooms.roomNumber],
      });

      return NextResponse.json({ rooms });
    }

    if (action === "buildings") {
      // Get all hostel buildings
      const buildings = await db.query.hostelBuildings.findMany({
        where: eq(hostelBuildings.schoolId, currentUser.schoolId || ""),
        orderBy: [hostelBuildings.name],
      });

      return NextResponse.json({ buildings });
    }

    if (action === "attendance") {
      // Get hostel attendance (for wardens or student's own)
      const studentId = searchParams.get("studentId") || currentUser.id;
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");

      let whereConditions = [eq(hostelAttendance.studentId, studentId)];

      if (startDate) {
        whereConditions.push(sql`${hostelAttendance.date} >= ${startDate}`);
      }
      if (endDate) {
        whereConditions.push(sql`${hostelAttendance.date} <= ${endDate}`);
      }

      const attendance = await db.query.hostelAttendance.findMany({
        where: and(...whereConditions),
        orderBy: [desc(hostelAttendance.date)],
        limit: 31, // Last 31 days
      });

      // Calculate stats
      const stats = {
        total: attendance.length,
        present: attendance.filter((a) => a.status === "present").length,
        absent: attendance.filter((a) => a.status === "absent").length,
        late: attendance.filter((a) => a.status === "late").length,
        excused: attendance.filter((a) => a.status === "excused").length,
        onLeave: attendance.filter((a) => a.status === "on_leave").length,
      };

      return NextResponse.json({ attendance, stats });
    }

    if (action === "leave-requests") {
      // Get leave requests (student's own or all for warden)
      const studentId = searchParams.get("studentId");
      const status = searchParams.get("status");

      let whereConditions = [];

      if (currentUser.type === "student" || !studentId) {
        // Students see only their own requests
        whereConditions.push(eq(hostelLeaveRequests.studentId, currentUser.id));
      } else {
        // Wardens can see specific student's requests
        whereConditions.push(eq(hostelLeaveRequests.studentId, studentId || ""));
      }

      if (status) {
        whereConditions.push(sql`${hostelLeaveRequests.status} = ${status}`);
      }

      const leaveRequests = await db.query.hostelLeaveRequests.findMany({
        where: and(...whereConditions, eq(hostelLeaveRequests.schoolId, currentUser.schoolId || "")),
        orderBy: [desc(hostelLeaveRequests.createdAt)],
        limit: 20,
      });

      return NextResponse.json({ leaveRequests });
    }

    // Default: return user info
    return NextResponse.json({
      user: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
      },
    });
  } catch (error) {
    console.error("Error fetching hostel data:", error);
    return NextResponse.json(
      { error: "Failed to fetch hostel data" },
      { status: 500 }
    );
  }
}

// POST - Create hostel allocation or request
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true, firstName: true, lastName: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "request-allocation") {
      // Student requests hostel allocation
      if (currentUser.type !== "student") {
        return NextResponse.json(
          { error: "Only students can request hostel allocation" },
          { status: 403 }
        );
      }

      const { hostelId, preferredRoomType, specialRequirements, medicalConditions, emergencyContact } = body;

      // Check if student already has an active allocation
      const existingAllocation = await db.query.hostelAllocations.findFirst({
        where: and(
          eq(hostelAllocations.studentId, currentUser.id),
          sql`${hostelAllocations.status} = ${"active"}`
        ),
      });

      if (existingAllocation) {
        return NextResponse.json({
          error: "You already have an active hostel allocation",
          existingAllocation,
        }, { status: 400 });
      }

      // Create allocation (admin will assign specific room later)
      const [allocation] = await db.insert(hostelAllocations).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        studentId: currentUser.id,
        studentName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        hostelId: hostelId || null,
        roomId: null, // Will be assigned by admin
        bedNumber: null,
        allocationDate: new Date().toISOString().split('T')[0],
        academicYear: new Date().getFullYear().toString(),
        semester: ["spring", "fall", "winter", "summer"][new Date().getMonth() >= 6 ? new Date().getMonth() >= 9 ? 0 : 1 : 2],
        status: "active",
        feeAmount: 0,
        feePaid: 0,
        feeOutstanding: 0,
        emergencyContactName: emergencyContact?.name || "",
        emergencyContactPhone: emergencyContact?.phone || "",
        emergencyContactRelation: emergencyContact?.relation || "",
        bloodGroup: medicalConditions?.bloodGroup || "",
        medicalConditions: medicalConditions?.conditions || "",
        allergies: medicalConditions?.allergies || "",
        notes: specialRequirements || "",
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      }).returning();

      return NextResponse.json({
        success: true,
        allocation: allocation[0],
        message: "Hostel allocation request submitted. School admin will assign your room.",
      });
    }

    if (action === "request-leave") {
      // Student requests leave from hostel
      if (currentUser.type !== "student") {
        return NextResponse.json(
          { error: "Only students can request leave" },
          { status: 403 }
        );
      }

      const { leaveType, leaveReason, fromDate, toDate, destination, companionName, companionPhone } = body;

      const [leaveRequest] = await db.insert(hostelLeaveRequests).values({
        id: nanoid(),
        schoolId: currentUser.schoolId || "",
        studentId: currentUser.id,
        studentName: `${currentUser.firstName} ${currentUser.lastName || ""}`.trim(),
        leaveType,
        leaveReason,
        fromDate,
        fromTime: "17:00", // Default leave time
        toDate,
        toTime: "18:00", // Default return time
        numberOfDays: Math.ceil((new Date(toDate).getTime() - new Date(fromDate).getTime()) / (1000 * 60 * 60 * 24)),
        destination,
        purpose: leaveReason,
        companionName,
        companionRelation: companionName ? "guardian" : null,
        companionPhone,
        status: "pending",
        createdAt: Math.floor(Date.now() / 1000),
        updatedAt: Math.floor(Date.now() / 1000),
      }).returning();

      return NextResponse.json({
        success: true,
        leaveRequest: leaveRequest[0],
        message: "Leave request submitted. Awaiting warden approval.",
      });
    }

    if (action === "mark-attendance") {
      // Warden marks hostel attendance
      if (currentUser.role !== "school_admin" && currentUser.role !== "warden") {
        return NextResponse.json(
          { error: "Only wardens can mark attendance" },
          { status: 403 }
        );
      }

      const { studentId, date, status, checkInTime, checkOutTime, leaveType, leaveReason } = body;

      // Check if attendance already exists
      const existing = await db.query.hostelAttendance.findFirst({
        where: and(
          eq(hostelAttendance.studentId, studentId),
          eq(hostelAttendance.date, date)
        ),
      });

      if (existing) {
        // Update existing
        await db.update(hostelAttendance)
          .set({
            status,
            checkInTime,
            checkOutTime,
            leaveType,
            leaveReason,
            markedBy: currentUser.id,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(hostelAttendance.id, existing.id));
      } else {
        // Create new
        await db.insert(hostelAttendance).values({
          id: nanoid(),
          schoolId: currentUser.schoolId || "",
          studentId,
          date,
          status,
          checkInTime,
          checkOutTime,
          leaveType,
          leaveReason,
          markedBy: currentUser.id,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        });
      }

      return NextResponse.json({
        success: true,
        message: "Attendance marked successfully",
      });
    }

    if (action === "allocate-room") {
      // Admin allocates room to student
      if (currentUser.role !== "school_admin" && currentUser.role !== "admin") {
        return NextResponse.json(
          { error: "Only admins can allocate rooms" },
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
        return NextResponse.json({ error: "Student not found" }, { status: 404 });
      }

      // Check room capacity
      const room = await db.query.hostelRooms.findFirst({
        where: eq(hostelRooms.id, roomId),
      });

      if (!room) {
        return NextResponse.json({ error: "Room not found" }, { status: 404 });
      }

      if (room.occupiedBeds >= room.capacity) {
        return NextResponse.json({ error: "Room is at full capacity" }, { status: 400 });
      }

      // Create or update allocation
      const existingAllocation = await db.query.hostelAllocations.findFirst({
        where: eq(hostelAllocations.studentId, studentId),
      });

      if (existingAllocation) {
        // Update existing allocation
        await db.update(hostelAllocations)
          .set({
            hostelId,
            roomId,
            bedNumber,
            feeType,
            feeAmount,
            updatedAt: Math.floor(Date.now() / 1000),
          })
          .where(eq(hostelAllocations.id, existingAllocation.id));
      } else {
        // Create new allocation
        await db.insert(hostelAllocations).values({
          id: nanoid(),
          schoolId: currentUser.schoolId || "",
          studentId,
          studentName: `${student.firstName} ${student.lastName || ""}`.trim(),
          hostelId,
          roomId,
          bedNumber,
          allocationDate: new Date().toISOString().split('T')[0],
          academicYear: new Date().getFullYear().toString(),
          semester: "current",
          status: "active",
          feeType,
          feeAmount,
          feePaid: 0,
          createdAt: Math.floor(Date.now() / 1000),
          updatedAt: Math.floor(Date.now() / 1000),
        });
      }

      // Update room occupancy
      await db.update(hostelRooms)
        .set({
          occupiedBeds: (room.occupiedBeds || 0) + 1,
          updatedAt: Math.floor(Date.now() / 1000),
        })
        .where(eq(hostelRooms.id, roomId));

      return NextResponse.json({
        success: true,
        message: "Room allocated successfully",
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error processing hostel request:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
