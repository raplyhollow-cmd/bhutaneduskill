"use client";

import { FeatureForm } from "@/components/unified";
import { ScheduleExceptionFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewScheduleExceptionPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/schedule_exceptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/schedule_exceptions`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New ScheduleException</h1>
      <FeatureForm
        schema={ScheduleExceptionFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
