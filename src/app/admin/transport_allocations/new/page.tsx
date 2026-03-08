"use client";

import { FeatureForm } from "@/components/unified";
import { TransportAllocationFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewTransportAllocationPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/transport_allocations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/transport_allocations`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New TransportAllocation</h1>
      <FeatureForm
        schema={TransportAllocationFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
