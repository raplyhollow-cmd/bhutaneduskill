import { NextRequest } from "next/server";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, studentInterventions, interventionNotes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface UpdateInterventionBody {
  status?: "planned" | "active" | "monitoring" | "completed" | "cancelled";
  progress?: number;
  outcome?: string;
  outcomeRating?: "successful" | "partially_successful" | "unsuccessful";
  goals?: Array<{
    id: string;
    text: string;
    status: "pending" | "in_progress" | "completed";
    targetDate?: string;
  }>;
}

interface AddNoteBody {
  content: string;
  progressUpdate?: number;
  statusChange?: string;
  milestoneReached?: boolean;
  milestoneDescription?: string;
  isConfidential?: boolean;
}

// ============================================================================
// GET - Get single intervention by ID
// ============================================================================

export const GET = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId, user } = auth;
    const { id } = await (context?.params || {});

    // Get intervention with student and school info
    const interventionData = await db
      .select({
        intervention: studentInterventions,
        student: {
          id: users.id,
          name: users.name,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          classGrade: users.classGrade,
        },
      })
      .from(studentInterventions)
      .leftJoin(users, eq(studentInterventions.studentId, users.id))
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (interventionData.length === 0) {
      return { error: "Intervention not found", status: 404 };
    }

    const { intervention, student } = interventionData[0];

    // Check permission - counselors can only see their own interventions
    if (user.type === "counselor" && intervention.counselorId !== userId) {
      return { error: "You don't have permission to view this intervention", status: 403 };
    }

    // Get progress notes for this intervention
    const notesData = await db
      .select()
      .from(interventionNotes)
      .where(eq(interventionNotes.interventionId, id))
      .orderBy(interventionNotes.createdAt);

    const studentName = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim();

    logger.info("Retrieved intervention details", { interventionId: id, userId });

    return {
      data: {
        success: true,
        intervention: {
          ...intervention,
          studentName,
          grade: student.classGrade,
          progressNotes: notesData,
        },
      },
    };
  },
  ["counselor", "admin"]
);

// ============================================================================
// PATCH - Update intervention (progress, status, goals, outcome)
// ============================================================================

export const PATCH = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId, user } = auth;
    const { id } = await (context?.params || {});
    const body: UpdateInterventionBody = await req.json();

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return { error: "Intervention not found", status: 404 };
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return { error: "You don't have permission to update this intervention", status: 403 };
    }

    // Prepare update values
    const updateValues: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (body.status !== undefined) {
      updateValues.status = body.status;
      // If completing, set completedAt
      if (body.status === "completed" && !existingIntervention[0].completedAt) {
        updateValues.completedAt = new Date();
      }
    }

    if (body.progress !== undefined) {
      updateValues.progress = body.progress;
    }

    if (body.outcome !== undefined) {
      updateValues.outcome = body.outcome;
    }

    if (body.outcomeRating !== undefined) {
      updateValues.outcomeRating = body.outcomeRating;
    }

    if (body.goals !== undefined) {
      updateValues.goals = body.goals;
    }

    // Update intervention
    const [updatedIntervention] = await db
      .update(studentInterventions)
      .set(updateValues)
      .where(eq(studentInterventions.id, id))
      .returning();

    logger.info("Updated intervention", { interventionId: id, userId, updates: Object.keys(body) });

    return {
      data: { success: true, intervention: updatedIntervention },
    };
  },
  ["counselor", "admin"]
);

// ============================================================================
// DELETE - Delete intervention
// ============================================================================

export const DELETE = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId, user } = auth;
    const { id } = await (context?.params || {});

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return { error: "Intervention not found", status: 404 };
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return { error: "You don't have permission to delete this intervention", status: 403 };
    }

    // Delete intervention (cascade will delete associated notes)
    await db.delete(studentInterventions).where(eq(studentInterventions.id, id));

    logger.info("Deleted intervention", { interventionId: id, userId });

    return {
      data: { success: true, message: "Intervention deleted successfully" },
    };
  },
  ["counselor", "admin"]
);

// ============================================================================
// POST - Add progress note to intervention
// ============================================================================

export const POST = createApiRoute<{ id: string }>(
  async (req, auth, context) => {
    const { userId, user } = auth;
    const { id } = await (context?.params || {});
    const body: AddNoteBody = await req.json();

    if (!body.content || body.content.trim() === "") {
      return { error: "Note content is required", status: 400 };
    }

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return { error: "Intervention not found", status: 404 };
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return { error: "You don't have permission to add notes to this intervention", status: 403 };
    }

    // Create progress note
    const noteId = `note_${nanoid(12)}`;
    const [newNote] = await db
      .insert(interventionNotes)
      .values({
        id: noteId,
        interventionId: id,
        counselorId: userId,
        content: body.content.trim(),
        progressUpdate: body.progressUpdate,
        statusChange: body.statusChange,
        milestoneReached: body.milestoneReached || false,
        milestoneDescription: body.milestoneDescription,
        isConfidential: body.isConfidential || false,
        createdAt: new Date(),
      })
      .returning();

    // Update intervention if progress or status changed
    const updateValues: Record<string, unknown> = { updatedAt: new Date() };
    let intervention = existingIntervention[0];

    if (body.progressUpdate !== undefined) {
      updateValues.progress = body.progressUpdate;
    }

    if (body.statusChange) {
      updateValues.status = body.statusChange;
      if (body.statusChange === "completed") {
        updateValues.completedAt = new Date();
      }
    }

    // Also add note to intervention's notes array for backward compatibility
    const currentNotes = (intervention.notes as Array<{ id: string; content: string; createdBy: string; createdAt: string }>) || [];
    currentNotes.push({
      id: noteId,
      content: body.content.trim(),
      createdBy: userId,
      createdAt: new Date().toISOString(),
    });
    updateValues.notes = currentNotes;

    if (Object.keys(updateValues).length > 1) {
      [intervention] = await db
        .update(studentInterventions)
        .set(updateValues)
        .where(eq(studentInterventions.id, id))
        .returning();
    }

    logger.info("Added progress note to intervention", { interventionId: id, noteId, userId });

    return {
      data: {
        success: true,
        note: newNote,
        intervention,
      },
    };
  },
  ["counselor", "admin"]
);
