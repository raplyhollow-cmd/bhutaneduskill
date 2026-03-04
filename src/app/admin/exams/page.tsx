"use client";

import { FeatureListPage } from "@/components/unified";
import { ExamFeature } from "@/features";

export default function ExamsPage() {
  return (
    <FeatureListPage
      feature={ExamFeature}
      title="Exams"
      onCreate={() => window.location.href = "/admin/exams/new"}
      onEdit={(id) => window.location.href = `/admin/exams/${id}/edit`}
    />
  );
}
