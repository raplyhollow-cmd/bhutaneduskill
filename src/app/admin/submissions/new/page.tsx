"use client";

import { FeatureForm } from "@/components/unified";
import { SubmissionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSubmissionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/submissions`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Submission</h1>
      <FeatureForm
        schema={SubmissionFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
