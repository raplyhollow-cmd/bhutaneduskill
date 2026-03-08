/**
 * SCHOOL ADMIN - SMART FEE MANAGEMENT
 *
 * Enhanced fee management with AI-powered insights:
 * - Predictive defaulting alerts
 * - Smart payment reminder timing
 * - Payment health scores
 * - Luxury glassmorphism UI
 */

import { SmartFeeClient } from "./smart-fee-client";
import { getFeeData } from "@/lib/api/school-admin";
import { getCurrentSchoolId } from "@/lib/api/school-admin";

export default async function SchoolAdminFeesPage() {
  // Get the current school ID from auth session
  const schoolId = await getCurrentSchoolId();

  // Fetch initial fee data
  const initialData = await getFeeData(schoolId);

  // Pass data to smart client component with AI insights
  return <SmartFeeClient initialData={initialData} />;
}
