"use client";

/**
 * STUDENT TUITION PAGE
 * Browse and book tutors and courses
 */

import { useState, useEffect } from "react";
import { TutorProfileCard, CourseCard, type TutorProfile, type TuitionCourse } from "@/components/tuition";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, GraduationCap, BookOpen, Video, Loader2, AlertCircle } from "lucide-react";
import { logger } from "@/lib/logger";

export default function StudentTuitionPage() {
  const [activeTab, setActiveTab] = useState<"tutors" | "courses">("courses");
  const [searchQuery, setSearchQuery] = useState("");
  const [tutors, setTutors] = useState<TutorProfile[]>([]);
  const [courses, setCourses] = useState<TuitionCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);

        // Fetch tutors and courses from API
        const [tutorsRes, coursesRes] = await Promise.all([
          fetch("/api/tuition/tutors").catch(() => null),
          fetch("/api/tuition/courses").catch(() => null),
        ]);

        if (tutorsRes?.ok) {
          const tutorsData = await tutorsRes.json();
          setTutors(tutorsData.tutors || []);
        } else {
          setTutors([]);
        }

        if (coursesRes?.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        } else {
          setCourses([]);
        }
      } catch (err) {
        logger.error("Error fetching tuition data:", err);
        setError("Failed to load tutors and courses");
        setTutors([]);
        setCourses([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredTutors = tutors.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCourses = courses.filter((c) =>
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
    <div className="space-y-6">
      {/* Header */}
      <div>
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

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-orange-600 mr-3" />
          <span className="text-gray-600">Loading tutors and courses...</span>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Failed to load data</p>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
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
              {filteredTutors.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No tutors found</p>
                    <p className="text-sm text-gray-500 mt-2">Check back later for available tutors</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <p className="text-muted-foreground">
                    Showing {filteredTutors.length} verified tutors
                  </p>

                  {filteredTutors.map((tutor) => (
                    <TutorProfileCard
                      key={tutor.id}
                      tutor={tutor}
                      variant="detailed"
                      onViewProfile={handleViewProfile}
                      onBook={handleBook}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.length === 0 ? (
                <Card className="col-span-full">
                  <CardContent className="py-12 text-center">
                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-muted-foreground">No courses found</p>
                    <p className="text-sm text-gray-500 mt-2">Check back later for available courses</p>
                  </CardContent>
                </Card>
              ) : (
                filteredCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    variant="default"
                    onEnroll={handleEnroll}
                    onViewDetails={handleViewCourse}
                  />
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
