import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import type { ApiSuccess, ApiErrorResponse } from "@/types";
import { createApiRoute } from "@/lib/api/route-handler";

// OTP storage (shared with send-otp)
const otpStore = new Map<string, { code: string; expiresAt: Date; phone?: string; email?: string }>();

// POST /api/parent/verify-otp - Verify OTP and create parent-child link
//
// MIGRATED: Now uses createApiRoute wrapper for auth/error handling
export const POST = createApiRoute(
  async (req: Request, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { studentId, code, relationship = "guardian" } = body;

    if (!studentId || !code) {
      return {
        error: "Student ID and OTP are required",
        status: 400,
      } satisfies ApiErrorResponse;
    }

    const otpId = `${userId}-${studentId}`;
    const otpData = otpStore.get(otpId);

    // Verify OTP
    if (!otpData || otpData.code !== code) {
      return {
        error: "Invalid or expired OTP",
        status: 400,
      } satisfies ApiErrorResponse;
    }

    if (new Date() > otpData.expiresAt) {
      otpStore.delete(otpId);
      return {
        error: "OTP has expired",
        status: 400,
      } satisfies ApiErrorResponse;
    }

    // Get parent database ID
    const parentUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (parentUsers.length === 0) {
      return {
        error: "Parent not found",
        status: 404,
      } satisfies ApiErrorResponse;
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

    return {
      data: {
        message: "Child successfully linked to your account",
        parentId,
        studentId,
        relationship,
      },
    } satisfies ApiSuccess<{ message: string; parentId: string; studentId: string; relationship: string }>;
  },
  ["parent"]
);
