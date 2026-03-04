"use client";

import { FeatureListPage } from "@/components/unified";
import { PlanFeature } from "@/features";

export default function PlansPage() {
  return (
    <FeatureListPage
      feature={PlanFeature}
      title="Plans"
      onCreate={() => window.location.href = "/admin/plans/new"}
      onEdit={(id) => window.location.href = `/admin/plans/${id}/edit`}
    />
  );
}
