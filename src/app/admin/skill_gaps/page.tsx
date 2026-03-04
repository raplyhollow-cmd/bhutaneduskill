"use client";

import { FeatureListPage } from "@/components/unified";
import { SkillGapFeature } from "@/features";

export default function SkillGapsPage() {
  return (
    <FeatureListPage
      feature={SkillGapFeature}
      title="SkillGaps"
      onCreate={() => window.location.href = "/admin/skill_gaps/new"}
      onEdit={(id) => window.location.href = `/admin/skill_gaps/${id}/edit`}
    />
  );
}
