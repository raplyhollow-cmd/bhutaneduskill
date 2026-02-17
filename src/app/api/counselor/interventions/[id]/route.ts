import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const { id } = await params;

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
      return NextResponse.json(
        { error: "Intervention not found", status: 404 } ,
        { status: 404 }
      );
    }

    const { intervention, student } = interventionData[0];

    // Check permission - counselors can only see their own interventions
    if (user.type === "counselor" && intervention.counselorId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to view this intervention", status: 403 } ,
        { status: 403 }
      );
    }

    // Get progress notes for this intervention
    const notesData = await db
      .select()
      .from(interventionNotes)
      .where(eq(interventionNotes.interventionId, id))
      .orderBy(interventionNotes.createdAt);

    const studentName = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim();

    logger.info("Retrieved intervention details", { interventionId: id, userId });

    return NextResponse.json({
      success: true,
      data: {
        intervention: {
          ...intervention,
          studentName,
          grade: student.classGrade,
          progressNotes: notesData,
        },
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions/[id]", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve intervention", status: 500 },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH - Update intervention (progress, status, goals, outcome)
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const { id } = await params;
    const body: UpdateInterventionBody = await request.json();

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return NextResponse.json(
        { error: "Intervention not found", status: 404 } ,
        { status: 404 }
      );
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this intervention", status: 403 } ,
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      data: { intervention: updatedIntervention },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions/[id]", method: "PATCH" });
    return NextResponse.json(
      { success: false, error: "Failed to update intervention", status: 500 },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete intervention
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const { id } = await params;

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return NextResponse.json(
        { error: "Intervention not found", status: 404 } ,
        { status: 404 }
      );
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to delete this intervention", status: 403 } ,
        { status: 403 }
      );
    }

    // Delete intervention (cascade will delete associated notes)
    await db.delete(studentInterventions).where(eq(studentInterventions.id, id));

    logger.info("Deleted intervention", { interventionId: id, userId });

    return NextResponse.json({
      success: true,
      data: { message: "Intervention deleted successfully" },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions/[id]", method: "DELETE" });
    return NextResponse.json(
      { success: false, error: "Failed to delete intervention", status: 500 },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Add progress note to intervention
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const { id } = await params;
    const body: AddNoteBody = await request.json();

    if (!body.content || body.content.trim() === "") {
      return NextResponse.json(
        { error: "Note content is required", status: 400 } ,
        { status: 400 }
      );
    }

    // Check if intervention exists and user has permission
    const existingIntervention = await db
      .select()
      .from(studentInterventions)
      .where(eq(studentInterventions.id, id))
      .limit(1);

    if (existingIntervention.length === 0) {
      return NextResponse.json(
        { error: "Intervention not found", status: 404 } ,
        { status: 404 }
      );
    }

    if (user.type === "counselor" && existingIntervention[0].counselorId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to add notes to this intervention", status: 403 } ,
        { status: 403 }
      );
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

    return NextResponse.json({
      success: true,
      data: {
        note: newNote,
        intervention,
      },
    }, { status: 201 });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions/[id]", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to add note", status: 500 },
      { status: 500 }
    );
  }
}
