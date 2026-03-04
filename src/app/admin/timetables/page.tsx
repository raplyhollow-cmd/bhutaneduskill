"use client";

import { FeatureListPage } from "@/components/unified";
import { TimetableFeature } from "@/features";

export default function TimetablesPage() {
  return (
    <FeatureListPage
      feature={TimetableFeature}
      title="Timetables"
      onCreate={() => window.location.href = "/admin/timetables/new"}
      onEdit={(id) => window.location.href = `/admin/timetables/${id}/edit`}
    />
  );
}
