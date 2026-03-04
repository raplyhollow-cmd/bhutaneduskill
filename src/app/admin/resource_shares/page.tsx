"use client";

import { FeatureListPage } from "@/components/unified";
import { ResourceShareFeature } from "@/features";

export default function ResourceSharesPage() {
  return (
    <FeatureListPage
      feature={ResourceShareFeature}
      title="ResourceShares"
      onCreate={() => window.location.href = "/admin/resource_shares/new"}
      onEdit={(id) => window.location.href = `/admin/resource_shares/${id}/edit`}
    />
  );
}
