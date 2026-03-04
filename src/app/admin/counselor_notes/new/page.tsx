"use client";

import { FeatureForm } from "@/components/unified";
import { CounselorNoteFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewCounselorNotePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/counselor_notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/counselor_notes`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New CounselorNote</h1>
      <FeatureForm
        schema={CounselorNoteFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
