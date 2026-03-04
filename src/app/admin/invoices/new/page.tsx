"use client";

import { FeatureForm } from "@/components/unified";
import { InvoiceFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewInvoicePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/invoices`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Invoice</h1>
      <FeatureForm
        schema={InvoiceFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
