"use client";

import { FeatureForm } from "@/components/unified";
import { GradeFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewGradePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/grades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/grades`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Grade</h1>
      <FeatureForm
        schema={GradeFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
