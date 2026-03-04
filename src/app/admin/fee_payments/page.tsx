"use client";

import { FeatureListPage } from "@/components/unified";
import { FeePaymentFeature } from "@/features";

export default function FeePaymentsPage() {
  return (
    <FeatureListPage
      feature={FeePaymentFeature}
      title="FeePayments"
      onCreate={() => window.location.href = "/admin/fee_payments/new"}
      onEdit={(id) => window.location.href = `/admin/fee_payments/${id}/edit`}
    />
  );
}
