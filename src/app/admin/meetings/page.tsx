"use client";

import { FeatureListPage } from "@/components/unified";
import { MeetingFeature } from "@/features";

export default function MeetingsPage() {
  return (
    <FeatureListPage
      feature={MeetingFeature}
      title="Meetings"
      onCreate={() => window.location.href = "/admin/meetings/new"}
      onEdit={(id) => window.location.href = `/admin/meetings/${id}/edit`}
    />
  );
}
