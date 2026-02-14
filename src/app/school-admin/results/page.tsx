/**
 * SCHOOL ADMIN - EXAM RESULTS MANAGEMENT
 *
 * Features:
 * - List all exam results with filters
 * - Add new exam results
 * - Import results via CSV
 * - View exam details
 * - Export results
 *
 * Now using real database data via server actions.
 */

import { ResultsClient } from "./results-client";
import { getExamResults } from "@/lib/api/school-admin";
import { getCurrentSchoolId } from "@/lib/api/school-admin";
import { unstable_noStore as noStore } from "next/cache";

noStore();

export default async function SchoolAdminResultsPage({
  searchParams,
}: {
  searchParams: { search?: string };
}) {
  const search = searchParams.search || "";

  // Get initial data from database
  let initialResults: any[] = [];
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
    console.error("Failed to load exam results:", error);
  }

  return (
    <ResultsClient
      initialResults={initialResults}
      initialTotal={initialTotal}
      initialSearch={search}
    />
  );
}