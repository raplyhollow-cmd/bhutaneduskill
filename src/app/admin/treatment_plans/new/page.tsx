"use client";

import { FeatureForm } from "@/components/unified";
import { TreatmentPlanFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewTreatmentPlanPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/treatment_plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/treatment_plans`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New TreatmentPlan</h1>
      <FeatureForm
        schema={TreatmentPlanFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
