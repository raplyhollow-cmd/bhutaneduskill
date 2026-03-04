"use client";

import { FeatureListPage } from "@/components/unified";
import { HomeworkFeature } from "@/features";

export default function HomeworkPage() {
  return (
    <FeatureListPage
      feature={HomeworkFeature}
      title="Homework"
      onCreate={() => window.location.href = "/admin/homework/new"}
      onEdit={(id) => window.location.href = `/admin/homework/${id}/edit`}
    />
  );
}
