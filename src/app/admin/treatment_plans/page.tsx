"use client";

import { FeatureListPage } from "@/components/unified";
import { TreatmentPlanFeature } from "@/features";

export default function TreatmentPlansPage() {
  return (
    <FeatureListPage
      feature={TreatmentPlanFeature}
      title="TreatmentPlans"
      onCreate={() => window.location.href = "/admin/treatment_plans/new"}
      onEdit={(id) => window.location.href = `/admin/treatment_plans/${id}/edit`}
    />
  );
}
