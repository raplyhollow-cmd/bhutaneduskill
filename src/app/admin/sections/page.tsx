"use client";

import { FeatureListPage } from "@/components/unified";
import { SectionFeature } from "@/features";

export default function SectionsPage() {
  return (
    <FeatureListPage
      feature={SectionFeature}
      title="Sections"
      onCreate={() => window.location.href = "/admin/sections/new"}
      onEdit={(id) => window.location.href = `/admin/sections/${id}/edit`}
    />
  );
}
