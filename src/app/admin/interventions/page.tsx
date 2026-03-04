"use client";

import { FeatureListPage } from "@/components/unified";
import { InterventionFeature } from "@/features";

export default function InterventionsPage() {
  return (
    <FeatureListPage
      feature={InterventionFeature}
      title="Interventions"
      onCreate={() => window.location.href = "/admin/interventions/new"}
      onEdit={(id) => window.location.href = `/admin/interventions/${id}/edit`}
    />
  );
}
