/**
 * LEAVE MANAGEMENT API ROUTE
 *
 * Handles leave request CRUD operations for students and teachers
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { leaveRequests, users } from "@/lib/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { nanoid } from "nanoid";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current user
    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, schoolId: true, role: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // pending, approved, rejected, cancelled
    const type = searchParams.get("type");   // student, teacher, staff

    // Build query conditions
    const conditions = [];

    // Filter by user (students see their own, teachers see their own)
    if (currentUser.role === "school_admin" || currentUser.role === "admin") {
      // Admins see all leave requests for their school
      if (currentUser.schoolId) {
        conditions.push(eq(leaveRequests.schoolId, currentUser.schoolId));
      }
    } else {
      // Students and teachers see only their own requests
      conditions.push(eq(leaveRequests.applicantId, currentUser.id));
    }

    // Filter by status if provided
    if (status) {
      conditions.push(eq(leaveRequests.status, status));
    }

    // Filter by type if provided
    if (type) {
      conditions.push(eq(leaveRequests.applicantType, type));
    }

    // Fetch leave requests
    const leaveData = await db.query.leaveRequests.findMany({
      where: and(...conditions),
      with: {
        applicant: {
          columns: { id: true, firstName: true, lastName: true, email: true },
        },
        approver: {
          columns: { id: true, firstName: true, lastName: true },
        },
        substituteTeacher: {
          columns: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: [desc(leaveRequests.createdAt)],
    });

    return NextResponse.json({
      leaveRequests: leaveData,
      currentUser: {
        id: currentUser.id,
        type: currentUser.type,
        role: currentUser.role,
        canApprove: currentUser.role === "school_admin" || currentUser.role === "admin",
      },
    });
  } catch (error) {
    console.error("Error fetching leave requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch leave requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only students and teachers can create leave requests
    if ((currentUser as any).type !== "student" && (currentUser as any).type !== "teacher") {
      return NextResponse.json(
        { error: "Only students and teachers can create leave requests" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      leaveType,
      reason,
      fromDate,
      toDate,
      attachments,
      substituteTeacherId,
    } = body;

    // Validate required fields
    if (!leaveType || !reason || !fromDate || !toDate) {
      return NextResponse.json(
        { error: "Missing required fields: leaveType, reason, fromDate, toDate" },
        { status: 400 }
      );
    }

    // Calculate number of days
    const start = new Date(fromDate);
    const end = new Date(toDate);
    const numberOfDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Create leave request
    const [leaveRequest] = await db.insert(leaveRequests).values({
      id: nanoid(),
      schoolId: currentUser.schoolId || "",
      applicantId: currentUser.id,
      applicantType: currentUser.type,
      leaveType,
      reason,
      fromDate,
      toDate,
      numberOfDays,
      attachments: attachments || [],
      status: "pending",
      substituteTeacherId: currentUser.type === "teacher" ? substituteTeacherId : null,
      createdAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000),
    } as any).returning();

    return NextResponse.json({
      success: true,
      leaveRequest: leaveRequest[0],
    });
  } catch (error) {
    console.error("Error creating leave request:", error);
    return NextResponse.json(
      { error: "Failed to create leave request" },
      { status: 500 }
    );
  }
}
