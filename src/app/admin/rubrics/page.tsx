"use client";

import { FeatureListPage } from "@/components/unified";
import { RubricFeature } from "@/features";

export default function RubricsPage() {
  return (
    <FeatureListPage
      feature={RubricFeature}
      title="Rubrics"
      onCreate={() => window.location.href = "/admin/rubrics/new"}
      onEdit={(id) => window.location.href = `/admin/rubrics/${id}/edit`}
    />
  );
}
