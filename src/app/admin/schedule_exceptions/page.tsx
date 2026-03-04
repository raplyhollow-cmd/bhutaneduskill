"use client";

import { FeatureListPage } from "@/components/unified";
import { ScheduleExceptionFeature } from "@/features";

export default function ScheduleExceptionsPage() {
  return (
    <FeatureListPage
      feature={ScheduleExceptionFeature}
      title="ScheduleExceptions"
      onCreate={() => window.location.href = "/admin/schedule_exceptions/new"}
      onEdit={(id) => window.location.href = `/admin/schedule_exceptions/${id}/edit`}
    />
  );
}
