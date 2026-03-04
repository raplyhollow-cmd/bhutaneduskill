"use client";

import { FeatureListPage } from "@/components/unified";
import { AppointmentFeature } from "@/features";

export default function AppointmentsPage() {
  return (
    <FeatureListPage
      feature={AppointmentFeature}
      title="Appointments"
      onCreate={() => window.location.href = "/admin/appointments/new"}
      onEdit={(id) => window.location.href = `/admin/appointments/${id}/edit`}
    />
  );
}
