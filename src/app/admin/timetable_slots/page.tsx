"use client";

import { FeatureListPage } from "@/components/unified";
import { TimetableSlotFeature } from "@/features";

export default function TimetableSlotsPage() {
  return (
    <FeatureListPage
      feature={TimetableSlotFeature}
      title="TimetableSlots"
      onCreate={() => window.location.href = "/admin/timetable_slots/new"}
      onEdit={(id) => window.location.href = `/admin/timetable_slots/${id}/edit`}
    />
  );
}
