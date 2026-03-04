"use client";

import { FeatureForm } from "@/components/unified";
import { TeacherFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewTeacherPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/teachers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/teachers`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Teacher</h1>
      <FeatureForm
        schema={TeacherFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
