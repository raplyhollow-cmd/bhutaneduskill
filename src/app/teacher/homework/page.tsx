"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER HOMEWORK PAGE
 * Create and manage homework assignments
 * Quick add homework with ExpressAddModal
 */

import { useState, useEffect, useCallback } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { HomeworkCreator, type HomeworkData } from "@/components/homework";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExpressAddModal, useExpressAdd } from "@/components/ui/express-add-modal";
import { Plus, Eye, Edit, Trash2, FileText, Loader2, Sparkles, BookOpen } from "lucide-react";

interface StoredHomework {
  id: string;
  title: string;
  description?: string;
  subject?: string;
  subjectId?: string;
  classId: string;
  dueDate: string;
  maxPoints?: number;
  totalPoints?: number;
  questions: unknown[];
  isPublished: boolean;
  type?: string;
  class?: {
    id: string;
    name: string;
  };
}

export default function TeacherHomeworkPage() {
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [homeworkList, setHomeworkList] = useState<StoredHomework[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<StoredHomework | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ExpressAddModal hook for quick homework add
  const quickAdd = useExpressAdd();

  // Show notification
  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // Quick add homework handler - creates basic homework
  const handleQuickAddHomework = async (title: string): Promise<{ success: true; data?: unknown } | { success: false; error: string }> => {
    try {
      const response = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: "Homework assignment - details to be added",
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // 1 week from now
          maxPoints: 100,
          questions: [],
          isPublished: false,
        }),
      });

      if (response.ok) {
        await fetchHomework();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { success: false, error: (errorData.error as string) || "Failed to create homework" };
      }
    } catch (error: unknown) {
      logger.error("Failed to create quick homework:", error);
      return { success: false, error: "Network error. Please try again." };
    }
  };

  // Fetch homework assignments
  const fetchHomework = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/teacher/homework");
      if (response.ok) {
        const result = await response.json();
        setHomeworkList(result.homework || []);
      }
    } catch (error) {
      logger.error("Failed to fetch homework:", error);
      showNotification("error", "Failed to load homework assignments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHomework();
  }, [fetchHomework]);

  const handleSave = async (homework: HomeworkData) => {
    setSubmitting(true);
    try {
      const response = await fetch("/api/teacher/homework", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(homework),
      });

      if (response.ok) {
        const result = await response.json();
        showNotification("success", "Homework created successfully");
        await fetchHomework();
        setView("list");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Failed to create homework");
      }
    } catch (error: unknown) {
      logger.error("Failed to save homework:", error);
      showNotification("error", error instanceof Error ? error instanceof Error ? error.message : String(error) : "Failed to create homework");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (homeworkId: string) => {
    if (!confirm("Are you sure you want to delete this homework?")) return;

    try {
      const response = await fetch(`/api/teacher/homework/${homeworkId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showNotification("success", "Homework deleted successfully");
        await fetchHomework();
      } else {
        throw new Error("Failed to delete homework");
      }
    } catch (error: unknown) {
      logger.error("Failed to delete homework:", error);
      showNotification("error", error instanceof Error ? error instanceof Error ? error.message : String(error) : "Failed to delete homework");
    }
  };

  const handlePublish = async (homeworkId: string) => {
    try {
      const response = await fetch(`/api/teacher/homework/${homeworkId}/publish`, {
        method: "POST",
      });

      if (response.ok) {
        showNotification("success", "Homework published successfully");
        await fetchHomework();
      } else {
        throw new Error("Failed to publish homework");
      }
    } catch (error: unknown) {
      logger.error("Failed to publish homework:", error);
      showNotification("error", error instanceof Error ? error instanceof Error ? error.message : String(error) : "Failed to publish homework");
    }
  };

  if (view === "create") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title="Create Homework" />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setView("list")} disabled={submitting}>
              ← Back to Homework List
            </Button>
          </div>
          <HomeworkCreator onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="teacher" userName="Teacher" title="Homework Management" />

      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
        }`}>
          {notification.type === "success" ? "✓" : "✕"} {notification.message}
        </div>
      )}

      <div className="lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-muted-foreground">Create and manage homework assignments</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={quickAdd.open} disabled={loading}>
              <Sparkles className="w-4 h-4 mr-2" />
              Quick Add
            </Button>
            <Button onClick={() => setView("create")} disabled={loading}>
              <Plus className="w-4 h-4 mr-2" />
              Create Homework
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="ml-3">Loading homework...</span>
          </div>
        ) : homeworkList.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No homework assignments yet</h3>
              <p className="text-muted-foreground mb-4">Create your first homework assignment to get started</p>
              <Button onClick={() => setView("create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Homework
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {homeworkList.map((hw) => (
              <Card key={hw.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{hw.title}</h3>
                        <p className="text-sm text-muted-foreground">{hw.subject || hw.class?.name || "General"}</p>
                      </div>
                    </div>
                    <Badge variant={hw.isPublished ? "default" : "secondary"}>
                      {hw.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <p className="text-sm mt-2">Due: {hw.dueDate ? new Date(hw.dueDate).toLocaleDateString() : "Not set"}</p>
                  <p className="text-sm text-muted-foreground">
                    {hw.maxPoints || hw.totalPoints || 0} points • {hw.questions?.length || 0} questions
                  </p>

                  <div className="flex gap-2 mt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    {!hw.isPublished && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePublish(hw.id)}
                      >
                        Publish
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(hw.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Quick Add Homework Modal */}
        <ExpressAddModal
          isOpen={quickAdd.isOpen}
          onClose={quickAdd.close}
          onSubmit={handleQuickAddHomework}
          title="Quick Add Homework"
          description="Enter homework title (defaults to 1 week due date)"
          placeholder="e.g., Math Chapter 5 Exercises"
          successMessage="Homework created successfully! You can edit details later."
          errorMessage="Failed to create homework. Please try again."
          icon={BookOpen}
          minLength={3}
          submitLabel="Press Enter to create homework"
        />
      </div>
    </div>
  );
}
