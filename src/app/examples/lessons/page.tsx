/**
 * LESSONS LIST PAGE - EXAMPLE
 *
 * Demonstrates how to use the unified FeatureListPage component
 * for a complete list page with minimal code.
 */

"use client";

import { FeatureListPage } from "@/components/unified";
import { LessonFeature } from "@/features/lessons.feature";
import { useToast } from "@/components/ui/toast";
import { useRouter } from "next/navigation";

export default function LessonsPage() {
  const router = useRouter();
  const { success } = useToast();

  return (
    <div className="container mx-auto py-6">
      <FeatureListPage
        feature={LessonFeature}
        title="Lessons"
        description="Manage lesson plans and schedules"
        showCreate={true}
        showExport={true}
        showRefresh={true}
        onCreate={() => router.push("/examples/lessons/new")}
        onEdit={(id) => router.push(`/examples/lessons/${id}/edit`)}
        onView={(id) => router.push(`/examples/lessons/${id}`)}
        filters={[
          {
            key: "classId",
            label: "Class",
            type: "select",
            options: [
              { label: "Class 10A", value: "class-10a" },
              { label: "Class 10B", value: "class-10b" },
              { label: "Class 11A", value: "class-11a" },
            ],
          },
          {
            key: "status",
            label: "Status",
            type: "select",
            options: [
              { label: "Scheduled", value: "scheduled" },
              { label: "Completed", value: "completed" },
              { label: "Cancelled", value: "cancelled" },
            ],
          },
        ]}
        onDelete={async (id) => {
          // Custom delete handler
          const response = await fetch(`/api/resources/lessons/${id}`, {
            method: "DELETE",
          });
          if (!response.ok) throw new Error("Failed to delete");
          success({ title: "Lesson deleted successfully" });
        }}
      />
    </div>
  );
}
