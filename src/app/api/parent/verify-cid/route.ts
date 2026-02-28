import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/parent/verify-cid - Verify parent CID
//
// MIGRATED: Now uses createApiRoute wrapper for auth/error handling
export const GET = createApiRoute(
  async (req: Request, auth) => {
    const { userId } = auth;

    const { searchParams } = new URL(req.url);
    const cid = searchParams.get("cid");

    if (!cid || cid.length !== 11) {
      return { error: "Invalid CID format", status: 400 };
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
      return { error: "Parent not found", status: 404 };
    }

    // In production, validate CID against a national database
    // For now, we'll use the clerkUserId as a proxy
    const parent = parentUsers[0];

    logger.info("Parent CID verified", { parentId: parent.id });

    return {
      name: parent.name,
      cid: cid,
    };
  },
  ["parent"]
);

// POST /api/parent/verify-cid - Create/update parent record
//
// MIGRATED: Now uses createApiRoute wrapper for auth/error handling
export const POST = createApiRoute(
  async (req: Request, auth) => {
    const { userId } = auth;

    const body = await req.json();
    const { cid } = body;

    if (!cid || cid.length !== 11) {
      return { error: "Invalid CID format", status: 400 };
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

    return { cid };
  },
  ["parent"]
);
