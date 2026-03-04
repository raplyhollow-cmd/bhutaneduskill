"use client";

import { FeatureListPage } from "@/components/unified";
import { DepartmentFeature } from "@/features";

export default function DepartmentsPage() {
  return (
    <FeatureListPage
      feature={DepartmentFeature}
      title="Departments"
      onCreate={() => window.location.href = "/admin/departments/new"}
      onEdit={(id) => window.location.href = `/admin/departments/${id}/edit`}
    />
  );
}
