/**
 * SCHOOL ADMIN - ATTENDANCE MANAGEMENT
 *
 * Server component that fetches initial data and passes to client component.
 *
 * Features:
 * - Mark attendance for classes
 * - View attendance records
 * - Import attendance via CSV
 * - Kiosk mode for fingerprint check-in
 * - Attendance reports
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AttendanceClient } from "./attendance-client";
import { getAttendanceRecords } from "@/lib/api/school-admin";
import { eq, sql } from "drizzle-orm";
import { users, classes } from "@/lib/db/schema";
import { db } from "@/lib/db";

// Force dynamic rendering - this page requires database access
export const dynamic = 'force-dynamic';

export default async function SchoolAdminAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; class?: string; status?: string }>;
}) {
  // Get filter values from URL
  const params = await searchParams;
  const selectedDate = params.date || new Date().toISOString().split("T")[0];
  const selectedClass = params.class || "All";
  const selectedStatus = params.status || "All";

  // Fetch initial attendance records
  const result = await getAttendanceRecords(null, {
    date: selectedDate,
    classId: selectedClass !== "All" ? selectedClass : undefined,
    status: selectedStatus !== "All" ? selectedStatus : undefined,
  });

  // Get class options using db.select
  const allClasses = await db
    .select({ id: classes.id, name: classes.name })
    .from(classes)
    .limit(100);

  const classOptions = ["All", ...allClasses.map((c) => c.name || `${c.id}`)];

  const statusOptions = ["All", "Completed", "Pending"];

  // Get total student count for the school
  const [studentCountResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.type, "student"));

  const totalStudents = studentCountResult?.count || 0;

  return (
    <AttendanceClient
      initialRecords={result.records}
      initialDate={selectedDate}
      initialClass={selectedClass}
      initialStatus={selectedStatus}
      classOptions={classOptions}
      statusOptions={statusOptions}
      totalStudents={totalStudents}
    />
  );
}
