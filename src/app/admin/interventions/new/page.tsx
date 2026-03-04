"use client";

import { FeatureForm } from "@/components/unified";
import { InterventionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewInterventionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/interventions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/interventions`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Intervention</h1>
      <FeatureForm
        schema={InterventionFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
