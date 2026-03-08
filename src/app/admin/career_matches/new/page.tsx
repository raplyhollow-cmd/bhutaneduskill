"use client";

import { FeatureForm } from "@/components/unified";
import { CareerMatcheFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewCareerMatchePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/career_matches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/career_matches`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New CareerMatche</h1>
      <FeatureForm
        schema={CareerMatcheFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
