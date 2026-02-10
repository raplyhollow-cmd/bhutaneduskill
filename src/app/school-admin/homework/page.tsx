/**
 * SCHOOL ADMIN - HOMEWORK OVERVIEW
 *
 * Server component that fetches homework data and passes to client component.
 */

import { HomeworkClient } from "./homework-client";
import { getHomeworkList } from "@/lib/api/school-admin";

export default async function SchoolAdminHomeworkPage({
  searchParams,
}: {
  searchParams: { page?: string; search?: string };
}) {
  const search = searchParams.search || "";

  // Fetch initial data from database
  const initialData = await getHomeworkList(null, {
    search,
    limit: 10,
    offset: 0,
  });

  return (
    <HomeworkClient
      initialSearch={search}
      initialHomework={initialData.homework}
      initialTotal={initialData.total}
    />
  );
}