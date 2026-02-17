"use client";

/**
 * STUDENT TUITION PAGE
 * Browse and book tutors and courses
 */

import { useState } from "react";
import { PortalHeader } from "@/components/shared/portal-sidebar";
import { TutorProfileCard, CourseCard } from "@/components/tuition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, GraduationCap, BookOpen, Video } from "lucide-react";
import { logger } from "@/lib/logger";

// Mock tutors
const mockTutors = [
  {
    id: "t1",
    name: "Karma Wangchuk",
    avatar: "",
    bio: "Experienced mathematics teacher with 10+ years of teaching Class 10-12 students",
    education: [{ degree: "M.Sc. Mathematics", institution: "RUB", year: "2015" }],
    experience: 10,
    subjects: ["Mathematics", "Statistics"],
    levels: ["class10", "class12"] as ("class10" | "class12" | "university" | "professional")[],
    location: { city: "Thimphu", area: "Motithang" },
    isOnline: true,
    languages: ["Dzongkha", "English"],
    pricing: { hourlyRate: 500, currency: "Nu." },
    stats: { rating: 4.8, reviewCount: 45, studentCount: 120, completedSessions: 350 },
    availability: { type: "online" as ("online" | "in-person" | "both") },
    isVerified: true,
  },
  {
    id: "t2",
    name: "Tshering Yangden",
    avatar: "",
    bio: "English language specialist focusing on literature and writing skills",
    education: [{ degree: "B.A. English", institution: "Sherubtse College", year: "2018" }],
    experience: 5,
    subjects: ["English", "Literature"],
    levels: ["class10", "class12"] as ("class10" | "class12" | "university" | "professional")[],
    location: { city: "Paro" },
    isOnline: true,
    languages: ["Dzongkha", "English"],
    pricing: { hourlyRate: 400, currency: "Nu." },
    stats: { rating: 4.6, reviewCount: 32, studentCount: 85, completedSessions: 200 },
    availability: { type: "both" as ("online" | "in-person" | "both") },
    isVerified: true,
  },
];

// Mock courses
const mockCourses = [
  {
    id: "c1",
    title: "Complete Class 10 Mathematics",
    description: "Comprehensive coverage of Class 10 mathematics curriculum with live sessions and practice problems",
    thumbnailUrl: "",
    category: "Academic",
    subject: "Mathematics",
    level: ["class10"],
    tutorId: "t1",
    tutorName: "Karma Wangchuk",
    tutorRating: 4.8,
    pricing: { type: "paid", amount: 5000, currency: "Nu.", duration: "3 months" },
    schedule: {
      type: "live",
      startDate: "2025-02-15",
      totalSessions: 36,
    },
    enrollment: { current: 45, max: 60 },
    stats: { rating: 4.7, reviewCount: 28, completedBy: 120 },
    features: ["Live sessions", "Recorded videos", "Practice tests", "Doubt clearing"],
    isVerified: true,
  },
  {
    id: "c2",
    title: "English Writing Masterclass",
    description: "Improve your essay writing and comprehension skills with expert guidance",
    thumbnailUrl: "",
    category: "Academic",
    subject: "English",
    level: ["class12"],
    tutorId: "t2",
    tutorName: "Tshering Yangden",
    tutorRating: 4.6,
    pricing: { type: "paid", amount: 3500, currency: "Nu.", duration: "2 months" },
    schedule: {
      type: "hybrid",
      startDate: "2025-02-20",
      totalSessions: 24,
    },
    enrollment: { current: 30, max: 50 },
    stats: { rating: 4.5, reviewCount: 18, completedBy: 85 },
    features: ["Live sessions", "Writing assignments", "Personal feedback"],
    isVerified: true,
  },
];

export default function StudentTuitionPage() {
  const [activeTab, setActiveTab] = useState<"tutors" | "courses">("courses");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTutors = mockTutors.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCourses = mockCourses.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewProfile = (tutorId: string) => {
    logger.debug("View tutor profile:", tutorId);
    // In production: navigate to tutor profile page
  };

  const handleBook = (tutorId: string) => {
    logger.debug("Book tutor:", tutorId);
    // In production: open booking modal
  };

  const handleEnroll = (courseId: string) => {
    logger.debug("Enroll in course:", courseId);
    // In production: await fetch('/api/tuition/enroll', { method: 'POST' })
  };

  const handleViewCourse = (courseId: string) => {
    logger.debug("View course details:", courseId);
    // In production: navigate to course details page
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader userType="student" userName="Student" title="Tuition Marketplace" />
      <div className="lg:ml-64 p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Find Tutors & Courses</h2>

          {/* Search */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tutors or courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("courses")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "courses"
                ? "bg-primary text-primary-foreground"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <Video className="w-4 h-4" />
            Courses
          </button>

          <button
            onClick={() => setActiveTab("tutors")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "tutors"
                ? "bg-primary text-primary-foreground"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Tutors
          </button>
        </div>

        {/* Content */}
        {activeTab === "tutors" ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Showing {filteredTutors.length} verified tutors
            </p>

            {filteredTutors.map((tutor) => (
              <TutorProfileCard
                key={tutor.id}
                tutor={tutor as any}
                variant="detailed"
                onViewProfile={handleViewProfile}
                onBook={handleBook}
              />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course as any}
                variant="default"
                onEnroll={handleEnroll}
                onViewDetails={handleViewCourse}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
