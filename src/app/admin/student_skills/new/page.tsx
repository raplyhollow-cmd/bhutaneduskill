"use client";

import { FeatureForm } from "@/components/unified";
import { StudentSkillFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewStudentSkillPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/student_skills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/student_skills`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New StudentSkill</h1>
      <FeatureForm
        schema={StudentSkillFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
