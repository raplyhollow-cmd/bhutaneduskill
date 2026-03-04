"use client";

import { FeatureListPage } from "@/components/unified";
import { LessonFeature } from "@/features";

export default function LessonsPage() {
  return (
    <FeatureListPage
      feature={LessonFeature}
      title="Lessons"
      onCreate={() => window.location.href = "/admin/lessons/new"}
      onEdit={(id) => window.location.href = `/admin/lessons/${id}/edit`}
    />
  );
}
