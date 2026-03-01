/**
 * TEACHER DASHBOARD ENTRY POINT
 *
 * Delegates to the appropriate component based on render context.
 * - Server component for initial load
 * - Client wrapper for live updates
 */

// Force dynamic rendering because this page uses authentication
export const dynamic = 'force-dynamic';

import { TeacherDashboardClient } from "./teacher-dashboard-client";
import { getTeacherDashboardData } from "./_actions";

// Server component that fetches initial data
async function TeacherDashboardWrapper() {
  // Fetch dashboard data server-side
  const dashboardData = await getTeacherDashboardData();

  // Return client wrapper with initial data
  return <TeacherDashboardClient initialData={dashboardData} />;
}

export default TeacherDashboardWrapper;
