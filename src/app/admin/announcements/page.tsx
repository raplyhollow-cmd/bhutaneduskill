"use client";

import { FeatureListPage } from "@/components/unified";
import { AnnouncementFeature } from "@/features";

export default function AnnouncementsPage() {
  return (
    <FeatureListPage
      feature={AnnouncementFeature}
      title="Announcements"
      onCreate={() => window.location.href = "/admin/announcements/new"}
      onEdit={(id) => window.location.href = `/admin/announcements/${id}/edit`}
    />
  );
}
