"use client";

import { FeatureForm } from "@/components/unified";
import { FeeFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewFeePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/fees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/fees`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Fee</h1>
      <FeatureForm
        schema={FeeFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
