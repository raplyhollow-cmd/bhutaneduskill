"use client";

import { FeatureListPage } from "@/components/unified";
import { BehaviorRecordFeature } from "@/features";

export default function BehaviorRecordsPage() {
  return (
    <FeatureListPage
      feature={BehaviorRecordFeature}
      title="BehaviorRecords"
      onCreate={() => window.location.href = "/admin/behavior_records/new"}
      onEdit={(id) => window.location.href = `/admin/behavior_records/${id}/edit`}
    />
  );
}
