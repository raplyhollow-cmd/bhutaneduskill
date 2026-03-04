"use client";

import { FeatureListPage } from "@/components/unified";
import { WorkforceDataFeature } from "@/features";

export default function WorkforceDataPage() {
  return (
    <FeatureListPage
      feature={WorkforceDataFeature}
      title="WorkforceData"
      onCreate={() => window.location.href = "/admin/workforce_data/new"}
      onEdit={(id) => window.location.href = `/admin/workforce_data/${id}/edit`}
    />
  );
}
