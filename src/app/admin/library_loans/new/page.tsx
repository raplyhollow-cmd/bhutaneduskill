"use client";

import { FeatureForm } from "@/components/unified";
import { LibraryLoanFeature } from "@/features";
import { useRouter } from "next/navigation";

export default function NewLibraryLoanPage() {
  const router = useRouter();

  const handleSubmit = async (data: any) => {
    const response = await fetch(`/api/resources/library_loans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      router.push(`/admin/library_loans`);
      router.refresh();
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Create New LibraryLoan</h1>
      <FeatureForm
        schema={LibraryLoanFeature.schema}
        mode="create"
        onSubmit={handleSubmit}
      />
    </div>
  );
}
