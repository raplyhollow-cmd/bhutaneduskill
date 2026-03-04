"use client";

import { FeatureForm } from "@/components/unified";
import { SessionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSessionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/sessions`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Session</h1>
      <FeatureForm
        schema={SessionFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
