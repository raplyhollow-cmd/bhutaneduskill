/**
 * SCHOOL ADMIN - EXAM RESULTS MANAGEMENT
 *
 * Features:
 * - List all exam results with filters
 * - Add new exam results
 * - Import results via CSV
 * - View exam details
 * - Export results
 * Now using real database data via server actions.
 */

import { logger } from "@/lib/logger";
import { ResultsClient } from "./results-client";
import { getExamResults } from "@/lib/api/school-admin";
import { getCurrentSchoolId } from "@/lib/api/school-admin";

type ExamResult = {
  id: string;
  studentId: string;
  studentName?: string;
  examName: string;
  totalMarks?: number;
  obtainedMarks?: number;
  percentage?: number;
  grade?: string;
  examDate?: string;
};

export default async function SchoolAdminResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";

  // Get initial data from database
  let initialResults: ExamResult[] = [];
  let initialTotal = 0;

  try {
    const schoolId = await getCurrentSchoolId();
    if (schoolId) {
      const result = await getExamResults(schoolId, {
        search,
        limit: 50,
        offset: 0,
      });
      initialResults = result.results;
      initialTotal = result.total;
    }
  } catch (error) {
    logger.error("Failed to load exam results:", error);
  }

  return (
    <ResultsClient
      initialResults={initialResults}
      initialTotal={initialTotal}
      initialSearch={search}
    />
  );
}