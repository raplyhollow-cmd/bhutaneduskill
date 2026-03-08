"use client";

import { FeatureForm } from "@/components/unified";
import { SubscriptionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewSubscriptionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/subscriptions`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Subscription</h1>
      <FeatureForm
        schema={SubscriptionFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
