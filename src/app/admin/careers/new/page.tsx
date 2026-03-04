"use client";

import { FeatureForm } from "@/components/unified";
import { CareerFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewCareerPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/careers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/careers`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Career</h1>
      <FeatureForm
        schema={CareerFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
