/**
 * RUB COLLEGE APPLICATIONS API
 *
 * Returns mock data for RUB college applications
 * Note: This is a placeholder API. In production, this would query actual application records.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { users, rubColleges as colleges, rubPrograms, rubApplications } from "@/lib/db/schema";
import { eq, and, desc, sql, or } from "drizzle-orm";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const currentUser = await db.query.users.findFirst({
      where: eq(users.clerkUserId, userId),
      columns: { id: true, type: true, role: true, schoolId: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "my-applications";

    if (action === "my-applications") {
      // Get student's applications
      const applications = await db.query.rubApplications.findMany({
        where: eq(rubApplications.studentId, currentUser.id),
        with: {
          college: true,
        program: true,
        },
        orderBy: [desc(rubApplications.createdAt)],
      });

      return NextResponse.json({ applications });
    }

    if (action === "college-programs") {
      // Get available RUB colleges and programs
      const collegeId = searchParams.get("collegeId");
      const programId = searchParams.get("programId");

      if (collegeId) {
        const collegePrograms = await db.query.rubPrograms.findMany({
          where: and(
            eq(rubPrograms.collegeId, collegeId),
            sql`${rubPrograms.isActive} = 1`
          ),
          with: {
            college: true,
          },
          orderBy: [rubPrograms.name],
        });

        return NextResponse.json({ programs: collegePrograms });
      }

      if (programId) {
        const program = await db.query.rubPrograms.findFirst({
          where: and(
            eq(rubPrograms.id, programId),
            sql`${rubPrograms.isActive} = 1`
          ),
          with: {
            college: true,
          },
        });

        return NextResponse.json({
          college: program?.college || {},
          program: program || {},
        });
      }

      // Return all programs if no specific college or program
      const allPrograms = await db.query.rubPrograms.findMany({
        where: sql`${rubPrograms.isActive} = 1`,
        with: {
          college: true,
        },
        orderBy: [rubPrograms.name],
      });

      return NextResponse.json({ programs: allPrograms });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("RUB applications error:", error);
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 });
  }
}
