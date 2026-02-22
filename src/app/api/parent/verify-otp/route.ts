import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// OTP storage (shared with send-otp)
const otpStore = new Map<string, { code: string; expiresAt: Date; phone?: string; email?: string }>();

// POST /api/parent/verify-otp - Verify OTP and create parent-child link
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
    const { studentId, code, relationship = "guardian" } = body;

    if (!studentId || !code) {
      return Response.json(
        { error: "Student ID and OTP are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    const otpId = `${userId}-${studentId}`;
    const otpData = otpStore.get(otpId);

    // Verify OTP
    if (!otpData || otpData.code !== code) {
      return Response.json(
        { error: "Invalid or expired OTP", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    if (new Date() > otpData.expiresAt) {
      otpStore.delete(otpId);
      return Response.json(
        { error: "OTP has expired", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get parent database ID
    const parentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (parentUsers.length === 0) {
      return Response.json(
        { error: "Parent not found", status: 404 } satisfies ApiErrorResponse,
        { status: 404 }
      );
    }

    const parentId = parentUsers[0].id;

    // Check if link already exists
    const existingLinks = await db
      .select()
      .from(parentToStudent)
      .where(
        and(
          eq(parentToStudent.parentId, parentId),
          eq(parentToStudent.studentId, studentId)
        )
      )
      .limit(1);

    if (existingLinks.length > 0) {
      // Link already exists - no update needed since parentToStudent has composite PK
      logger.info("Parent-child link already exists", { parentId, studentId });
    } else {
      // Create new link (note: parentToStudent has composite PK on parentId + studentId)
      await db.insert(parentToStudent).values({
        parentId,
        studentId,
        isPrimaryContact: true,
        relationshipType: relationship,
        createdAt: new Date(),
      });
    }

    // Clear used OTP
    otpStore.delete(otpId);

    logger.info("Parent-child link created", { parentId, studentId, relationship });

    return Response.json({
      data: {
        message: "Child successfully linked to your account",
        parentId,
        studentId,
        relationship,
      },
    } satisfies ApiSuccess<{ message: string; parentId: string; studentId: string; relationship: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/verify-otp", method: "POST" });
    return Response.json(
      { error: "Failed to verify OTP", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
