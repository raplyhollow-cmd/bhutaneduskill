import { db } from "@/lib/db";
import { schools, users, books, circulation } from "@/lib/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";
import { logger } from "@/lib/logger";

/**
 * GET /api/admin/stats - Get admin dashboard statistics
 *
 * Returns:
 * - overview: Total schools, students, teachers
 * - library: Total books, overdue loans
 */
export const GET = createApiRoute(async () => {
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

  return {
    success: true,
    overview,
    library,
    timestamp: new Date().toISOString(),
  };
}, ["admin"]);
