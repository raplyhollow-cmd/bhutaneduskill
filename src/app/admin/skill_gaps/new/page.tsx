"use client";

import { FeatureForm } from "@/components/unified";
import { SkillGapFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSkillGapPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/skill_gaps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/skill_gaps`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New SkillGap</h1>
      <FeatureForm
        schema={SkillGapFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
