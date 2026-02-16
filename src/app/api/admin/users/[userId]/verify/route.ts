/**
 * USER VERIFICATION API (Platform Admin)
 *
 * POST /api/admin/users/[userId]/verify - Verify user email
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, invalidateUserRoleCache } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// ============================================================================
// POST /api/admin/users/[userId]/verify - Verify user email
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const authResult = await requireAuth(['admin']);
  if ('error' in authResult) {
    return NextResponse.json(
      { error: authResult.error, status: authResult.status } as ApiErrorResponse,
      { status: authResult.status }
    );
  }

  const { userId: adminId } = authResult;
  const { userId } = await params;

  try {
    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 404 } as ApiErrorResponse,
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'User email is already verified', status: 400 } as ApiErrorResponse,
        { status: 400 }
      );
    }

    // Update emailVerified to true
    const [verifiedUser] = await db
      .update(users)
      .set({
        emailVerified: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Invalidate role cache
    invalidateUserRoleCache(verifiedUser.clerkUserId);

    logger.info('User verified', { userId, verifiedBy: adminId });

    return NextResponse.json({
      data: { id: verifiedUser.id, emailVerified: verifiedUser.emailVerified },
      message: 'User verified successfully',
    } satisfies ApiSuccess<{ id: string; emailVerified: boolean }>, { status: 200 });

  } catch (error) {
    logger.apiError(error, { route: `/api/admin/users/${userId}/verify`, method: 'POST', adminId });
    return NextResponse.json(
      { error: 'Failed to verify user', status: 500, details: error instanceof Error ? error.message : undefined } as ApiErrorResponse,
      { status: 500 }
    );
  }
}
