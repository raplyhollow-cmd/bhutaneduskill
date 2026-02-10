/**
 * SCHOOL ADMIN - TUITION CENTER
 *
 * Server component that fetches tuition course data and passes to client component.
 */

import { TuitionClient } from "./tuition-client";
import { fetchTuitionCourses } from "../_actions";

export default async function SchoolAdminTuitionPage() {
  // Fetch initial tuition courses data
  const initialData = await fetchTuitionCourses({
    limit: 50,
    offset: 0,
  });

  // Pass data to client component for interactivity
  return <TuitionClient initialCourses={initialData.courses} initialTotal={initialData.total} />;
}
