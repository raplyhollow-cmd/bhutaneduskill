"use client";

import { logger } from "@/lib/logger";
/**
 * STUDENT LEARNING MODULES PAGE
 * Browse, enroll, and view learning modules
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ModuleViewer, type LearningModule as ViewerLearningModule } from "@/components/learning";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Filter,
  Clock,
  Users,
  Star,
  Play,
  Lock,
  CheckCircle,
  Award,
  Loader2,
  Video,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface ModuleContent {
  id: string;
  type: "text" | "video" | "image" | "document" | "quiz" | "assignment" | "link";
  title: string;
  content?: string;
  url?: string;
  fileUrl?: string;
  duration?: number;
  order: number;
}

interface ModuleLesson {
  id: string;
  title: string;
  description?: string;
  contents: ModuleContent[];
  order: number;
}

interface LearningModule {
  id: string;
  title: string;
  description: string;
  subject?: {
    id: string;
    name: string;
  };
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
  lessonsCount?: number;
  progress?: ModuleProgress | null;
  isEnrolled?: boolean;
}

interface ModuleProgress {
  id: string;
  status: string;
  isCompleted: boolean;
  progress: number;
  completedLessons: string[];
  currentLesson: string | null;
  timeSpent: number;
  lastAccessedAt: string;
  completedAt: string | null;
}

interface ModuleProgress {
  id: string;
  status: string;
  isCompleted: boolean;
  progress: number;
  completedLessons: string[];
  currentLesson: string | null;
  timeSpent: number;
  lastAccessedAt: string;
  completedAt: string | null;
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
  onView: (moduleId: string) => void;
  onEnroll: (moduleId: string) => Promise<void>;
  isEnrolling: boolean;
}

function ModuleCard({ module, onView, onEnroll, isEnrolling }: ModuleCardProps) {
  const levelColors = {
    beginner: "bg-green-100 text-green-700",
    intermediate: "bg-blue-100 text-blue-700",
    advanced: "bg-purple-100 text-purple-700",
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {module.subject && (
                <Badge variant="outline" className="text-xs">
                  {module.subject.name}
                </Badge>
              )}
              <Badge
                className={`text-xs capitalize ${
                  levelColors[module.level as keyof typeof levelColors] || levelColors.beginner
                }`}
              >
                {module.level}
              </Badge>
            </div>

            <h3 className="font-semibold text-lg truncate">{module.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {module.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Video className="w-4 h-4" />
            {module.lessonsCount || 0} lessons
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.round((module.duration || 0) / 60)}h
          </span>
        </div>

        {/* Progress Bar for enrolled modules */}
        {module.isEnrolled && module.progress && (
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium">{module.progress.progress}%</span>
            </div>
            <Progress value={module.progress.progress} />
          </div>
        )}

        {/* Status badges */}
        <div className="flex items-center gap-2 mb-4">
          {module.progress?.isCompleted ? (
            <Badge className="bg-green-100 text-green-700">
              <Award className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          ) : module.isEnrolled ? (
            <Badge variant="secondary">
              <Play className="w-3 h-3 mr-1" />
              In Progress
            </Badge>
          ) : module.isPremium ? (
            <Badge variant="outline">
              <Star className="w-3 h-3 mr-1 text-amber-500" />
              Premium
            </Badge>
          ) : (
            <Badge variant="outline">Free</Badge>
          )}
        </div>

        <div className="flex gap-2">
          {module.isEnrolled ? (
            <Button className="flex-1" onClick={() => onView(module.id)}>
              {module.progress?.isCompleted ? (
                <>
                  <Award className="w-4 h-4 mr-2" />
                  View Certificate
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Continue
                </>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1"
              onClick={() => onEnroll(module.id)}
              disabled={isEnrolling}
            >
              {isEnrolling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Enroll Now
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function StudentModulesPage() {
  const router = useRouter();
  const [view, setView] = useState<"browse" | "enrolled" | "viewer">("browse");
  const [selectedModule, setSelectedModule] = useState<ViewerLearningModule | null>(null);
  const [browseModules, setBrowseModules] = useState<LearningModule[]>([]);
  const [enrolledModules, setEnrolledModules] = useState<LearningModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModule, setLoadingModule] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [levelFilter, setLevelFilter] = useState<string>("all");

  // Fetch modules on mount
  useEffect(() => {
    Promise.all([fetchBrowseModules(), fetchEnrolledModules()]);
  }, []);

  const fetchBrowseModules = async () => {
    try {
      setError(null);
      const response = await fetch("/api/student/modules");

      if (!response.ok) {
        throw new Error("Failed to fetch modules");
      }

      const result: ApiResponse<{ modules: LearningModule[] }> = await response.json();

      if (result.data && result.data.modules) {
        setBrowseModules(result.data.modules);
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

  const fetchEnrolledModules = async () => {
    try {
      const response = await fetch("/api/student/modules?enrolled=true");

      if (!response.ok) {
        throw new Error("Failed to fetch enrolled modules");
      }

      const result: ApiResponse<{ modules: LearningModule[] }> = await response.json();

      if (result.data && result.data.modules) {
        setEnrolledModules(result.data.modules);
      }
    } catch (err) {
      logger.error("Error fetching enrolled modules:", err);
    }
  };

  const handleEnroll = async (moduleId: string) => {
    try {
      setEnrollingId(moduleId);
      setError(null);

      const response = await fetch("/api/student/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType?.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to enroll in module");
        }
        throw new Error(`Failed to enroll in module (${response.status})`);
      }

      // Refresh both lists
      await Promise.all([fetchBrowseModules(), fetchEnrolledModules()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll in module");
      logger.error("Error enrolling in module:", err);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleViewModule = async (moduleId: string) => {
    try {
      setLoadingModule(true);
      setError(null);

      // Fetch full module details including lessons
      const response = await fetch(`/api/student/modules/${moduleId}`);

      if (!response.ok) {
        throw new Error("Failed to load module");
      }

      const result = await response.json();

      if (result.module) {
        // Transform API response to ViewerLearningModule format
        const moduleData = result.module;
        const content = moduleData.content || { lessons: [] };

        const viewerModule: ViewerLearningModule = {
          id: moduleData.id,
          title: moduleData.title,
          description: moduleData.description,
          subject: moduleData.subject?.name || "",
          category: moduleData.category,
          difficulty: moduleData.level as "beginner" | "intermediate" | "advanced",
          thumbnailUrl: moduleData.thumbnail,
          estimatedHours: Math.round((moduleData.duration || 60) / 60),
          lessons: (content.lessons as ModuleLesson[]) || [],
          classId: moduleData.classId || "",
          isPublished: moduleData.isPublished,
        };

        setSelectedModule(viewerModule);
        setView("viewer");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load module");
      logger.error("Error loading module:", err);
    } finally {
      setLoadingModule(false);
    }
  };

  const handleProgressUpdate = async (contentId: string, completed: boolean) => {
    if (!selectedModule) return;

    try {
      await fetch(`/api/student/modules/${selectedModule.id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contentId,
          completed,
          timeSpent: 60, // Default 1 minute per content
        }),
      });

      // Refresh enrolled modules to update progress
      await fetchEnrolledModules();
    } catch (err) {
      logger.error("Error updating progress:", err);
    }
  };

  const handleModuleComplete = async () => {
    if (!selectedModule) return;

    try {
      const response = await fetch(`/api/student/modules/${selectedModule.id}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        // Refresh enrolled modules
        await fetchEnrolledModules();
        setView("enrolled");
      }
    } catch (err) {
      logger.error("Error completing module:", err);
    }
  };

  // Filter modules
  const filteredBrowseModules = browseModules.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === "all" || m.category === categoryFilter;
    const matchesLevel = levelFilter === "all" || m.level === levelFilter;

    return matchesSearch && matchesCategory && matchesLevel;
  });

  // Render viewer
  if (view === "viewer" && loadingModule) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (view === "viewer" && selectedModule) {
    // Get progress data from enrolled modules
    const enrolledModule = enrolledModules.find((m) => m.id === selectedModule.id);
    const progressData = (enrolledModule?.progress?.completedLessons || []).map((id: string) => ({
      moduleId: selectedModule.id,
      lessonId: "",
      contentId: id,
      completed: true,
      timeSpent: 0,
    }));

    return (
      <div className="space-y-6">
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => {
              setView("browse");
              setSelectedModule(null);
            }}
          >
            Back to Modules
          </Button>
        </div>

        <ModuleViewer
          module={selectedModule}
          progress={progressData}
          onUpdateProgress={handleProgressUpdate}
          onComplete={handleModuleComplete}
        />
      </div>
    );
  }

  // Render module list
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learning Modules</h1>
        <p className="text-gray-600 mt-1">Browse and enroll in interactive learning modules</p>
      </div>

      {/* View Toggle and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex gap-2">
            <Button
              variant={view === "browse" ? "default" : "outline"}
              onClick={() => setView("browse")}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Browse
            </Button>
            <Button
              variant={view === "enrolled" ? "default" : "outline"}
              onClick={() => setView("enrolled")}
            >
              <Play className="w-4 h-4 mr-2" />
              My Learning ({enrolledModules.length})
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search modules..."
                className="pl-9 w-64"
              />
            </div>
          </div>
        </div>

        {/* Filters for browse view */}
        {view === "browse" && (
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Category:</span>
              <select
                className="border rounded-md px-3 py-1.5 text-sm"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="subject">Subjects</option>
                <option value="skill">Skills</option>
                <option value="exam_prep">Exam Prep</option>
                <option value="career">Career</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Level:</span>
              <select
                className="border rounded-md px-3 py-1.5 text-sm"
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value)}
              >
                <option value="all">All Levels</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : view === "enrolled" ? (
          enrolledModules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No enrolled modules</h3>
                <p className="text-muted-foreground mb-4">
                  Browse available modules and enroll to get started
                </p>
                <Button onClick={() => setView("browse")}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse Modules
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledModules.map((mod) => (
                <ModuleCard
                  key={mod.id}
                  module={mod}
                  onView={handleViewModule}
                  onEnroll={handleEnroll}
                  isEnrolling={false}
                />
              ))}
            </div>
          )
        ) : filteredBrowseModules.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No modules found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBrowseModules.map((mod) => (
              <ModuleCard
                key={mod.id}
                module={mod}
                onView={handleViewModule}
                onEnroll={handleEnroll}
                isEnrolling={enrollingId === mod.id}
              />
            ))}
          </div>
        )}
    </div>
  );
}
