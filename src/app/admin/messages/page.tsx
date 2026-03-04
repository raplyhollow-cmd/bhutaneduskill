"use client";

import { FeatureListPage } from "@/components/unified";
import { MessageFeature } from "@/features";

export default function MessagesPage() {
  return (
    <FeatureListPage
      feature={MessageFeature}
      title="Messages"
      onCreate={() => window.location.href = "/admin/messages/new"}
      onEdit={(id) => window.location.href = `/admin/messages/${id}/edit`}
    />
  );
}
