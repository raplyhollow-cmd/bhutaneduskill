import { logger } from "@/lib/logger";
import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { careerPlans, users, counselorAssignments, schools, careerMatches, assessments } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * GET /api/counselor/career-plans
 *
 * Get all career plans for students at counselor's assigned schools
 * Counselors can view career plans for students at their assigned schools
 */
export const GET = createApiRoute(
  async (request, { userId, user }) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // completed, in_progress, not_started

    // Get counselor's assigned schools
    let targetSchoolIds: string[] = [];

    if (user.type === "counselor") {
      // Get school assignments for this counselor
      const assignments = await db
        .select({ schoolId: counselorAssignments.schoolId })
        .from(counselorAssignments)
        .where(and(
          eq(counselorAssignments.counselorId, userId),
          eq(counselorAssignments.isActive, true)
        ));
      targetSchoolIds = assignments.map((a) => a.schoolId);
    } else if (user.schoolId) {
      // Admin with a school ID
      targetSchoolIds = [user.schoolId];
    }

    if (targetSchoolIds.length === 0) {
      return {
        plans: [],
        stats: {
          totalPlans: 0,
          completedPlans: 0,
          inProgressPlans: 0,
          avgCompletion: 0,
        },
      };
    }

    // Get all students from assigned schools
    const schoolStudents = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, name: users.name, classGrade: users.classGrade, schoolId: users.schoolId })
      .from(users)
      .where(sql`${users.schoolId} IN ${sql.raw(`('${targetSchoolIds.join("','")}')`)}`);

    const studentIds = schoolStudents.map(s => s.id);
    const studentMap = new Map(schoolStudents.map(s => [s.id, s]));

    if (studentIds.length === 0) {
      return {
        plans: [],
        stats: {
          totalPlans: 0,
          completedPlans: 0,
          inProgressPlans: 0,
          avgCompletion: 0,
        },
      };
    }

    // Fetch school names
    const schoolsData = await db
      .select({ id: schools.id, name: schools.name })
      .from(schools)
      .where(sql`${schools.id} IN ${sql.raw(`('${targetSchoolIds.join("','")}')`)}`);
    const schoolMap = new Map(schoolsData.map(s => [s.id, s.name]));

    // Build conditions for career plans
    const conditions = [
      sql`${careerPlans.userId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`,
    ];

    if (status) {
      conditions.push(sql`${careerPlans.status} = ${status}`);
    }

    // Fetch career plans
    const plansData = await db
      .select()
      .from(careerPlans)
      .where(and(...conditions.map(c => sql.raw(c.toString()))))
      .orderBy(desc(careerPlans.updatedAt));

    // Get career matches for these students
    const careerMatchesData = await db
      .select()
      .from(careerMatches)
      .where(sql`${careerMatches.studentId} IN ${sql.raw(`('${studentIds.join("','")}')`)}`);

    // Get top career per student
    const topCareersByStudent = new Map<string, typeof careerMatchesData[number]>();
    for (const cm of careerMatchesData) {
      if (!topCareersByStudent.has(cm.studentId) || cm.matchScore > topCareersByStudent.get(cm.studentId)!.matchScore) {
        topCareersByStudent.set(cm.studentId, cm);
      }
    }

    // Format the response
    const plans = plansData.map(plan => {
      const student = studentMap.get(plan.userId);
      const topCareer = topCareersByStudent.get(plan.userId);
      const school = student ? schoolMap.get(student.schoolId || "") : null;

      return {
        id: plan.id,
        studentId: plan.userId,
        studentName: student?.name || `${student?.firstName || ""} ${student?.lastName || ""}`.trim() || "Unknown",
        studentGrade: student?.classGrade || null,
        studentSchool: school || null,
        targetCareer: topCareer?.careerTitle || plan.targetCareer || null,
        matchPercentage: topCareer?.matchScore || (plan as { matchScore?: number })?.matchScore || 0,
        status: plan.status,
        completionPercentage: (plan as { completionPercentage?: number })?.completionPercentage || 0,
        milestones: plan.milestones || [],
        shortTermGoals: plan.shortTermGoals || [],
        longTermGoals: plan.longTermGoals || [],
        counselorNotes: plan.notes || "",
        lastUpdated: plan.updatedAt?.toISOString() || new Date().toISOString(),
        nextReview: (plan as { nextReviewDate?: Date | string })?.nextReviewDate || null,
        riasecCode: (plan as { riasecCode?: string })?.riasecCode || null,
      };
    });

    // Calculate stats
    const totalPlans = plans.length;
    const completedPlans = plans.filter(p => p.status === "completed").length;
    const inProgressPlans = plans.filter(p => p.status === "in_progress").length;
    const avgCompletion = totalPlans > 0
      ? Math.round(plans.reduce((sum, p) => sum + p.completionPercentage, 0) / totalPlans)
      : 0;

    return {
      plans,
      stats: {
        totalPlans,
        completedPlans,
        inProgressPlans,
        avgCompletion,
      },
    };
  },
  ["counselor", "admin"]
);
