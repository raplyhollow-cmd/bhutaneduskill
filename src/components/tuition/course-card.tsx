/**
 * COURSE CARD
 * Display tuition courses for discovery
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Clock,
  BookOpen,
  Star,
  Play,
  Calendar,
  Video,
  Building2,
} from "lucide-react";

export interface TuitionCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;

  category: string;
  subject: string;
  level: ("class10" | "class12" | "university" | "professional")[];

  tutorId: string;
  tutorName: string;
  tutorAvatar?: string;
  tutorRating?: number;

  pricing: {
    type: "free" | "paid" | "subscription";
    amount?: number;
    currency?: string;
    duration?: string;
  };

  schedule: {
    type: "live" | "recorded" | "hybrid";
    startDate?: string;
    endDate?: string;
    timings?: string;
    totalSessions?: number;
  };

  enrollment: {
    current: number;
    max: number;
  };

  stats: {
    rating: number;
    reviewCount: number;
    completedBy: number;
  };

  features: string[];
  isVerified?: boolean;
}

interface CourseCardProps {
  course: TuitionCourse;
  onEnroll: (courseId: string) => void;
  onViewDetails: (courseId: string) => void;
  variant?: "default" | "compact" | "detailed";
  isEnrolled?: boolean;
  progress?: number;
}

export function CourseCard({
  course,
  onEnroll,
  onViewDetails,
  variant = "default",
  isEnrolled = false,
  progress = 0,
}: CourseCardProps) {
  const levelLabels = {
    class10: "Class 10",
    class12: "Class 12",
    university: "University",
    professional: "Professional",
  };

  const getScheduleTypeBadge = () => {
    if (course.schedule.type === "live") {
      return <Badge className="bg-red-100 text-red-700">Live Sessions</Badge>;
    }
    if (course.schedule.type === "recorded") {
      return <Badge className="bg-blue-100 text-blue-700">Self-Paced</Badge>;
    }
    return <Badge className="bg-purple-100 text-purple-700">Hybrid</Badge>;
  };

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewDetails(course.id)}>
        <CardContent className="pt-4">
          <div className="flex gap-4">
            {course.thumbnailUrl && (
              <img
                src={course.thumbnailUrl}
                alt={`Thumbnail image for the course: ${course.title}`}
                className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
              />
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm">{course.stats.rating}</span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{course.description}</p>

              <div className="flex items-center gap-2 mt-2">
                <Badge variant="outline" className="text-xs">
                  {course.subject}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {course.enrollment.current}/{course.enrollment.max}
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <p className="font-semibold text-primary">
                  {course.pricing.type === "free"
                    ? "Free"
                    : `Nu.${course.pricing.amount}`}
                </p>

                {isEnrolled ? (
                  <Button size="sm" variant="outline">
                    Continue
                  </Button>
                ) : (
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); onEnroll(course.id); }}>
                    Enroll
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === "detailed") {
    return (
      <Card>
        <CardContent className="pt-6">
          {course.thumbnailUrl && (
            <img
              src={course.thumbnailUrl}
              alt={`Thumbnail image for the course: ${course.title}`}
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
          )}

          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {getScheduleTypeBadge()}
                <Badge variant="outline">{course.category}</Badge>
                {course.isVerified && (
                  <Badge className="bg-green-100 text-green-700">Verified</Badge>
                )}
              </div>

              <h2 className="text-xl font-bold">{course.title}</h2>
              <p className="text-muted-foreground mt-2">{course.description}</p>

              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2">
                  {course.tutorAvatar ? (
                    <img
                      src={course.tutorAvatar}
                      alt={`${course.tutorName}'s profile photo`}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold">
                      {course.tutorName.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium">{course.tutorName}</p>
                    {course.tutorRating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">{course.tutorRating}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>{course.pricing.duration || "Self-paced"}</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  <span>{course.schedule.totalSessions || "N/A"} sessions</span>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{course.enrollment.current} enrolled</span>
                </div>
              </div>

              {/* Progress for enrolled courses */}
              {isEnrolled && progress > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span>Your Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
              )}
            </div>

            <div className="text-left ml-6 w-40">
              <div className="mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold">{course.stats.rating}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {course.stats.reviewCount} reviews
                </p>
              </div>

              <div className="mb-4">
                <p className="text-2xl font-bold text-primary">
                  {course.pricing.type === "free"
                    ? "Free"
                    : `Nu.${course.pricing.amount}`}
                </p>
                {course.pricing.type === "paid" && (
                  <p className="text-xs text-muted-foreground">per course</p>
                )}
              </div>

              {isEnrolled ? (
                <Button className="w-full" onClick={() => onViewDetails(course.id)}>
                  Continue Learning
                </Button>
              ) : (
                <Button
                  className="w-full"
                  disabled={course.enrollment.current >= course.enrollment.max}
                  onClick={() => onEnroll(course.id)}
                >
                  {course.enrollment.current >= course.enrollment.max
                    ? "Full"
                    : "Enroll Now"}
                </Button>
              )}
            </div>
          </div>

          {/* Features */}
          {course.features.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold mb-3">What you'll get</h3>
              <div className="grid grid-cols-2 gap-2">
                {course.features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden cursor-pointer" onClick={() => onViewDetails(course.id)}>
      {course.thumbnailUrl && (
        <img
          src={course.thumbnailUrl}
          alt={`Thumbnail image for the course: ${course.title}`}
          className="w-full h-40 object-cover"
        />
      )}

      <CardContent className="pt-4">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {course.subject}
          </Badge>
          {getScheduleTypeBadge()}
        </div>

        <h3 className="font-semibold line-clamp-1">{course.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{course.description}</p>

        <div className="flex items-center gap-2 mt-3">
          {course.tutorAvatar ? (
            <img
              src={course.tutorAvatar}
              alt={`${course.tutorName}'s profile photo`}
              className="w-6 h-6 rounded-full"
            />
          ) : (
            <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold">
              {course.tutorName.split(" ").map((n) => n[0]).join("")}
            </div>
          )}
          <span className="text-sm text-muted-foreground">{course.tutorName}</span>
        </div>

        {/* Progress for enrolled courses */}
        {isEnrolled && progress > 0 && (
          <div className="mt-3">
            <Progress value={progress} className="h-1" />
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
              {course.stats.rating}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {course.enrollment.current}
            </span>
          </div>

          <p className="font-semibold text-primary">
            {course.pricing.type === "free" ? "Free" : `Nu.${course.pricing.amount}`}
          </p>
        </div>

        {isEnrolled && (
          <Button className="w-full mt-3" onClick={(e) => { e.stopPropagation(); onViewDetails(course.id); }}>
            Continue Learning
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
