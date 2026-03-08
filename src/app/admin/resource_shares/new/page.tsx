"use client";

import { FeatureForm } from "@/components/unified";
import { ResourceShareFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewResourceSharePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/resource_shares`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/resource_shares`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New ResourceShare</h1>
      <FeatureForm
        schema={ResourceShareFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
