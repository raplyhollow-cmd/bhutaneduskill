import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { consentRecords, users } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";

// GET /api/consent - Get consent records
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId_param = searchParams.get("userId");
    const parentId = searchParams.get("parentId");
    const type = searchParams.get("type");

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

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
    console.error("Consent records fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch consent records" }, { status: 500 });
  }
}

// POST /api/consent - Create consent request
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { userId: targetUserId, parentId, type, consentText } = body;

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Only admin and counselors can create consent requests
    if (!["admin", "counselor"].includes(currentUser.type)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

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
    console.error("Consent creation error:", error);
    return NextResponse.json({ error: "Failed to create consent request" }, { status: 500 });
  }
}
