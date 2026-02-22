import { db } from "@/lib/db";
import { schools, users, books, circulation } from "@/lib/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { requireAuth } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";
import { NextResponse } from "next/server";

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 *
 * Returns:
 * - overview: Total schools, students, teachers
 * - library: Total books, overdue loans
 */
export async function GET() {
  try {
    // Authentication check - requires admin role
    const authResult = await requireAuth(["admin"]);
    if ("error" in authResult) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status === 401 ? 401 : 403 }
      );
    }

    // Parallel queries for better performance
    const [
      schoolsResult,
      studentsResult,
      teachersResult,
      booksResult,
      overdueLoansResult,
    ] = await Promise.all([
      // Count total schools
      db.select({ count: count() }).from(schools),

      // Count total students
      db.select({ count: count() })
        .from(users)
        .where(eq(users.type, "student")),

      // Count total teachers
      db.select({ count: count() })
        .from(users)
        .where(eq(users.type, "teacher")),

      // Count total library books
      db.select({ count: count() }).from(books),

      // Count overdue loans (status = "overdue" or past due date with status = "borrowed")
      db.select({ count: count() })
        .from(circulation)
        .where(
          sql`(
            ${circulation.status} = 'overdue' OR
            (${circulation.status} = 'borrowed' AND ${circulation.dueDate} < CURRENT_DATE)
          )`
        ),
    ]);

    const overview = {
      schools: schoolsResult[0]?.count ?? 0,
      students: studentsResult[0]?.count ?? 0,
      teachers: teachersResult[0]?.count ?? 0,
    };

    const library = {
      totalBooks: booksResult[0]?.count ?? 0,
      overdueLoans: overdueLoansResult[0]?.count ?? 0,
    };

    logger.info("Admin stats fetched", {
      route: "/api/admin/stats",
      overview,
      library,
    });

    return NextResponse.json({
      success: true,
      overview,
      library,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    logger.apiError(error, { route: "/api/admin/stats", method: "GET" });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch statistics",
      },
      { status: 500 }
    );
  }
}
