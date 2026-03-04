"use client";

import { FeatureListPage } from "@/components/unified";
import { LearningPathFeature } from "@/features";

export default function LearningPathsPage() {
  return (
    <FeatureListPage
      feature={LearningPathFeature}
      title="LearningPaths"
      onCreate={() => window.location.href = "/admin/learning_paths/new"}
      onEdit={(id) => window.location.href = `/admin/learning_paths/${id}/edit`}
    />
  );
}
