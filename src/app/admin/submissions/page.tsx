"use client";

import { FeatureListPage } from "@/components/unified";
import { SubmissionFeature } from "@/features";

export default function SubmissionsPage() {
  return (
    <FeatureListPage
      feature={SubmissionFeature}
      title="Submissions"
      onCreate={() => window.location.href = "/admin/submissions/new"}
      onEdit={(id) => window.location.href = `/admin/submissions/${id}/edit`}
    />
  );
}
