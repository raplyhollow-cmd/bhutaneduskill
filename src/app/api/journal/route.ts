import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireAuth } from "@/lib/db/tenant";

// GET /api/journal - Get user's journal entries
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth();

    const settings = (user?.settings as any) || {};
    const entries = settings.journalEntries || [];

    return NextResponse.json({ entries });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ entries: [] }, { status: 200 });
  }
}

// POST /api/journal - Create a new journal entry
export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth();

    const body = await req.json();
    const { title, content, mood, tags, date } = body;

    const settings = (user?.settings as any) || {};
    const entries = settings.journalEntries || [];

    const newEntry = {
      id: `journal-${Date.now()}`,
      date: date || new Date().toISOString(),
      title,
      content,
      mood,
      tags: tags || [],
    };

    entries.push(newEntry);

    await db
      .update(users)
      .set({
        settings: { ...settings, journalEntries: entries },
        updatedAt: new Date(),
      })
      .where((users) => users.id === user.id);

    return NextResponse.json({ success: true, entry: newEntry });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Error saving journal entry:", error);
    return NextResponse.json({ error: "Failed to save entry" }, { status: 500 });
  }
}
