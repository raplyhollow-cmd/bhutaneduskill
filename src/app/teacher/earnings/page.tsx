/**
 * TEACHER EARNINGS PAGE
 * View tuition earnings, payment history, and payout information
 *
 * Now using real database data via server actions.
 */

import { getTeacherEarnings } from "@/lib/api/teacher";
import { getCurrentTeacherId } from "@/lib/api/teacher";
import { EarningsClient } from "./earnings-client";

export default async function TeacherEarningsPage() {
  // Get teacher ID from auth
  const tutorId = await getCurrentTeacherId();

  // Fetch initial data
  const { earningsData, transactions, courseStats } = await getTeacherEarnings(tutorId);

  return (
    <EarningsClient
      initialEarningsData={earningsData}
      initialTransactions={transactions}
      initialCourseStats={courseStats}
    />
  );
}
