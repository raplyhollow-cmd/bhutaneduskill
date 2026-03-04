"use client";

import { FeatureForm } from "@/components/unified";
import { SectionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSectionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/sections`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Section</h1>
      <FeatureForm
        schema={SectionFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
