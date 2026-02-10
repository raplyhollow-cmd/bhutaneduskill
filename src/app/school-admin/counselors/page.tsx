/**
 * SCHOOL ADMIN - COUNSELORS MANAGEMENT
 *
 * Server component that fetches counselor data and passes to client component.
 */

import { CounselorsClient } from "./counselors-client";
import { fetchCounselors } from "../_actions";

export default async function SchoolAdminCounselorsPage() {
  // Fetch initial counselors data
  const initialData = await fetchCounselors({
    limit: 100,
    offset: 0,
  });

  // Pass data to client component for interactivity
  return <CounselorsClient initialCounselors={initialData.counselors} initialTotal={initialData.total} />;
}
