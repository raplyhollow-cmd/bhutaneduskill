"use client";

import { FeatureForm } from "@/components/unified";
import { BehaviorRecordFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewBehaviorRecordPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/behavior_records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/behavior_records`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New BehaviorRecord</h1>
      <FeatureForm
        schema={BehaviorRecordFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
