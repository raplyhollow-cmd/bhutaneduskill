"use client";

import { FeatureForm } from "@/components/unified";
import { ClassFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewClassPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/classes`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Class</h1>
      <FeatureForm
        schema={ClassFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
