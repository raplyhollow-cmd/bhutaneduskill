import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { consentRecords, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/consent - Get consent records
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(['parent', 'admin', 'school-admin']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

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
    if (currentUser.type === "parent") {
      conditions.push(eq(consentRecords.parentId, currentUser.id));
    }

    let records: any[];
    if (conditions.length > 0) {
      records = await db.query.consentRecords.findMany({
        where: conditions.length === 1 ? conditions[0] : and(...conditions),
        orderBy: desc(consentRecords.createdAt),
      });
    } else if (currentUser.type === "admin" || currentUser.type === "counselor") {
      records = await db.query.consentRecords.findMany({
        orderBy: desc(consentRecords.createdAt),
      });
    } else {
      records = [];
    }

    return NextResponse.json({ records });
  } catch (error) {
    logger.apiError(error, { route: "/api/consent", method: "GET" });
    return NextResponse.json({ error: "Failed to fetch consent records" }, { status: 500 });
  }
}

// POST /api/consent - Create consent request
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(['admin', 'counselor']);
    if ('error' in authResult) {
      return authResult;
    }
    const { userId, user } = authResult;

    const body = await request.json();
    const { userId: targetUserId, parentId, type, consentText } = body;

    const [record] = await db
      .insert(consentRecords)
      .values({
        ...({
          id: `consent_${Date.now()}`,
          consentText: consentText,
        }),
        userId: targetUserId,
        parentId,
        type,
        status: "pending",
        ipAddress: request.headers.get("x-forwarded-for") || "unknown",
        createdAt: new Date(),
      } as any)
      .returning();

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/api/consent", method: "POST" });
    return NextResponse.json({ error: "Failed to create consent request" }, { status: 500 });
  }
}
