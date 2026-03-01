import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, schools, invoices } from "@/lib/db/schema";
import { sql, eq } from "drizzle-orm";
import { createApiRoute } from "@/lib/api/route-handler";

/**
 * DEBUG: Check what's actually in the database
 */
export const GET = createApiRoute(
  async () => {
    // Get raw counts without any filtering
    const [allUsersResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(users);
    const [allSchoolsResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(schools);
    const [allInvoicesResult] = await db.select({ count: sql<number>`COUNT(*)::int` }).from(invoices);

    // Get users by type
    const [studentsResult] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(eq(users.type, "student"));

    const [teachersResult] = await db.select({ count: sql<number>`COUNT(*)::int` })
      .from(users)
      .where(eq(users.type, "teacher"));

    // Sample of schools
    const sampleSchools = await db.select({ id: schools.id, name: schools.name }).from(schools).limit(3);

    // Sample of users
    const sampleUsers = await db.select({ id: users.id, type: users.type, schoolId: users.schoolId }).from(users).limit(3);

    // Sample of invoices
    const sampleInvoices = await db.select({
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      schoolId: invoices.schoolId
    }).from(invoices).limit(3);

    return NextResponse.json({
      counts: {
        allUsers: allUsersResult?.count || 0,
        allSchools: allSchoolsResult?.count || 0,
        allInvoices: allInvoicesResult?.count || 0,
        students: studentsResult?.count || 0,
        teachers: teachersResult?.count || 0,
      },
      samples: {
        schools: sampleSchools,
        users: sampleUsers,
        invoices: sampleInvoices,
      }
    });
  },
  ['admin']
);
