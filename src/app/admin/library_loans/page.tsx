"use client";

import { FeatureListPage } from "@/components/unified";
import { LibraryLoanFeature } from "@/features";

export default function LibraryLoansPage() {
  return (
    <FeatureListPage
      feature={LibraryLoanFeature}
      title="LibraryLoans"
      onCreate={() => window.location.href = "/admin/library_loans/new"}
      onEdit={(id) => window.location.href = `/admin/library_loans/${id}/edit`}
    />
  );
}
