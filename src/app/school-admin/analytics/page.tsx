/**
 * SCHOOL ADMIN - ANALYTICS PAGE
 *
 * Server component that fetches analytics data and passes to client component.
 */

import { AnalyticsClient } from "./analytics-client";
import { getAnalytics } from "@/lib/api/school-admin";
import { getCurrentSchoolId } from "@/lib/api/school-admin";

export default async function SchoolAdminAnalyticsPage() {
  // Get the current school ID from auth session
  const schoolId = await getCurrentSchoolId();

  // Fetch initial analytics data
  const initialData = await getAnalytics(schoolId);

  // Pass data to client component for interactivity
  return <AnalyticsClient initialData={initialData} />;
}
