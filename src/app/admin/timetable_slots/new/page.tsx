"use client";

import { FeatureForm } from "@/components/unified";
import { TimetableSlotFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewTimetableSlotPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/timetable_slots`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/timetable_slots`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New TimetableSlot</h1>
      <FeatureForm
        schema={TimetableSlotFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
