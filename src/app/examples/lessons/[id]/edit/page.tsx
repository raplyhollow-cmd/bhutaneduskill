/**
 * LESSON EDIT PAGE - EXAMPLE
 *
 * Demonstrates how to use the unified FeatureForm component
 * for creating/editing records.
 */

"use client";

import { FeatureForm } from "@/components/unified";
import { LessonFeature } from "@/features/lessons.feature";
import { useRouter, useParams } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

export default function EditLessonPage() {
  const router = useRouter();
  const params = useParams();
  const lessonId = params.id as string;
  const { success, error } = useToast();

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/resources/lessons/${lessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update lesson");
      }

      success({ title: "Lesson updated successfully" });
      router.push(`/examples/lessons/${lessonId}`);
    } catch (err) {
      error({ title: "Failed to update lesson" });
      throw err;
    }
  };

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      {/* Back button */}
      <div className="mb-4">
        <Link href={`/examples/lessons/${lessonId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Lesson
          </Button>
        </Link>
      </div>

      <FeatureForm
        schema={LessonFeature.config.schema}
        mode="edit"
        title="Edit Lesson"
        description="Update lesson plan details"
        submitLabel="Save Changes"
        cancelLabel="Cancel"
        onSubmit={handleSubmit}
        onCancel={() => router.push(`/examples/lessons/${lessonId}`)}
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
