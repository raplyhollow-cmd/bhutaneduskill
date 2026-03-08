"use client";

import { FeatureForm } from "@/components/unified";
import { GnhIndicatorFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewGnhIndicatorPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/gnh_indicators`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/gnh_indicators`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New GnhIndicator</h1>
      <FeatureForm
        schema={GnhIndicatorFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
