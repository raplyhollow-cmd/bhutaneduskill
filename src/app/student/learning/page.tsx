"use client";

/**
 * STUDENT LEARNING MODULES PAGE
 * Browse and enroll in learning modules with progress tracking
 */

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Video, BookOpen, Clock, Users, Award, Play, Search, Filter, CheckCircle, Lock, Download } from "lucide-react";
import { logger } from "@/lib/logger";

interface LearningModule {
  id: string;
  title: string;
  description: string;
  subject: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  thumbnailUrl?: string;
  estimatedHours: number;
  tutorName: string;
  lessonsCount: number;
  enrollmentCount: number;
  rating: number;
  isEnrolled: boolean;
  isLocked?: boolean;
  progress: number;
  certificateUrl?: string;
  completedAt?: string;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case "beginner":
      return "bg-green-100 text-green-700";
    case "intermediate":
      return "bg-blue-100 text-blue-700";
    case "advanced":
      return "bg-purple-100 text-purple-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

export default function StudentLearningPage() {
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [filteredModules, setFilteredModules] = useState<LearningModule[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedModule, setSelectedModule] = useState<LearningModule | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [enrollingModuleId, setEnrollingModuleId] = useState<string | null>(null);

  // Categories from subjects
  const categories = ["all", "Mathematics", "Science", "English", "Social Studies", "Computer Science", "Dzongkha"];

  useEffect(() => {
    fetchModules();
  }, []);

  useEffect(() => {
    let filtered = modules;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((m) => m.subject === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.tutorName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredModules(filtered);
  }, [modules, selectedCategory, searchQuery]);

  const fetchModules = async () => {
    try {
      const response = await fetch("/api/student/modules");
      if (!response.ok) throw new Error("Failed to fetch modules");

      const data = await response.json();
      setModules(data.modules || []);
    } catch (error) {
      logger.error("Error loading modules:", error);
      // Use mock data as fallback
      setModules(getMockModules());
    } finally {
      setLoading(false);
    }
  };

  const getMockModules = (): LearningModule[] => [
    {
      id: "mod1",
      title: "Introduction to Algebra",
      description: "Learn the fundamentals of algebra including equations, functions, and graphs",
      subject: "Mathematics",
      category: "Algebra",
      difficulty: "beginner",
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
      difficulty: "intermediate",
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
      difficulty: "beginner",
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
      subject: "Science",
      category: "Physics",
      difficulty: "intermediate",
      estimatedHours: 15,
      tutorName: "Dr. Karma",
      lessonsCount: 15,
      enrollmentCount: 145,
      rating: 4.7,
      isEnrolled: true,
      progress: 75,
    },
    {
      id: "mod5",
      title: "Introduction to Programming",
      description: "Learn programming basics with Python - no experience required",
      subject: "Computer Science",
      category: "Programming",
      difficulty: "beginner",
      estimatedHours: 20,
      tutorName: "Mr. Penjor",
      lessonsCount: 20,
      enrollmentCount: 456,
      rating: 4.9,
      isEnrolled: false,
      progress: 0,
    },
  ];

  const handleEnroll = async (moduleId: string) => {
    setEnrollingModuleId(moduleId);
    try {
      const response = await fetch("/api/student/modules/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ moduleId }),
      });

      if (response.ok) {
        // Update local state
        setModules((prev) =>
          prev.map((m) =>
            m.id === moduleId ? { ...m, isEnrolled: true, progress: 0 } : m
          )
        );
      }
    } catch (error) {
      logger.error("Failed to enroll:", error);
    } finally {
      setEnrollingModuleId(null);
    }
  };

  const enrolledCount = modules.filter((m) => m.isEnrolled).length;
  const completedCount = modules.filter((m) => m.progress === 100).length;
  const inProgressCount = enrolledCount - completedCount;

  // Module detail view
  if (selectedModule) {
    return (
      <div className="space-y-6">
        <Button variant="outline" onClick={() => setSelectedModule(null)}>
          ← Back to Modules
        </Button>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline">{selectedModule.subject}</Badge>
                  <Badge className={getDifficultyColor(selectedModule.difficulty)}>
                    {selectedModule.difficulty}
                  </Badge>
                </div>
                <h2 className="text-2xl font-bold">{selectedModule.title}</h2>
                <p className="text-gray-600 mt-2">{selectedModule.description}</p>
                <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.estimatedHours} hours
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {selectedModule.lessonsCount} lessons
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {selectedModule.enrollmentCount} enrolled
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm">
                <span className="text-yellow-500">★</span>
                <span className="font-medium">{selectedModule.rating}</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Your Progress</span>
                <span>{selectedModule.progress}%</span>
              </div>
              <Progress value={selectedModule.progress} className="h-3" />
            </div>

            <div className="flex gap-3">
              {selectedModule.progress === 100 && selectedModule.certificateUrl ? (
                <Button className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Download Certificate
                </Button>
              ) : selectedModule.progress > 0 ? (
                <Button className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Continue Learning
                </Button>
              ) : (
                <Button className="flex-1">
                  <Play className="w-4 h-4 mr-2" />
                  Start Module
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Learning Modules</h1>
        <p className="text-gray-600 mt-1">
          Browse and enroll in courses to enhance your skills
        </p>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-1">Available</p>
            <p className="text-2xl font-bold text-gray-900">{modules.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-1">Enrolled</p>
            <p className="text-2xl font-bold text-blue-600">{enrolledCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-orange-600">{inProgressCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500 mb-1">Completed</p>
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Search modules, subjects, or tutors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              style={selectedCategory === category ? { background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' } : {}}
            >
              {category === "all" ? "All" : category}
            </Button>
          ))}
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-40 bg-gray-200"></div>
              <CardContent className="pt-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Modules Grid */
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <Card
              key={mod.id}
              className="hover:shadow-lg transition-all duration-200 overflow-hidden group cursor-pointer"
              onClick={() => setSelectedModule(mod)}
            >
              {/* Thumbnail */}
              <div className="h-40 bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center relative">
                {mod.isLocked ? (
                  <Lock className="w-12 h-12 text-orange-400" />
                ) : (
                  <BookOpen className="w-16 h-16 text-orange-600" />
                )}
                {mod.isEnrolled && mod.progress > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-600">
                    <div
                      className="h-full bg-green-500"
                      style={{ width: `${mod.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge variant="outline">{mod.subject}</Badge>
                  <Badge className={getDifficultyColor(mod.difficulty)}>
                    {mod.difficulty}
                  </Badge>
                  {mod.isEnrolled && mod.progress === 100 && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                  {mod.isEnrolled && mod.progress > 0 && mod.progress < 100 && (
                    <Badge className="bg-blue-100 text-blue-700">
                      In Progress
                    </Badge>
                  )}
                </div>

                <h3 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mt-1">{mod.description}</p>

                <div className="flex items-center gap-3 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {mod.estimatedHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {mod.lessonsCount}
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
                      <span className="text-gray-600">Your Progress</span>
                      <span className={mod.progress === 100 ? "text-green-600" : ""}>
                        {mod.progress}%
                      </span>
                    </div>
                    <Progress value={mod.progress} className="h-2" />
                  </div>
                )}

                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-500">by {mod.tutorName}</p>
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-yellow-500">★</span>
                    <span className="font-medium">{mod.rating}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredModules.length === 0 && (
        <Card className="py-12 text-center">
          <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-900">No modules found</h3>
          <p className="text-gray-500 mt-2">
            {searchQuery ? "Try different search terms" : "No modules available yet"}
          </p>
        </Card>
      )}
    </div>
  );
}
