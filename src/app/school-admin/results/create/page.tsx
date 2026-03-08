/**
 * SCHOOL ADMIN - CREATE EXAM RESULT
 *
 * Form to add new exam results for students.
 * Uses the unified FeatureForm component with ResultFeature schema.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FeatureForm } from "@/components/unified/FeatureForm";
import { ResultFeature } from "@/features";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";

export default function CreateResultPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/resources/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create result");
      }

      // Success - navigate back
      router.push("/school-admin/results");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to create result");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/school-admin/results">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                  Create Exam Result
                </h1>
                <p className="text-gray-600 mt-1">Add new exam results for students</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {submitError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {submitError}
          </div>
        )}

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 px-8 py-6">
              <h2 className="text-xl font-semibold text-white flex items-center gap-3">
                <Save className="w-5 h-5" />
                Result Details
              </h2>
            </div>
            <div className="p-8">
              {isSubmitting ? (
                <div className="flex items-center justify-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-violet-200 border-t-violet-600 mr-3"></div>
                  <span className="text-gray-600">Creating result...</span>
                </div>
              ) : (
                <FeatureForm
                  schema={ResultFeature.config.schema as any}
                  mode="create"
                  onSubmit={handleSubmit}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
