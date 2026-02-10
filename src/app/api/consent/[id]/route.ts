import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { consentRecords, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// PATCH /api/consent/[id] - Update consent status (approve/revoke)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { status } = body;

    if (!["approved", "revoked", "denied"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const record = await db.query.consentRecords.findFirst({
      where: eq(consentRecords.id, id),
    });

    if (!record) {
      return NextResponse.json({ error: "Consent record not found" }, { status: 404 });
    }

    // Only the parent can approve/deny their consent
    if (record.parentId !== currentUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {
      status,
    };

    if (status === "approved") {
      updateData.consentedAt = new Date();
    } else if (status === "revoked") {
      updateData.revokedAt = new Date();
    }

    const [updatedRecord] = await db
      .update(consentRecords)
      .set(updateData)
      .where(eq(consentRecords.id, id))
      .returning();

    return NextResponse.json({ record: updatedRecord });
  } catch (error) {
    console.error("Consent update error:", error);
    return NextResponse.json({ error: "Failed to update consent" }, { status: 500 });
  }
}

// GET /api/consent/[id] - Get single consent record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await db.query.consentRecords.findFirst({
      where: eq(consentRecords.id, id),
    });

    if (!record) {
      return NextResponse.json({ error: "Consent record not found" }, { status: 404 });
    }

    return NextResponse.json({ record });
  } catch (error) {
    console.error("Consent fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch consent" }, { status: 500 });
  }
}
