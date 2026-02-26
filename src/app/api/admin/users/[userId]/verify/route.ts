/**
 * USER VERIFICATION API (Platform Admin)
 *
 * POST /api/admin/users/[userId]/verify - Verify user email
 */

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { invalidateUserRoleCache } from "@/lib/auth-utils";
import { createApiRoute } from "@/lib/api/route-handler";
import type { ApiSuccess } from "@/types";

type VerifyParams = { userId: string };

// POST /api/admin/users/[userId]/verify - Verify user email
export const POST = createApiRoute<never, { id: string; emailVerified: boolean }, VerifyParams>(
  async (_request, { userId: adminId }, context) => {
    const { userId } = await context!.params!;

    // Check if user exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (existingUser.length === 0) {
      return NextResponse.json(
        { error: 'User not found', status: 404 },
        { status: 404 }
      );
    }

    const user = existingUser[0];

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json(
        { error: 'User email is already verified', status: 400 },
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

    return NextResponse.json({
      data: { id: verifiedUser.id, emailVerified: verifiedUser.emailVerified },
      message: 'User verified successfully',
    } satisfies ApiSuccess<{ id: string; emailVerified: boolean }>, { status: 200 });

  },
  ['admin']
);
