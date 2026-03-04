"use client";

import { FeatureListPage } from "@/components/unified";
import { SessionFeature } from "@/features";

export default function SessionsPage() {
  return (
    <FeatureListPage
      feature={SessionFeature}
      title="Sessions"
      onCreate={() => window.location.href = "/admin/sessions/new"}
      onEdit={(id) => window.location.href = `/admin/sessions/${id}/edit`}
    />
  );
}
