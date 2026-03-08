"use client";

import { FeatureForm } from "@/components/unified";
import { PlanFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewPlanPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/plans`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Plan</h1>
      <FeatureForm
        schema={PlanFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
