/**
 * NEW LESSON PAGE - EXAMPLE
 *
 * Demonstrates creating a new record using FeatureForm.
 */

"use client";

import { FeatureForm } from "@/components/unified";
import { LessonFeature } from "@/features";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function NewLessonPage() {
  const router = useRouter();
  const { success, error } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch("/api/resources/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create lesson");
      }

      const result = await response.json();
      success({ title: "Lesson created successfully" });
      router.push(`/examples/lessons/${result.data.id}`);
    } catch (err) {
      error({ title: "Failed to create lesson" });
      throw err;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      {/* Back button */}
      <div className="mb-4">
        <Link href="/examples/lessons">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lessons
          </Button>
        </Link>
      </div>

      <FeatureForm
        schema={LessonFeature.config.schema}
        mode="create"
        title="Create New Lesson"
        description="Fill in the details to create a new lesson plan"
        submitLabel="Create Lesson"
        cancelLabel="Cancel"
        onSubmit={handleSubmit}
        onCancel={() => router.push("/examples/lessons")}
        referenceData={{
          classId: [
            { id: "class-10a", name: "Class 10A" },
            { id: "class-10b", name: "Class 10B" },
            { id: "class-11a", name: "Class 11A" },
          ],
          subjectId: [
            { id: "math", name: "Mathematics" },
            { id: "science", name: "Science" },
            { id: "english", name: "English" },
          ],
          teacherId: [
            { id: "teacher-1", name: "Mr. Dorji" },
            { id: "teacher-2", name: "Ms. Wangmo" },
          ],
        }}
      />
    </div>
  );
}
