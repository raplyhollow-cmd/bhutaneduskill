/**
 * TEACHER LEARNING MODULE CREATOR PAGE
 * Dedicated page for creating learning modules
 */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { ModuleCreator, type LearningModule } from "@/components/learning";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export default function TeacherLearningCreatePage() {
  const router = useRouter();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSave = async (module: LearningModule) => {
    try {
      // In production: API call to save module
      // const response = await fetch('/api/teacher/learning/modules', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(module)
      // });

      console.log("Saving module:", module);
      setShowSuccess(true);

      // Redirect after showing success message
      setTimeout(() => {
        router.push("/teacher/learning");
      }, 2000);
    } catch (error) {
      console.error("Failed to save module:", error);
      alert("Failed to save module. Please try again.");
    }
  };

  const handleCancel = () => {
    router.push("/teacher/learning");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        userType="teacher"
        userName="Teacher"
        title="Create Learning Module"
        subtitle="Build engaging learning experiences for your students"
      />

      <div className="lg:ml-64 p-6">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Modules
          </Button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <Card className="mb-6 border-green-200 bg-green-50">
            <CardContent className="py-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Module created successfully!</p>
                <p className="text-sm text-green-700">Redirecting to modules...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Module Creator */}
        <ModuleCreator onSave={handleSave} onCancel={handleCancel} />
      </div>
    </div>
  );
}
