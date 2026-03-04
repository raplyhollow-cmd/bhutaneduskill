"use client";

import { FeatureListPage } from "@/components/unified";
import { InvoiceFeature } from "@/features";

export default function InvoicesPage() {
  return (
    <FeatureListPage
      feature={InvoiceFeature}
      title="Invoices"
      onCreate={() => window.location.href = "/admin/invoices/new"}
      onEdit={(id) => window.location.href = `/admin/invoices/${id}/edit`}
    />
  );
}
