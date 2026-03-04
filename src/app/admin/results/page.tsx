"use client";

import { FeatureListPage } from "@/components/unified";
import { ResultFeature } from "@/features";

export default function ResultsPage() {
  return (
    <FeatureListPage
      feature={ResultFeature}
      title="Results"
      onCreate={() => window.location.href = "/admin/results/new"}
      onEdit={(id) => window.location.href = `/admin/results/${id}/edit`}
    />
  );
}
