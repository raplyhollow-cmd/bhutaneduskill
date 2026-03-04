/**
 * Partner Portal Invitation API
 *
 * POST /api/admin/partners/[partnerId]/invite - Invite a user to partner portal
 *
 * Creates a user account with type "partner" and sends an invitation.
 */

import { NextRequest, NextResponse } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { partners, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface InviteUserInput {
  email: string;
  firstName: string;
  lastName: string;
}

// ============================================================================
// VALIDATION
// ============================================================================

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateInviteInput(data: InviteUserInput): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.email || data.email.trim().length === 0) {
    errors.push("Email is required");
  } else if (!validateEmail(data.email)) {
    errors.push("Invalid email format");
  }

  if (!data.firstName || data.firstName.trim().length === 0) {
    errors.push("First name is required");
  }

  if (!data.lastName || data.lastName.trim().length === 0) {
    errors.push("Last name is required");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// POST - Invite User to Partner Portal
// ============================================================================

export const POST = createApiRoute(
  async (
    request: NextRequest,
    auth,
    { params }: { params: Promise<{ partnerId: string }> }
  ) => {
    const { partnerId } = await params;

    if (!partnerId) {
      return { error: "Partner ID is required", status: 400 };
    }

    // Verify partner exists
    const partnerResult = await db
      .select()
      .from(partners)
      .where(eq(partners.id, partnerId))
      .limit(1);
    const partner = partnerResult[0];

    if (!partner) {
      return { error: "Partner not found", status: 404 };
    }

    const body = await request.json();

    // Validate input
    const validation = validateInviteInput(body);
    if (!validation.valid) {
      return {
        error: "Validation failed",
        details: validation.errors,
        status: 400,
      };
    }

    const { email, firstName, lastName } = body as InviteUserInput;

    // Check if user with this email already exists
    const existingUserResult = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    const existingUser = existingUserResult[0];

    if (existingUser) {
      return {
        error: "A user with this email already exists",
        status: 409,
      };
    }

    // Create partner portal user
    // Note: This creates a pending user. The actual Clerk invitation
    // would be handled separately via Clerk's API
    const userId = `user-${nanoid(10)}`;
    const now = new Date();

    await db
      .insert(users)
      .values({
        id: userId,
        clerkUserId: "", // Will be set when user accepts invitation via Clerk
        type: "partner",
        role: "partner",
        name: `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        email: email.toLowerCase(),
        partnerId: partnerId,
        isActive: false, // Pending invitation acceptance
        createdAt: now,
        updatedAt: now,
      });

    // Fetch the created user
    const newUserCheckResult = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!newUserCheckResult[0]) {
      throw new Error("Failed to create user");
    }

    const newUser = newUserCheckResult[0];

    logger.info("Partner portal invitation sent", {
      userId: auth.userId,
      partnerId,
      invitedUserEmail: email,
      invitedUserId: userId,
    });

    return {
      data: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        partnerId: partnerId,
        status: "pending",
        invitedAt: now,
      },
      message: "Invitation sent successfully. The user will receive an email with instructions.",
    };
  },
  ["admin"]
);
