"use client";

import { FeatureListPage } from "@/components/unified";
import { TransportAllocationFeature } from "@/features";

export default function TransportAllocationsPage() {
  return (
    <FeatureListPage
      feature={TransportAllocationFeature}
      title="TransportAllocations"
      onCreate={() => window.location.href = "/admin/transport_allocations/new"}
      onEdit={(id) => window.location.href = `/admin/transport_allocations/${id}/edit`}
    />
  );
}
