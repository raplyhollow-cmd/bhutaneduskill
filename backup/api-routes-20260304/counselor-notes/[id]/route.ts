/**
 * COUNSELOR NOTES [id] API
 *
 * GET /api/counselor-notes/[id] - Get single note
 * PUT /api/counselor-notes/[id] - Update note
 * DELETE /api/counselor-notes/[id] - Delete note
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { counselorNotes } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

// GET /api/counselor-notes/[id] - Get single note
export const GET = createApiRoute(
  async (req: NextRequest, _auth, context) => {
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing note ID", status: 400 };
    }

    const [note] = await db
      .select()
      .from(counselorNotes)
      .where(eq(counselorNotes.id, id))
      .limit(1);

    if (!note) {
      return { error: "Note not found", status: 404 };
    }

    return { note };
  },
  ['counselor', 'teacher', 'admin', 'school-admin']
);

// PUT /api/counselor-notes/[id] - Update note
export const PUT = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing note ID", status: 400 };
    }

    const body = await req.json();

    const [note] = await db
      .select()
      .from(counselorNotes)
      .where(eq(counselorNotes.id, id))
      .limit(1);

    if (!note) {
      return { error: "Note not found", status: 404 };
    }

    // Only the author can update
    if (note.counselorId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    const [updatedNote] = await db
      .update(counselorNotes)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(counselorNotes.id, id))
      .returning();

    return { note: updatedNote };
  },
  ['counselor', 'teacher', 'admin', 'school-admin']
);

// DELETE /api/counselor-notes/[id] - Delete note
export const DELETE = createApiRoute(
  async (req: NextRequest, auth, context) => {
    const { user } = auth;
    const params = await context?.params as { id?: string } | undefined;
    const id = params?.id;

    if (!id) {
      return { error: "Missing note ID", status: 400 };
    }

    const [note] = await db
      .select()
      .from(counselorNotes)
      .where(eq(counselorNotes.id, id))
      .limit(1);

    if (!note) {
      return { error: "Note not found", status: 404 };
    }

    // Only the author can delete
    if (note.counselorId !== user.id) {
      return { error: "Forbidden", status: 403 };
    }

    await db.delete(counselorNotes).where(eq(counselorNotes.id, id));

    return { success: true };
  },
  ['counselor', 'teacher', 'admin', 'school-admin']
);
