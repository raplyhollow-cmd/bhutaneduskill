import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { users, schools, studentInterventions, interventionNotes } from "@/lib/db/schema";
import { eq, and, desc, count, gte, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

// ============================================================================
// TYPES
// ============================================================================

interface InterventionGoal {
  id: string;
  text: string;
  status: "pending" | "in_progress" | "completed";
  targetDate?: string;
}

interface InterventionNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

interface CreateInterventionRequest {
  studentId: string;
  type: "academic" | "behavioral" | "personal" | "career" | "social";
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  description: string;
  startDate: string;
  targetDate: string;
  followUpDate?: string;
  goals?: InterventionGoal[];
  tags?: string[];
}

interface UpdateInterventionRequest {
  id: string;
  status?: "planned" | "active" | "monitoring" | "completed" | "cancelled";
  progress?: number;
  outcome?: string;
  outcomeRating?: "successful" | "partially_successful" | "unsuccessful";
  completedAt?: string;
}

interface AddNoteRequest {
  interventionId: string;
  content: string;
  progressUpdate?: number;
  statusChange?: string;
  milestoneReached?: boolean;
  milestoneDescription?: string;
  isConfidential?: boolean;
}

// ============================================================================
// GET - List interventions with stats
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { user, userId } = authResult;
    const { searchParams } = new URL(request.url);

    // Get filter parameters
    const status = searchParams.get("status");
    const type = searchParams.get("type");
    const priority = searchParams.get("priority");
    const studentId = searchParams.get("studentId");

    // Build query conditions
    const conditions: any[] = [];

    // Counselors can only see their own interventions
    if (user.type === "counselor") {
      conditions.push(eq(studentInterventions.counselorId, userId));
    }

    if (status) {
      conditions.push(eq(studentInterventions.status, status));
    }
    if (type) {
      conditions.push(eq(studentInterventions.type, type));
    }
    if (priority) {
      conditions.push(eq(studentInterventions.priority, priority));
    }
    if (studentId) {
      conditions.push(eq(studentInterventions.studentId, studentId));
    }

    // Query interventions with student and school info
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const interventionsData = await db
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
        school: {
          id: schools.id,
          name: schools.name,
        },
      })
      .from(studentInterventions)
      .leftJoin(users, eq(studentInterventions.studentId, users.id))
      .leftJoin(schools, eq(studentInterventions.schoolId, schools.id))
      .where(whereClause)
      .orderBy(desc(studentInterventions.createdAt));

    // Get stats
    const statsConditions = user.type === "counselor"
      ? [eq(studentInterventions.counselorId, userId)]
      : [];

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalCount, activeCount, highPriorityCountData, completedCountData] = await Promise.all([
      db.select({ count: count() }).from(studentInterventions).where(and(...statsConditions)),
      db.select({ count: count() }).from(studentInterventions).where(
        and(...statsConditions, eq(studentInterventions.status, "active"))
      ),
      db.select({ count: count() }).from(studentInterventions).where(
        and(
          ...statsConditions,
          sql`${studentInterventions.priority} IN ('high', 'urgent')`,
          sql`${studentInterventions.status} != 'completed'`
        )
      ),
      db.select({ count: count() }).from(studentInterventions).where(
        and(
          ...statsConditions,
          eq(studentInterventions.status, "completed"),
          gte(studentInterventions.completedAt, startOfMonth)
        )
      ),
    ]);

    const stats = {
      totalInterventions: totalCount[0]?.count || 0,
      activeInterventions: activeCount[0]?.count || 0,
      highPriorityCount: highPriorityCountData[0]?.count || 0,
      completedThisMonth: completedCountData[0]?.count || 0,
    };

    // Format response
    const formattedInterventions = interventionsData.map((item) => ({
      id: item.intervention.id,
      studentId: item.student.id,
      studentName: item.student.name || `${item.student.firstName || ""} ${item.student.lastName || ""}`.trim(),
      grade: item.student.classGrade,
      school: item.school?.name || "",
      type: item.intervention.type,
      category: item.intervention.category,
      priority: item.intervention.priority,
      status: item.intervention.status,
      startDate: item.intervention.startDate,
      targetDate: item.intervention.targetDate,
      followUpDate: item.intervention.followUpDate,
      progress: item.intervention.progress || 0,
      description: item.intervention.description,
      goals: item.intervention.goals || [],
      notes: item.intervention.notes || [],
      outcome: item.intervention.outcome,
      outcomeRating: item.intervention.outcomeRating,
      tags: item.intervention.tags || [],
      counselorId: item.intervention.counselorId,
      createdAt: item.intervention.createdAt,
    }));

    logger.info("Retrieved counselor interventions", { userId, count: formattedInterventions.length });

    return NextResponse.json({
      success: true,
      data: {
        interventions: formattedInterventions,
        stats,
      },
    });
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions", method: "GET" });
    return NextResponse.json(
      { success: false, error: "Failed to retrieve interventions", status: 500 },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create new intervention
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuth(["counselor", "admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { error: authResult.error, status: authResult.status } ,
        { status: authResult.status }
      );
    }

    const { userId, user } = authResult;
    const body = await request.json();

    // Validate required fields
    const { studentId, type, category, priority, description, startDate, targetDate, goals } = body;

    if (!studentId || !type || !category || !description || !startDate || !targetDate) {
      return NextResponse.json(
        { error: "Missing required fields: studentId, type, category, description, startDate, targetDate", status: 400 } ,
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["academic", "behavioral", "personal", "career", "social"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: "Invalid intervention type. Must be one of: " + validTypes.join(", "), status: 400 } ,
        { status: 400 }
      );
    }

    // Validate priority
    const validPriorities = ["low", "medium", "high", "urgent"];
    if (priority && !validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: "Invalid priority. Must be one of: " + validPriorities.join(", "), status: 400 } ,
        { status: 400 }
      );
    }

    // Get student info to determine school
    const studentData = await db
      .select({ schoolId: users.schoolId })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    if (studentData.length === 0) {
      return NextResponse.json(
        { error: "Student not found", status: 404 } ,
        { status: 404 }
      );
    }

    // Generate unique ID
    const interventionId = `intervention_${nanoid(12)}`;

    // Create intervention goals with proper IDs
    const interventionGoals: InterventionGoal[] = (goals || []).map((g: Partial<InterventionGoal>) => ({
      id: g.id || `goal_${nanoid(8)}`,
      text: g.text || "",
      status: g.status || "pending",
      targetDate: g.targetDate,
    }));

    // Create the intervention
    const [newIntervention] = await db
      .insert(studentInterventions)
      .values({
        id: interventionId,
        counselorId: userId,
        studentId,
        schoolId: studentData[0].schoolId,
        type,
        category,
        priority: priority || "medium",
        status: "planned",
        description,
        startDate: new Date(startDate),
        targetDate: new Date(targetDate),
        followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
        goals: interventionGoals,
        tags: body.tags || [],
        progress: 0,
        notes: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Get student details for response
    const studentDetails = await db
      .select({
        name: users.name,
        firstName: users.firstName,
        lastName: users.lastName,
        classGrade: users.classGrade,
      })
      .from(users)
      .where(eq(users.id, studentId))
      .limit(1);

    const student = studentDetails[0];
    const studentName = student.name || `${student.firstName || ""} ${student.lastName || ""}`.trim();

    logger.info("Created new intervention", {
      interventionId,
      counselorId: userId,
      studentId,
      type,
      category,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          intervention: {
            ...newIntervention,
            studentName,
            grade: student.classGrade,
            school: "",
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/interventions", method: "POST" });
    return NextResponse.json(
      { success: false, error: "Failed to create intervention", status: 500 },
      { status: 500 }
    );
  }
}
