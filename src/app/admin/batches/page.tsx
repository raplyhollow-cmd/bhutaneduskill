"use client";

import { FeatureListPage } from "@/components/unified";
import { BatcheFeature } from "@/features";

export default function BatchesPage() {
  return (
    <FeatureListPage
      feature={BatcheFeature}
      title="Batches"
      onCreate={() => window.location.href = "/admin/batches/new"}
      onEdit={(id) => window.location.href = `/admin/batches/${id}/edit`}
    />
  );
}
