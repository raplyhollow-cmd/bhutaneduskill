"use client";

import { FeatureListPage } from "@/components/unified";
import { GnhIndicatorFeature } from "@/features";

export default function GnhIndicatorsPage() {
  return (
    <FeatureListPage
      feature={GnhIndicatorFeature}
      title="GnhIndicators"
      onCreate={() => window.location.href = "/admin/gnh_indicators/new"}
      onEdit={(id) => window.location.href = `/admin/gnh_indicators/${id}/edit`}
    />
  );
}
