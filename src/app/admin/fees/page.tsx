"use client";

import { FeatureListPage } from "@/components/unified";
import { FeeFeature } from "@/features";

export default function FeesPage() {
  return (
    <FeatureListPage
      feature={FeeFeature}
      title="Fees"
      onCreate={() => window.location.href = "/admin/fees/new"}
      onEdit={(id) => window.location.href = `/admin/fees/${id}/edit`}
    />
  );
}
