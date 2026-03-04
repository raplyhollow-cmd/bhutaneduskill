"use client";

import { FeatureForm } from "@/components/unified";
import { WorkforceDataFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewWorkforceDataPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/workforce_data`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/workforce_data`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New WorkforceData</h1>
      <FeatureForm
        schema={WorkforceDataFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
