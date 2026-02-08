/**
 * TEACHER LEARNING MODULES PAGE
 * Create and manage learning modules
 */
"use client";

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { ModuleCreator } from "@/components/learning";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2, BookOpen, Users, Clock } from "lucide-react";

// Mock modules
const mockModules = [
  {
    id: "mod1",
    title: "Introduction to Algebra",
    description: "Learn the fundamentals of algebra",
    subject: "Mathematics",
    difficulty: "beginner" as const,
    isPublished: true,
    estimatedHours: 10,
    lessonsCount: 12,
    enrollmentCount: 234,
    progress: 35,
  },
  {
    id: "mod2",
    title: "Advanced Calculus",
    description: "Differential and integral calculus",
    subject: "Mathematics",
    difficulty: "advanced" as const,
    isPublished: false,
    estimatedHours: 20,
    lessonsCount: 15,
    enrollmentCount: 0,
  },
];

export default function TeacherLearningPage() {
  const [view, setView] = useState<"list" | "create">("list");

  const handleSave = async (module: any) => {
    console.log("Saving module:", module);
    // In production: await fetch('/api/teacher/modules', { method: 'POST', body: JSON.stringify(module) })
    setView("list");
  };

  if (view === "create") {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="teacher" userName="Teacher" title="Create Learning Module" />
        <div className="lg:ml-64 p-6">
          <div className="mb-4">
            <Button variant="outline" onClick={() => setView("list")}>
              ← Back to Modules
            </Button>
          </div>
          <ModuleCreator onSave={handleSave} onCancel={() => setView("list")} />
        </div>
      </div>
    );
  }

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

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockModules.map((mod) => (
            <Card key={mod.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <Badge variant={mod.isPublished ? "default" : "secondary"}>
                    {mod.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>

                <h3 className="font-semibold">{mod.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{mod.description}</p>

                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {mod.lessonsCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mod.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {mod.enrollmentCount}
                  </span>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
