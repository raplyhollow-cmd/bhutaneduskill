import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { db } from "@/lib/db";
import { careerApprovals, rubScholarships, rubPrograms, rubColleges, users, counselorAssignments } from "@/lib/db/schema";
import { eq, and, sql, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import type { ApiSuccess, ApiErrorResponse } from "@/types";

/**
 * POST /api/counselor/career-approve
 *
 * Create counselor approval for student career path
 * Links to RUB scholarships and programs
 */
export async function POST(req: Request) {
  try {
    const authResult = await requireAuth(["counselor"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const body = await req.json();

    const {
      studentId,
      careerTitle,
      careerField,
      suitabilityScore,
      academicAlignment,
      skillsGap,
      counselorNotes,
      reservations,
      approvalStatus,
      scholarshipReady,
      gnhAlignment,
      targetRUBCollege,
      targetProgram,
    } = body;

    if (!studentId || !careerTitle || !approvalStatus) {
      return Response.json(
        { error: "studentId, careerTitle, and approvalStatus are required", status: 400 } satisfies ApiErrorResponse,
        { status: 400 }
      );
    }

    // Check for existing approval
    const existing = await db.query.careerApprovals.findFirst({
      where: and(
        eq(careerApprovals.studentId, studentId),
        eq(careerApprovals.careerTitle, careerTitle),
        sql`${careerApprovals.validUntil} IS NULL OR ${careerApprovals.validUntil} >= NOW()`
      ),
    });

    if (existing) {
      // Update existing approval
      await db
        .update(careerApprovals)
        .set({
          approvalStatus,
          suitabilityScore,
          academicAlignment,
          skillsGap,
          counselorNotes,
          reservations,
          scholarshipReady,
          gnhAlignment,
          targetRUBCollege,
          targetProgram,
          approvedAt: approvalStatus !== "pending" ? new Date() : null,
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          updatedAt: new Date(),
        })
        .where(eq(careerApprovals.id, existing.id));
    } else {
      // Create new approval
      const approvalId = `career-approval-${nanoid()}`;
      await db.insert(careerApprovals).values({
        id: approvalId,
        studentId,
        counselorId: userId,
        careerTitle,
        careerField: careerField || null,
        targetRUBCollege: targetRUBCollege || null,
        targetProgram: targetProgram || null,
        approvalStatus,
        suitabilityScore,
        academicAlignment,
        skillsGap: skillsGap || [],
        counselorNotes,
        reservations,
        scholarshipReady: scholarshipReady || false,
        gnhAlignment: gnhAlignment || [],
        approvedAt: approvalStatus !== "pending" ? new Date() : null,
        validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    // Find matching RUB scholarships if scholarship ready
    let recommendedScholarships: any[] = [];
    if (scholarshipReady || approvalStatus === "approved") {
      const scholarships = await db.query.rubScholarships.findMany({
        where: eq(rubScholarships.isActive, true),
        limit: 5,
      });

      recommendedScholarships = scholarships.map((s) => ({
        scholarshipId: s.id,
        name: s.name,
        suitability: "Match based on career field and merit",
      }));
    }

    logger.info("Career approval created", {
      counselorId: userId,
      studentId,
      careerTitle,
      approvalStatus,
    });

    return Response.json({
      data: {
        message: `Career ${approvalStatus === "approved" ? "approved" : approvalStatus === "approved_with_reservations" ? "approved with reservations" : "not recommended"}`,
        approvalId: existing?.id || null,
        recommendedScholarships,
      },
    } satisfies ApiSuccess<{
      message: string;
      approvalId: string | null;
      recommendedScholarships: Array<{
        scholarshipId: string;
        name: string;
        suitability: string;
      }>;
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/career-approve", method: "POST" });
    return Response.json(
      { error: "Failed to create career approval", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}

/**
 * GET /api/counselor/career-approve
 *
 * Get students' career matches for counselor review
 */
export async function GET(req: Request) {
  try {
    const authResult = await requireAuth(["counselor"]);
    if ("error" in authResult) {
      return Response.json(
        { error: authResult.error, status: authResult.status } satisfies ApiErrorResponse,
        { status: authResult.status }
      );
    }

    const { userId } = authResult;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");

    // Get counselor's assigned schools
    const assignments = await db.query.counselorAssignments.findMany({
      where: eq(counselorAssignments.counselorId, userId),
      columns: { schoolId: true },
    });
    const counselorSchools = assignments.map((a) => a.schoolId);

    // Get students with completed assessments from counselor's schools
    const students = await db.execute(sql`
      SELECT DISTINCT
        u.id as student_id,
        u.first_name,
        u.last_name,
        u.class_grade,
        s.name as school_name,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', cm.id,
            'career_id', cm.career_id,
            'career_title', cm.career_title,
            'match_score', cm.match_score,
            'match_reason', cm.match_reason
          ) ORDER BY cm.match_score DESC
        ) FILTER (WHERE cm.id IS NOT NULL) as career_matches
      FROM users u
      LEFT JOIN students st ON st.user_id = u.id
      LEFT JOIN schools s ON s.id = st.school_id
      LEFT JOIN assessments a ON a.user_id = u.id AND a.status = 'completed'
      LEFT JOIN career_matches cm ON cm.assessment_id = a.id AND cm.student_id = u.id
      WHERE s.id = ANY(${counselorSchools})
        ${studentId ? sql`AND u.id = ${studentId}` : sql``}
      GROUP BY u.id, u.first_name, u.last_name, u.class_grade, s.name
      HAVING COUNT(a.id) FILTER (WHERE a.status = 'completed') > 0
      ORDER BY u.last_name, u.first_name
      LIMIT 50
    `);

    const studentList = students.rows.map((row: any) => ({
      id: row.student_id,
      studentName: `${row.first_name} ${row.last_name}`.trim(),
      studentClass: row.class_grade,
      schoolName: row.school_name,
      careerMatches: row.career_matches || [],
    }));

    return Response.json({
      data: {
        students: studentList,
        count: studentList.length,
      },
    } satisfies ApiSuccess<{
      students: Array<{
        id: string;
        studentName: string;
        studentClass: number | null;
        schoolName: string;
        careerMatches: unknown[];
      }>;
      count: number;
    }>);
  } catch (error) {
    logger.apiError(error, { route: "/api/counselor/career-approve", method: "GET" });
    return Response.json(
      { error: "Failed to fetch career matches", status: 500 } satisfies ApiErrorResponse,
      { status: 500 }
    );
  }
}
