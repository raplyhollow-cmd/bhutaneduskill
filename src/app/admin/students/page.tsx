"use client";

import { FeatureListPage } from "@/components/unified";
import { StudentFeature } from "@/features";

export default function StudentsPage() {
  return (
    <FeatureListPage
      feature={StudentFeature}
      title="Students"
      onCreate={() => window.location.href = "/admin/students/new"}
      onEdit={(id) => window.location.href = `/admin/students/${id}/edit`}
    />
  );
}
