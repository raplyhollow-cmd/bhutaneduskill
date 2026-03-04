"use client";

import { FeatureListPage } from "@/components/unified";
import { LibraryFineFeature } from "@/features";

export default function LibraryFinesPage() {
  return (
    <FeatureListPage
      feature={LibraryFineFeature}
      title="LibraryFines"
      onCreate={() => window.location.href = "/admin/library_fines/new"}
      onEdit={(id) => window.location.href = `/admin/library_fines/${id}/edit`}
    />
  );
}
