"use client";

import { FeatureForm } from "@/components/unified";
import { MessageFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewMessagePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/messages`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Message</h1>
      <FeatureForm
        schema={MessageFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
