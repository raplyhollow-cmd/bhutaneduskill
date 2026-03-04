"use client";

import { FeatureListPage } from "@/components/unified";
import { GradeFeature } from "@/features";

export default function GradesPage() {
  return (
    <FeatureListPage
      feature={GradeFeature}
      title="Grades"
      onCreate={() => window.location.href = "/admin/grades/new"}
      onEdit={(id) => window.location.href = `/admin/grades/${id}/edit`}
    />
  );
}
