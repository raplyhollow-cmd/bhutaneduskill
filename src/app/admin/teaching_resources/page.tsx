"use client";

import { FeatureListPage } from "@/components/unified";
import { TeachingResourceFeature } from "@/features";

export default function TeachingResourcesPage() {
  return (
    <FeatureListPage
      feature={TeachingResourceFeature}
      title="TeachingResources"
      onCreate={() => window.location.href = "/admin/teaching_resources/new"}
      onEdit={(id) => window.location.href = `/admin/teaching_resources/${id}/edit`}
    />
  );
}
