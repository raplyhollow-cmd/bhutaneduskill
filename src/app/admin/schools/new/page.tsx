"use client";

import { FeatureForm } from "@/components/unified";
import { SchoolFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSchoolPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/schools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/schools`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New School</h1>
      <FeatureForm
        schema={SchoolFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
