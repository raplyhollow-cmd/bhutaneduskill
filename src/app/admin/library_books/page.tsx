"use client";

import { FeatureListPage } from "@/components/unified";
import { LibraryBookFeature } from "@/features";

export default function LibraryBooksPage() {
  return (
    <FeatureListPage
      feature={LibraryBookFeature}
      title="LibraryBooks"
      onCreate={() => window.location.href = "/admin/library_books/new"}
      onEdit={(id) => window.location.href = `/admin/library_books/${id}/edit`}
    />
  );
}
