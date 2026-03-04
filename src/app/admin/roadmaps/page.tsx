"use client";

import { FeatureListPage } from "@/components/unified";
import { RoadmapFeature } from "@/features";

export default function RoadmapsPage() {
  return (
    <FeatureListPage
      feature={RoadmapFeature}
      title="Roadmaps"
      onCreate={() => window.location.href = "/admin/roadmaps/new"}
      onEdit={(id) => window.location.href = `/admin/roadmaps/${id}/edit`}
    />
  );
}
