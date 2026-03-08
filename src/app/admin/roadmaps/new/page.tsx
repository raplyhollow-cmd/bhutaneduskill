"use client";

import { FeatureForm } from "@/components/unified";
import { RoadmapFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewRoadmapPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/roadmaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/roadmaps`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Roadmap</h1>
      <FeatureForm
        schema={RoadmapFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
