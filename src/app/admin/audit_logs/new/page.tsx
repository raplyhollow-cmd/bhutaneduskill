"use client";

import { FeatureForm } from "@/components/unified";
import { AuditLogFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewAuditLogPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/audit_logs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/audit_logs`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New AuditLog</h1>
      <FeatureForm
        schema={AuditLogFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
