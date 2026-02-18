"use client";

import { logger } from "@/lib/logger";
/**
 * TEACHER LEARNING MODULES PAGE
 * Create and manage learning modules
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { ModuleCreator, type LearningModule as ModuleCreatorData } from "@/components/learning";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  Users,
  Clock,
  MoreVertical,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// ============================================================================
// TYPES
// ============================================================================

interface LearningModule {
  id: string;
  title: string;
  description: string;
  subjectId: string | null;
  category: string;
  level: string;
  duration: number;
  thumbnail: string;
  isPublished: boolean;
  isPublic: boolean;
  isPremium: boolean;
  price: number;
  createdAt: string;
  updatedAt: string;
  lessonsCount: number;
  enrollmentCount: number;
  completedCount: number;
  subject?: {
    id: string;
    name: string;
  };
}

interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: unknown;
}

// ============================================================================
// COMPONENTS
// ============================================================================

interface ModuleCardProps {
  module: LearningModule;
  onEdit: (module: LearningModule) => void;
  onDelete: (moduleId: string) => void;
  onPublish: (moduleId: string) => void;
  onUnpublish: (moduleId: string) => void;
  onDuplicate: (moduleId: string) => void;
  onView: (moduleId: string) => void;
}

function ModuleCard({
  module,
  onEdit,
  onDelete,
  onPublish,
  onUnpublish,
  onDuplicate,
  onView,
}: ModuleCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    onDelete(module.id);
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={module.isPublished ? "default" : "secondary"}>
              {module.isPublished ? "Published" : "Draft"}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {module.level}
            </Badge>
          </div>
        </div>

        <h3 className="font-semibold text-lg mb-1">{module.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
          {module.description}
        </p>

        <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <BookOpen className="w-4 h-4" />
            {module.lessonsCount} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.round(module.duration / 60)}h
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-4 h-4" />
            {module.enrollmentCount}
          </span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => onView(module.id)}
          >
            <Eye className="w-4 h-4 mr-1" />
            View
          </Button>
          <Button variant="outline" size="sm" onClick={() => onEdit(module)}>
            <Edit className="w-4 h-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-xs">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {module.isPublished ? (
                <DropdownMenuItem onClick={() => onUnpublish(module.id)}>
                  Unpublish
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => onPublish(module.id)}>
                  Publish
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => onDuplicate(module.id)}>
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={isDeleting || module.enrollmentCount > 0}
                className="text-destructive"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {module.enrollmentCount > 0 && (
          <p className="text-xs text-muted-foreground mt-2">
            Cannot delete modules with active enrollments
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function TeacherLearningPage() {
  const router = useRouter();
  const [view, setView] = useState<"list" | "create" | "edit">("list");
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingModule, setEditingModule] = useState<LearningModule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; moduleId: string }>({
    isOpen: false,
    moduleId: "",
  });

  // Fetch modules on mount
  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/teacher/modules");

      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }

      const result: ApiResponse<{ modules: LearningModule[] }> = await response.json();

      if (result.data && result.data.modules) {
        setModules(result.data.modules);
      } else {
        throw new Error(result.error || "Failed to fetch modules");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      logger.error("Error fetching modules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (moduleData: ModuleCreatorData) => {
    try {
      setError(null);

      // Transform module data to API format
      const apiData = {
        title: moduleData.title,
        description: moduleData.description,
        subject: moduleData.subject,
        category: moduleData.category || "subject",
        level: moduleData.difficulty,
        duration: (moduleData.estimatedHours || 1) * 60, // Convert hours to minutes
        isPublished: moduleData.isPublished,
        content: {
          lessons: moduleData.lessons.map((lesson, idx) => ({
            ...lesson,
            order: idx,
          })),
        },
      };

      const url = view === "edit" && editingModule
        ? `/api/teacher/modules/${editingModule.id}`
        : "/api/teacher/modules";

      const method = view === "edit" && editingModule ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to save module");
        }
        throw new Error(`Failed to save module (${response.status})`);
      }

      // Refresh modules and go back to list
      await fetchModules();
      setView("list");
      setEditingModule(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save module");
      logger.error("Error saving module:", err);
      throw err;
    }
  };

  const handleEdit = (module: LearningModule) => {
    setEditingModule(module);
    setView("edit");
  };

  const handleDelete = async (moduleId: string) => {
    setDeleteDialog({ isOpen: true, moduleId });
  };

  const confirmDelete = async () => {
    try {
      setActionLoading(deleteDialog.moduleId);
      const response = await fetch(`/api/teacher/modules/${deleteDialog.moduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete module");
        }
        throw new Error(`Failed to delete module (${response.status})`);
      }

      setDeleteDialog({ isOpen: false, moduleId: "" });
      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete module");
      logger.error("Error deleting module:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePublish = async (moduleId: string) => {
    try {
      setActionLoading(moduleId);
      const response = await fetch(`/api/teacher/modules/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish" }),
      });

      if (!response.ok) {
        throw new Error("Failed to publish module");
      }

      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish module");
      logger.error("Error publishing module:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnpublish = async (moduleId: string) => {
    try {
      setActionLoading(moduleId);
      const response = await fetch(`/api/teacher/modules/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unpublish" }),
      });

      if (!response.ok) {
        throw new Error("Failed to unpublish module");
      }

      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unpublish module");
      logger.error("Error unpublishing module:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (moduleId: string) => {
    try {
      setActionLoading(moduleId);
      const response = await fetch(`/api/teacher/modules/${moduleId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "duplicate" }),
      });

      if (!response.ok) {
        throw new Error("Failed to duplicate module");
      }

      await fetchModules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate module");
      logger.error("Error duplicating module:", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (moduleId: string) => {
    router.push(`/teacher/learning/modules/${moduleId}`);
  };

  // Render module creator/editor
  if (view === "create" || view === "edit") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader
          userType="teacher"
          userName="Teacher"
          title={view === "edit" ? "Edit Learning Module" : "Create Learning Module"}
        />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button
              variant="outline"
              onClick={() => {
                setView("list");
                setEditingModule(null);
              }}
            >
              Back to Modules
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <ModuleCreator
            initialData={
              editingModule
                ? {
                    title: editingModule.title,
                    description: editingModule.description,
                    subject: editingModule.subject?.name || "",
                    classId: "",
                    category: editingModule.category,
                    difficulty: editingModule.level as "beginner" | "intermediate" | "advanced",
                    isPublished: editingModule.isPublished,
                    thumbnailUrl: editingModule.thumbnail,
                    estimatedHours: Math.round(editingModule.duration / 60),
                    lessons: [],
                  }
                : undefined
            }
            onSave={handleSave}
            onCancel={() => {
              setView("list");
              setEditingModule(null);
            }}
          />
        </div>
      </div>
    );
  }

  // Render module list
  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="teacher" userName="Teacher" title="Learning Modules" />
      <div className="lg:ml-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <p className="text-muted-foreground">Create and manage learning modules</p>
          <Button onClick={() => setView("create")}>
            <Plus className="w-4 h-4 mr-2" />
            Create Module
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : modules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first learning module to get started
              </p>
              <Button onClick={() => setView("create")}>
                <Plus className="w-4 h-4 mr-2" />
                Create Module
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onDuplicate={handleDuplicate}
                onView={handleView}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog({ isOpen: open, moduleId: "" })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Learning Module</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this learning module? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
