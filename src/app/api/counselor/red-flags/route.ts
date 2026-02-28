import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { redFlags, users, schools, studentInterventions, counselorAssignments } from "@/lib/db/schema";
import { eq, and, inArray, sql, desc } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/counselor/red-flags
 *
 * Get all red flags for counselor's assigned schools
 * Supports filtering by severity, status, school
 */
export const GET = createApiRoute(
  async (req, { userId }) => {
    const { searchParams } = new URL(req.url);
    const severity = searchParams.get("severity");
    const status = searchParams.get("status") || "flagged";
    const schoolId = searchParams.get("schoolId");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Get counselor's assigned schools
    const assignments = await db
      .select({ schoolId: counselorAssignments.schoolId })
      .from(counselorAssignments)
      .where(eq(counselorAssignments.counselorId, userId));
    const counselorSchools = assignments.map((a) => a.schoolId);

    // Build query conditions
    const conditions = [];

    if (counselorSchools.length > 0) {
      conditions.push(sql`${redFlags.schoolId} = ANY(${counselorSchools})`);
    }

    if (status) {
      conditions.push(eq(redFlags.status, status));
    }

    if (severity) {
      conditions.push(eq(redFlags.severity, severity));
    }

    if (schoolId) {
      conditions.push(eq(redFlags.schoolId, schoolId));
    }

    // Fetch red flags with student and school info
    const flags = await db
      .select({
        id: redFlags.id,
        severity: redFlags.severity,
        flagType: redFlags.flagType,
        status: redFlags.status,
        patternDetected: redFlags.patternDetected,
        aiRecommendation: redFlags.aiRecommendation,
        gnhPrinciple: redFlags.gnhPrinciple,
        attendanceData: redFlags.attendanceData,
        academicData: redFlags.academicData,
        createdAt: redFlags.createdAt,
        reviewedAt: redFlags.reviewedAt,
        studentId: redFlags.studentId,
        studentName: sql<string>`CONCAT(${users.firstName}, ' ', ${users.lastName})`,
        studentClass: users.classGrade,
        schoolId: redFlags.schoolId,
        schoolName: schools.name,
        counselorId: redFlags.counselorId,
        interventionId: redFlags.interventionId,
      })
      .from(redFlags)
      .innerJoin(users, eq(redFlags.studentId, users.id))
      .innerJoin(schools, eq(redFlags.schoolId, schools.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(redFlags.createdAt))
      .limit(limit);

    return {
      data: {
        flags,
        count: flags.length,
        summary: {
          critical: flags.filter((f) => f.severity === "critical").length,
          high: flags.filter((f) => f.severity === "high").length,
          medium: flags.filter((f) => f.severity === "medium").length,
          low: flags.filter((f) => f.severity === "low").length,
        },
      }
    };
  },
  ["counselor", "admin"]
);

/**
 * PATCH /api/counselor/red-flags
 *
 * Update red flag status (review, resolve, dismiss)
 * Can optionally create intervention
 */
export const PATCH = createApiRoute(
  async (req, { userId }) => {
    const body = await req.json();
    const { flagId, status, resolutionNotes, createIntervention = false } = body;

    if (!flagId || !status) {
      return {
        error: "flagId and status are required",
        status: 400
      };
    }

    // Get the red flag
    const flag = await db
      .select()
      .from(redFlags)
      .where(eq(redFlags.id, flagId))
      .limit(1)
      .then(rows => rows[0] || null);

    if (!flag) {
      return {
        error: "Red flag not found",
        status: 404
      };
    }

    // Create intervention if requested
    let interventionId = flag.interventionId;
    if (createIntervention && status === "intervention_planned" && !interventionId) {
      const newInterventionId = `intervention-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      await db.insert(studentInterventions).values({
        id: newInterventionId,
        counselorId: userId,
        studentId: flag.studentId,
        schoolId: flag.schoolId,
        type: flag.flagType === "academic" ? "academic" : flag.flagType === "behavior" ? "behavioral" : "personal",
        category: "Red Flag Intervention",
        priority: flag.severity === "critical" ? "urgent" : flag.severity === "high" ? "high" : "medium",
        status: "planned",
        description: flag.aiRecommendation || "Intervention based on red flag detection",
        goals: [],
        startDate: new Date(),
        targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      interventionId = newInterventionId;
    }

    // Update red flag
    await db
      .update(redFlags)
      .set({
        status,
        reviewedAt: new Date(),
        reviewedBy: userId,
        resolutionNotes,
        interventionId,
        updatedAt: new Date(),
      })
      .where(eq(redFlags.id, flagId));

    logger.info("Red flag updated", { flagId, status, counselorId: userId });

    return {
      data: {
        flagId,
        status,
        interventionId,
      }
    };
  },
  ["counselor", "admin"]
);
