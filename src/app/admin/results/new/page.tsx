"use client";

import { FeatureForm } from "@/components/unified";
import { ResultFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewResultPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/results`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/results`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Result</h1>
      <FeatureForm
        schema={ResultFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
