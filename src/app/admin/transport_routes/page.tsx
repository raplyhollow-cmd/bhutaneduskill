"use client";

import { FeatureListPage } from "@/components/unified";
import { TransportRouteFeature } from "@/features";

export default function TransportRoutesPage() {
  return (
    <FeatureListPage
      feature={TransportRouteFeature}
      title="TransportRoutes"
      onCreate={() => window.location.href = "/admin/transport_routes/new"}
      onEdit={(id) => window.location.href = `/admin/transport_routes/${id}/edit`}
    />
  );
}
