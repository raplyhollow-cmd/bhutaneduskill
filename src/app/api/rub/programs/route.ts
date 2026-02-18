/**
 * RUB Programs API
 * Browse and search RUB college programs
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { rubColleges, rubPrograms } from "@/lib/db/schema";
import { db } from "@/lib/db";
import { eq, and, or, like, sql } from "drizzle-orm";

/**
 * GET /api/rub/programs
 * Browse RUB college programs
 */
export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(["student", "parent", "counselor", "teacher", "school_admin", "admin"]);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(req.url);
    const collegeId = searchParams.get("collegeId");
    const level = searchParams.get("level"); // certificate, diploma, bachelor, master, phd
    const field = searchParams.get("field"); // engineering, arts, science, business, education, medicine
    const search = searchParams.get("search");
    const admissionOpen = searchParams.get("admissionOpen") === "true";

    // Build query conditions
    const conditions: any[] = [];

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

    return NextResponse.json({
      success: true,
      data: {
        programs: programsWithCollege,
        colleges,
        filters: {
          levels: ["certificate", "diploma", "bachelor", "master", "phd"],
          fields: ["engineering", "arts", "science", "business", "education", "medicine", "technology"],
        },
      },
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/rub/programs", method: "GET" });
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Failed to fetch programs",
    }, { status: 500 });
  }
}
