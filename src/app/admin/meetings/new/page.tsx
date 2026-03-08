"use client";

import { FeatureForm } from "@/components/unified";
import { MeetingFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewMeetingPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/meetings`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Meeting</h1>
      <FeatureForm
        schema={MeetingFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
