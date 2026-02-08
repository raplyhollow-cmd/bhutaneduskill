import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// GET /api/journal/[id] - Get a single journal entry
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const userProfile = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = (userProfile.settings as any) || {};
    const entries = settings.journalEntries || [];

    const entry = entries.find((e: any) => e.id === id);

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

// PUT /api/journal/[id] - Update a journal entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const userProfile = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = (userProfile.settings as any) || {};
    const entries = settings.journalEntries || [];

    const entryIndex = entries.findIndex((e: any) => e.id === id);

    if (entryIndex === -1) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    entries[entryIndex] = {
      ...entries[entryIndex],
      title,
      content,
      mood,
      tags,
      updatedAt: new Date().toISOString(),
    };

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userProfile.id));

    return NextResponse.json({ entry: entries[entryIndex] });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return NextResponse.json({ error: "Failed to update entry" }, { status: 500 });
  }
}

// DELETE /api/journal/[id] - Delete a journal entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const userProfile = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
    });

    if (!userProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const settings = (userProfile.settings as any) || {};
    const entries = settings.journalEntries || [];

    const filteredEntries = entries.filter((e: any) => e.id !== id);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: filteredEntries },
        updatedAt: new Date(),
      })
      .where(eq(users.id, userProfile.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return NextResponse.json({ error: "Failed to delete entry" }, { status: 500 });
  }
}
