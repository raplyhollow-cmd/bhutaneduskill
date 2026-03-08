"use client";

import { FeatureForm } from "@/components/unified";
import { LessonFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewLessonPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/lessons`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Lesson</h1>
      <FeatureForm
        schema={LessonFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
