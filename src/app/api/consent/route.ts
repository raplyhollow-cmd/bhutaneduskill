import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { consentRecords, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/consent - Get consent records
export const GET = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const { searchParams } = new URL(request.url);
    const userId_param = searchParams.get("userId");
    const parentId = searchParams.get("parentId");
    const type = searchParams.get("type");

    // Build conditions
    const conditions = [];

    if (userId_param) {
      conditions.push(eq(consentRecords.userId, userId_param));
    }

    if (parentId) {
      conditions.push(eq(consentRecords.parentId, parentId));
    }

    if (type) {
      conditions.push(eq(consentRecords.type, type));
    }

    // Parents can only see their own consent records
    if (user.type === "parent") {
      conditions.push(eq(consentRecords.parentId, user.id as string));
    }

    let records: typeof consentRecords.$inferSelect[];
    if (conditions.length > 0) {
      records = await db
        .select()
        .from(consentRecords)
        .where(conditions.length === 1 ? conditions[0] : and(...conditions))
        .orderBy(desc(consentRecords.createdAt));
    } else if (user.type === "admin" || user.type === "counselor") {
      records = await db
        .select()
        .from(consentRecords)
        .orderBy(desc(consentRecords.createdAt));
    } else {
      records = [];
    }

    return { records };
  },
  ['parent', 'admin', 'school-admin']
);

// POST /api/consent - Create consent request
export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    const body = await request.json();
    const { userId: targetUserId, parentId, type, consentText } = body;

    const [record] = await db
      .insert(consentRecords)
      .values({
        id: `consent_${Date.now()}`,
        userId: targetUserId,
        parentId,
        type,
        status: "pending",
        title: `${type} Consent Request`,
        description: consentText || "",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return { record, status: 201 };
  },
  ['admin', 'counselor']
);
