"use client";

import { FeatureForm } from "@/components/unified";
import { TransportRouteFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewTransportRoutePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/transport_routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/transport_routes`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New TransportRoute</h1>
      <FeatureForm
        schema={TransportRouteFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
