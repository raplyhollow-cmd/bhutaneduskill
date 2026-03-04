"use client";

import { FeatureListPage } from "@/components/unified";
import { ClassFeature } from "@/features";

export default function ClassesPage() {
  return (
    <FeatureListPage
      feature={ClassFeature}
      title="Classes"
      onCreate={() => window.location.href = "/admin/classes/new"}
      onEdit={(id) => window.location.href = `/admin/classes/${id}/edit`}
    />
  );
}
