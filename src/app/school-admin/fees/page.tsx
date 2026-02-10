/**
 * SCHOOL ADMIN - FEE MANAGEMENT
 *
 * Server component that fetches fee data and passes to client component.
 */

import { FeeClient } from "./fee-client";
import { getFeeData } from "@/lib/api/school-admin";
import { getCurrentSchoolId } from "@/lib/api/school-admin";

export default async function SchoolAdminFeesPage() {
  // Get the current school ID from auth session
  const schoolId = await getCurrentSchoolId();

  // Fetch initial fee data
  const initialData = await getFeeData(schoolId);

  // Pass data to client component for interactivity
  return <FeeClient initialData={initialData} />;
}
