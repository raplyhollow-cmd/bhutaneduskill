"use client";

import { FeatureListPage } from "@/components/unified";
import { TransportFeature } from "@/features";

export default function TransportPage() {
  return (
    <FeatureListPage
      feature={TransportFeature}
      title="Transport"
      onCreate={() => window.location.href = "/admin/transport/new"}
      onEdit={(id) => window.location.href = `/admin/transport/${id}/edit`}
    />
  );
}
