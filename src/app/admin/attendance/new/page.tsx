"use client";

import { FeatureForm } from "@/components/unified";
import { AttendanceFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewAttendancePage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/attendance`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New Attendance</h1>
      <FeatureForm
        schema={AttendanceFeature.config.schema as any}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
