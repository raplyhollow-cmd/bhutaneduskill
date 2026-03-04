"use client";

import { FeatureListPage } from "@/components/unified";
import { AttendanceFeature } from "@/features";

export default function AttendancePage() {
  return (
    <FeatureListPage
      feature={AttendanceFeature}
      title="Attendance"
      onCreate={() => window.location.href = "/admin/attendance/new"}
      onEdit={(id) => window.location.href = `/admin/attendance/${id}/edit`}
    />
  );
}
