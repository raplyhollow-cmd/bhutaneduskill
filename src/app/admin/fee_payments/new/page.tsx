"use client";

import { FeatureForm } from "@/components/unified";
import { FeePaymentFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewFeePaymentPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/fee_payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/fee_payments`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New FeePayment</h1>
      <FeatureForm
        schema={FeePaymentFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
