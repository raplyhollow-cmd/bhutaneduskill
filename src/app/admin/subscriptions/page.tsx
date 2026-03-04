"use client";

import { FeatureListPage } from "@/components/unified";
import { SubscriptionFeature } from "@/features";

export default function SubscriptionsPage() {
  return (
    <FeatureListPage
      feature={SubscriptionFeature}
      title="Subscriptions"
      onCreate={() => window.location.href = "/admin/subscriptions/new"}
      onEdit={(id) => window.location.href = `/admin/subscriptions/${id}/edit`}
    />
  );
}
