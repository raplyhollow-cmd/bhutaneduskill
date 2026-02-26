/**
 * RUB Programs API
 * Browse and search RUB college programs
 *
 * MIGRATED: Now uses createApiRoute wrapper for auth/error handling
 */

import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, or, like, sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { createApiRoute, getAuth } from "@/lib/api/route-handler";
import { successResponse, errorResponse } from "@/lib/api/response-helpers";

// ============================================================================
// TYPES
// ============================================================================

type WhereCondition = SQL | undefined;

/**
 * GET /api/rub/programs
 * Browse RUB college programs
 */
export const GET = createApiRoute(
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId");
    const level = searchParams.get("level"); // certificate, diploma, bachelor, master, phd
    const field = searchParams.get("field"); // engineering, arts, science, business, education, medicine
    const search = searchParams.get("search");
    const admissionOpen = searchParams.get("admissionOpen") === "true";

    // Build query conditions
    const conditions: WhereCondition[] = [];

    // Only show active programs
    conditions.push(eq(rubPrograms.isActive, true));

    if (collegeId) {
      conditions.push(eq(rubPrograms.collegeId, collegeId));
    }

    if (level) {
      conditions.push(eq(rubPrograms.level, level));
    }

    if (field) {
      conditions.push(eq(rubPrograms.field, field));
    }

    if (admissionOpen) {
      conditions.push(eq(rubPrograms.admissionOpen, true));
    }

    if (search) {
      conditions.push(
        or(
          like(rubPrograms.name, `%${search}%`),
          like(rubPrograms.code, `%${search}%`),
          like(sql`COALESCE(${rubPrograms.description}, '')`, `%${search}%`)
        )
      );
    }

    // Fetch programs
    const programs = await db
      .select({
        id: rubPrograms.id,
        name: rubPrograms.name,
        code: rubPrograms.code,
        collegeId: rubPrograms.collegeId,
        level: rubPrograms.level,
        field: rubPrograms.field,
        discipline: rubPrograms.discipline,
        duration: rubPrograms.duration,
        durationType: rubPrograms.durationType,
        totalSeats: rubPrograms.totalSeats,
        minPercentage: rubPrograms.minPercentage,
        tuitionFee: rubPrograms.tuitionFee,
        hostelFee: rubPrograms.hostelFee,
        totalFee: rubPrograms.totalFee,
        description: rubPrograms.description,
        admissionOpen: rubPrograms.admissionOpen,
        academicYear: rubPrograms.academicYear,
      })
      .from(rubPrograms)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(rubPrograms.name)
      .limit(100);

    // Fetch college details for each program
    const collegeIds = [...new Set(programs.map((p) => p.collegeId))];
    const colleges = await db
      .select({
        id: rubColleges.id,
        name: rubColleges.name,
        code: rubColleges.code,
        dzongkhag: rubColleges.dzongkhag,
        location: rubColleges.location,
        hasHostel: rubColleges.hasHostel,
        website: rubColleges.website,
      })
      .from(rubColleges)
      .where(sql`${rubColleges.id} = ANY(${collegeIds})`);

    const collegeMap = new Map(colleges.map((c) => [c.id, c]));

    // Combine programs with college info
    const programsWithCollege = programs.map((program) => ({
      ...program,
      college: collegeMap.get(program.collegeId),
    }));

    logger.info("Fetched RUB programs", {
      count: programs.length,
      collegeId,
      level,
      field,
    });

    return successResponse({
      programs: programsWithCollege,
      colleges,
      filters: {
        levels: ["certificate", "diploma", "bachelor", "master", "phd"],
        fields: ["engineering", "arts", "science", "business", "education", "medicine", "technology"],
      },
    });
  },
  ["student", "parent", "counselor", "teacher", "school-admin", "admin"]
);
