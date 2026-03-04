"use client";

import { FeatureListPage } from "@/components/unified";
import { StudentSkillFeature } from "@/features";

export default function StudentSkillsPage() {
  return (
    <FeatureListPage
      feature={StudentSkillFeature}
      title="StudentSkills"
      onCreate={() => window.location.href = "/admin/student_skills/new"}
      onEdit={(id) => window.location.href = `/admin/student_skills/${id}/edit`}
    />
  );
}
