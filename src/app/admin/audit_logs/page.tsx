"use client";

import { FeatureListPage } from "@/components/unified";
import { AuditLogFeature } from "@/features";

export default function AuditLogsPage() {
  return (
    <FeatureListPage
      feature={AuditLogFeature}
      title="AuditLogs"
      onCreate={() => window.location.href = "/admin/audit_logs/new"}
      onEdit={(id) => window.location.href = `/admin/audit_logs/${id}/edit`}
    />
  );
}
