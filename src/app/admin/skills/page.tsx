"use client";

import { FeatureListPage } from "@/components/unified";
import { SkillFeature } from "@/features";

export default function SkillsPage() {
  return (
    <FeatureListPage
      feature={SkillFeature}
      title="Skills"
      onCreate={() => window.location.href = "/admin/skills/new"}
      onEdit={(id) => window.location.href = `/admin/skills/${id}/edit`}
    />
  );
}
