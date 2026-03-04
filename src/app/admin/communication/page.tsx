"use client";

import { FeatureListPage } from "@/components/unified";
import { CommunicationFeature } from "@/features";

export default function CommunicationPage() {
  return (
    <FeatureListPage
      feature={CommunicationFeature}
      title="Communication"
      onCreate={() => window.location.href = "/admin/communication/new"}
      onEdit={(id) => window.location.href = `/admin/communication/${id}/edit`}
    />
  );
}
