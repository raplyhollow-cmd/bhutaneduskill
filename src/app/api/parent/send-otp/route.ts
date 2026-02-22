import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, students } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// OTP storage (in production, use Redis or database)
const otpStore = new Map<string, { code: string; expiresAt: Date; phone?: string; email?: string }>();

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/parent/send-otp - Send OTP for child linking verification
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const body = await req.json();
    const { studentId, method = "sms" } = body;

    if (!studentId) {
      return Response.json(
        { error: "Student ID is required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get parent user info
    const parentUsers = await db
      .select({
        id: users.id,
        phone: users.phone,
        email: users.email,
      })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (parentUsers.length === 0) {
      return Response.json(
        { error: "Parent not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const parent = parentUsers[0];

    // Get student info to verify relationship
    const studentRecords = await db
      .select({
        id: students.id,
        userId: students.userId,
      })
      .from(students)
      .where(eq(students.id, studentId))
      .limit(1);

    if (studentRecords.length === 0) {
      return Response.json(
        { error: "Student not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    // Generate OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const otpId = `${userId}-${studentId}`;

    // Store OTP
    otpStore.set(otpId, {
      code: otpCode,
      expiresAt,
      phone: parent.phone,
      email: parent.email,
    });

    // Send OTP via selected method
    // In production, integrate with Twilio (SMS) or SendGrid (Email)
    if (method === "sms") {
      // TODO: Integrate with Twilio
      logger.info("SMS OTP would be sent here", {
        phone: parent.phone,
        otp: otpCode, // Remove in production
      });
    } else {
      // TODO: Integrate with SendGrid
      logger.info("Email OTP would be sent here", {
        email: parent.email,
        otp: otpCode, // Remove in production
      });
    }

    logger.info("OTP sent for parent-child linking", {
      parentId: parent.id,
      studentId,
      method,
    });

    return Response.json({
      data: {
        message: `OTP sent via ${method === "sms" ? "SMS" : "email"}`,
        expiresAt: expiresAt.toISOString(),
      },
    } satisfies ApiSuccess<{ message: string; expiresAt: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/send-otp", method: "POST" });
    return Response.json(
      { error: "Failed to send OTP", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
