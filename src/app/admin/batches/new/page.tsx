"use client";

import { FeatureForm } from "@/components/unified";
import { BatcheFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewBatchePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/batches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/batches`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Batche</h1>
      <FeatureForm
        schema={BatcheFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
