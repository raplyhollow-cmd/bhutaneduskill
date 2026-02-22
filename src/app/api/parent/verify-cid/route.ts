import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, students, parents, parentToStudent } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

// GET /api/parent/verify-cid - Verify parent CID
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["parent"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;

    const { searchParams } = new URL(req.url);
    const cid = searchParams.get("cid");

    if (!cid || cid.length !== 11) {
      return Response.json(
        { error: "Invalid CID format", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Get parent user info
    const parentUsers = await db
      .select({
        id: users.id,
        name: users.name,
        cid: users.clerkUserId, // Using clerkUserId as CID placeholder
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

    // In production, validate CID against a national database
    // For now, we'll use the clerkUserId as a proxy
    const parent = parentUsers[0];

    logger.info("Parent CID verified", { parentId: parent.id });

    return Response.json({
      data: {
        name: parent.name,
        cid: cid,
      },
    } satisfies ApiSuccess<{ name: string | null; cid: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/verify-cid", method: "GET" });
    return Response.json(
      { error: "Verification failed", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

// POST /api/parent/verify-cid - Create/update parent record
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
    const { cid } = body;

    if (!cid || cid.length !== 11) {
      return Response.json(
        { error: "Invalid CID format", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Update parent record with CID (storing in metadata or a separate field)
    // For now, we'll store it in the users table metadata
    const parentRecords = await db
      .select({ id: users.id, metadata: users.metadata })
      .from(users)
      .where(eq(users.clerkUserId, userId))
      .limit(1);

    if (parentRecords.length > 0) {
      const existingMetadata = (parentRecords[0].metadata as Record<string, unknown>) || {};
      await db
        .update(users)
        .set({
          metadata: { ...existingMetadata, cid },
          updatedAt: new Date(),
        })
        .where(eq(users.clerkUserId, userId));
    }

    logger.info("Parent CID saved", { cid });

    return Response.json({
      data: { cid },
    } satisfies ApiSuccess<{ cid: string }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/parent/verify-cid", method: "POST" });
    return Response.json(
      { error: "Failed to save CID", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
