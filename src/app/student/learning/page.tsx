"use client";

/**
 * STUDENT LEARNING MODULES PAGE
 * Browse and enroll in learning modules
 */

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Video, BookOpen, Clock, Users, Award, Play } from "lucide-react";

// Mock learning modules
const mockModules = [
  {
    id: "mod1",
    title: "Introduction to Algebra",
    description: "Learn the fundamentals of algebra including equations, functions, and graphs",
    subject: "Mathematics",
    category: "Algebra",
    difficulty: "beginner" as const,
    thumbnailUrl: "",
    estimatedHours: 10,
    tutorName: "Mrs. Dorji",
    lessonsCount: 12,
    enrollmentCount: 234,
    rating: 4.5,
    isEnrolled: true,
    progress: 35,
  },
  {
    id: "mod2",
    title: "Bhutanese History & Culture",
    description: "Explore the rich history and cultural heritage of Bhutan",
    subject: "Social Studies",
    category: "History",
    difficulty: "intermediate" as const,
    thumbnailUrl: "",
    estimatedHours: 8,
    tutorName: "Mr. Wangchuk",
    lessonsCount: 8,
    enrollmentCount: 189,
    rating: 4.8,
    isEnrolled: false,
    progress: 0,
  },
  {
    id: "mod3",
    title: "English Grammar Essentials",
    description: "Master the rules of English grammar and improve your writing",
    subject: "English",
    category: "Grammar",
    difficulty: "beginner" as const,
    thumbnailUrl: "",
    estimatedHours: 6,
    tutorName: "Ms. Tshering",
    lessonsCount: 10,
    enrollmentCount: 312,
    rating: 4.3,
    isEnrolled: false,
    progress: 0,
  },
  {
    id: "mod4",
    title: "Physics: Motion and Forces",
    description: "Understand the principles of motion, forces, and energy",
    subject: "Physics",
    category: "Mechanics",
    difficulty: "intermediate" as const,
    thumbnailUrl: "",
    estimatedHours: 15,
    tutorName: "Dr. Karma",
    lessonsCount: 15,
    enrollmentCount: 145,
    rating: 4.7,
    isEnrolled: true,
    progress: 75,
  },
];

export default function StudentLearningPage() {
  const [selectedModule, setSelectedModule] = useState<any>(null);

  if (selectedModule) {
    // In production, would render ModuleViewer
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalHeader userType="student" userName="Student" title={selectedModule.title} />
        <div className="lg:ml-64 p-6">
          <Button variant="outline" onClick={() => setSelectedModule(null)} className="mb-4">
            ← Back to Modules
          </Button>
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Play className="w-16 h-16 mx-auto mb-4 text-primary" />
              <h2 className="text-xl font-bold mb-2">Module Content</h2>
              <p className="text-muted-foreground">
                Module viewer would load here. Progress: {selectedModule.progress}%
              </p>
              <Progress value={selectedModule.progress} className="max-w-md mx-auto mt-4" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="Learning Modules" />
      <div className="lg:ml-64 p-6">
        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button variant="outline" size="sm">All Subjects</Button>
          <Button variant="ghost" size="sm">Mathematics</Button>
          <Button variant="ghost" size="sm">Science</Button>
          <Button variant="ghost" size="sm">English</Button>
          <Button variant="ghost" size="sm">Social Studies</Button>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockModules.map((mod) => (
            <Card
              key={mod.id}
              className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer"
              onClick={() => setSelectedModule(mod)}
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                <BookOpen className="w-16 h-16 text-primary/40" />
              </div>

              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{mod.subject}</Badge>
                  <Badge
                    variant={
                      mod.difficulty === "beginner"
                        ? "secondary"
                        : mod.difficulty === "intermediate"
                        ? "default"
                        : "destructive"
                    }
                    className="capitalize"
                  >
                    {mod.difficulty}
                  </Badge>
                  {mod.isEnrolled && (
                    <Badge className="bg-green-100 text-green-700">
                      <Award className="w-3 h-3 mr-1" />
                      Enrolled
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold">{mod.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{mod.description}</p>

                <div className="flex items-center gap-3 mt-3 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mod.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {mod.lessonsCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {mod.enrollmentCount}
                  </span>
                </div>

                {/* Progress for enrolled courses */}
                {mod.isEnrolled && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>Your Progress</span>
                      <span>{mod.progress}%</span>
                    </div>
                    <Progress value={mod.progress} />
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">by {mod.tutorName}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span>{mod.rating}</span>
                  </div>
                </div>

                <Button className="w-full mt-3">
                  {mod.isEnrolled ? "Continue Learning" : "Enroll Now"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
