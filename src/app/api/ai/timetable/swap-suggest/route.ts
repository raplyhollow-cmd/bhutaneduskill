/**
 * AI SWAP PARTNER SUGGESTION API
 *
 * POST /api/ai/timetable/swap-suggest
 *
 * Uses AI to suggest compatible swap partners for a teacher.
 * Analyzes qualifications, availability, and workload fairness.
 */

import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { users, subjects, teachers, timePeriods, timetables, schools } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { logger } from "@/lib/logger";
import { createApiRoute } from "@/lib/api/route-handler";
import { successResponse, errorResponse, badRequestResponse } from "@/lib/api/response-helpers";
import { findSwapPartnersWithAI } from "@/lib/ai/timetable-optimizer";
import type { TimetableEntry, SwapPartner } from "@/lib/types/timetable-constraints";

export const POST = createApiRoute(
  async (request: NextRequest, auth) => {
    const { userId, user } = auth;

    if (!user.schoolId) {
      return badRequestResponse("No school associated with your account");
    }

    try {
      const body = await request.json();
      const { teacherId, periodToSwap, subjectId } = body;

      // Validate required fields
      if (!teacherId || !periodToSwap || !subjectId) {
        return badRequestResponse("Missing required fields: teacherId, periodToSwap, subjectId");
      }

      // Get teacher details
      const [teacherResult] = await db
        .select({
          id: users.id,
          name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(users)
        .where(eq(users.id, teacherId))
        .limit(1);

      if (!teacherResult) {
        return badRequestResponse("Teacher not found");
      }

      // Get subject details
      const [subjectResult] = await db
        .select()
        .from(subjects)
        .where(eq(subjects.id, subjectId))
        .limit(1);

      if (!subjectResult) {
        return badRequestResponse("Subject not found");
      }

      // Get all qualified teachers for this subject
      // In a real system, this would check teacher-subject assignments
      const allTeachers = await db
        .select({
          id: users.id,
          name: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
        })
        .from(users)
        .where(
          and(
            eq(users.schoolId, user.schoolId),
            sql`${users.role} = 'teacher'`,
            sql`${users.id} != ${teacherId}` // Exclude the requesting teacher
          )
        );

      // For demo purposes, assume all teachers can teach any subject
      // In production, you'd check the teacher_subjects junction table
      const qualifiedTeachers = allTeachers.map((t) => ({
        ...t,
        subjects: [subjectId], // All teachers qualified for demo
      }));

      // Get current timetable for availability checking
      const timetableResult = await db
        .select({
          id: timetables.id,
          dayOfWeek: timetables.dayOfWeek,
          periodNumber: timetables.periodNumber,
          teacherId: timetables.teacherId,
          teacherName: sql<string>`concat(${users.firstName}, ' ', ${users.lastName})`,
          subjectName: subjects.name,
          className: sql<string>`concat(${schools.name}, ' - Class ', 'TODO')`, // Simplified
        })
        .from(timetables)
        .innerJoin(users, eq(timetables.teacherId, users.id))
        .innerJoin(subjects, eq(timetables.subjectId, subjects.id))
        .where(eq(timetables.schoolId, user.schoolId));

      const currentTimetable: TimetableEntry[] = timetableResult.map((entry) => ({
        id: entry.id,
        classId: "",
        subjectId: "",
        teacherId: entry.teacherId,
        teacherName: entry.teacherName,
        subjectName: entry.subjectName,
        dayOfWeek: entry.dayOfWeek,
        periodNumber: entry.periodNumber,
        startTime: "",
        endTime: "",
      }));

      // Use AI to find compatible swap partners
      const result = await findSwapPartnersWithAI(
        teacherId,
        teacherResult.name,
        periodToSwap,
        subjectId,
        subjectResult.name || "",
        qualifiedTeachers,
        currentTimetable
      );

      logger.info("AI swap partner suggestion completed", {
        schoolId: user.schoolId,
        requestingTeacher: teacherId,
        suggestionsCount: result.suggestedPartners.length,
      });

      return successResponse({
        suggestedPartners: result.suggestedPartners.map((partner) => ({
          ...partner,
          teacherId: partner.teacherId,
          teacherName: partner.teacherName,
          theirPeriod: partner.theirPeriod || { day: "Any", period: 0 },
          compatibilityScore: partner.compatibilityScore,
          swapImpact: partner.swapImpact,
          reason: partner.reason,
        })),
        recommended: result.recommended,
      });
    } catch (error) {
      logger.error("AI swap partner suggestion failed", { error, schoolId: user.schoolId });
      return errorResponse(error instanceof Error ? error.message : "Failed to suggest swap partners");
    }
  },
  ["school-admin", "teacher"]
);
