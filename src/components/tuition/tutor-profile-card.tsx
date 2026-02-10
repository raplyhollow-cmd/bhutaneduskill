/**
 * TUTOR PROFILE CARD
 * Display tutor information for the tuition marketplace
 */
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Star,
  MapPin,
  BookOpen,
  Clock,
  Users,
  Award,
  GraduationCap,
  Briefcase,
} from "lucide-react";

export interface TutorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio: string;

  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;

  experience: number; // years
  subjects: string[];
  levels: ("class10" | "class12" | "university" | "professional")[];

  location?: {
    city: string;
    area?: string;
  };
  isOnline: boolean;
  languages: string[];

  pricing: {
    hourlyRate: number;
    currency?: string;
  };

  stats: {
    rating: number;
    reviewCount: number;
    studentCount: number;
    completedSessions: number;
  };

  availability: {
    type: "online" | "in-person" | "both";
    schedule?: string;
  };

  isVerified?: boolean;
}

interface TutorProfileCardProps {
  tutor: TutorProfile;
  onViewProfile: (tutorId: string) => void;
  onBook?: (tutorId: string) => void;
  variant?: "default" | "compact" | "detailed";
}

export function TutorProfileCard({
  tutor,
  onViewProfile,
  onBook,
  variant = "default",
}: TutorProfileCardProps) {
  if (variant === "compact") {
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-xl font-bold text-primary flex-shrink-0">
              {tutor.avatar ? (
                <img src={tutor.avatar} alt={`${tutor.name}'s profile photo`} className="w-full h-full rounded-full" />
              ) : (
                tutor.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {tutor.name}
                    {tutor.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-1">{tutor.bio}</p>
                </div>

                <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm font-medium">{tutor.stats.rating}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3 h-3" />
                  {tutor.subjects.slice(0, 2).join(", ")}
                  {tutor.subjects.length > 2 && " +more"}
                </span>

                <span className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3" />
                  {tutor.experience}y exp
                </span>
              </div>

              <div className="flex items-center justify-between mt-3">
                <p className="font-semibold text-primary">
                  Nu.{tutor.pricing.hourlyRate}/hr
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => onViewProfile(tutor.id)}>
                    View
                  </Button>
                  {onBook && (
                    <Button size="sm" onClick={() => onBook(tutor.id)}>
                      Book
                    </Button>
                  )}
                </div>
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
          {/* Header */}
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary flex-shrink-0">
              {tutor.avatar ? (
                <img src={tutor.avatar} alt={`${tutor.name}'s profile photo`} className="w-full h-full rounded-full" />
              ) : (
                tutor.name.split(" ").map((n) => n[0]).join("")
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {tutor.name}
                    {tutor.isVerified && (
                      <Badge className="bg-blue-100 text-blue-700">
                        <Award className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {tutor.isOnline && (
                      <Badge className="bg-green-100 text-green-700">Online</Badge>
                    )}
                  </h2>
                  <p className="text-muted-foreground mt-1">{tutor.bio}</p>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="text-lg font-bold">{tutor.stats.rating}</span>
                    <span className="text-sm text-muted-foreground">
                      ({tutor.stats.reviewCount} reviews)
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-primary mt-1">
                    Nu.{tutor.pricing.hourlyRate}/hour
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="text-center p-3 bg-muted rounded-lg">
              <Briefcase className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{tutor.experience}</p>
              <p className="text-xs text-muted-foreground">Years Experience</p>
            </div>

            <div className="text-center p-3 bg-muted rounded-lg">
              <Users className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{tutor.stats.studentCount}</p>
              <p className="text-xs text-muted-foreground">Students</p>
            </div>

            <div className="text-center p-3 bg-muted rounded-lg">
              <Clock className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{tutor.stats.completedSessions}</p>
              <p className="text-xs text-muted-foreground">Sessions</p>
            </div>

            <div className="text-center p-3 bg-muted rounded-lg">
              <Star className="w-5 h-5 mx-auto mb-1 text-muted-foreground" />
              <p className="font-semibold">{tutor.stats.rating}/5</p>
              <p className="text-xs text-muted-foreground">Rating</p>
            </div>
          </div>

          {/* Subjects & Education */}
          <div className="grid md:grid-cols-2 gap-6 mt-6">
            <div>
              <h3 className="font-semibold mb-2">Subjects</h3>
              <div className="flex flex-wrap gap-2">
                {tutor.subjects.map((subject) => (
                  <Badge key={subject} variant="outline">
                    {subject}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Education</h3>
              <div className="space-y-2">
                {tutor.education.map((edu, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium">{edu.degree}</p>
                    <p className="text-muted-foreground">
                      {edu.institution} • {edu.year}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Location & Languages */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            {tutor.location && (
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                {tutor.location.city}, {tutor.location.area}
              </span>
            )}

            <span className="flex items-center gap-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              Speaks: {tutor.languages.join(", ")}
            </span>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => onViewProfile(tutor.id)}>
              View Full Profile
            </Button>
            {onBook && <Button onClick={() => onBook(tutor.id)}>Book Session</Button>}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Default variant
  return (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => onViewProfile(tutor.id)}>
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-lg font-bold text-primary flex-shrink-0">
            {tutor.avatar ? (
              <img src={tutor.avatar} alt={`${tutor.name}'s profile photo`} className="w-full h-full rounded-full" />
            ) : (
              tutor.name.split(" ").map((n) => n[0]).join("")
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold flex items-center gap-2">
                  {tutor.name}
                  {tutor.isVerified && (
                    <Award className="w-4 h-4 text-blue-500" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{tutor.bio}</p>
              </div>

              <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-medium">{tutor.stats.rating}</span>
                <span className="text-xs text-muted-foreground">({tutor.stats.reviewCount})</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {tutor.subjects.slice(0, 3).map((subject) => (
                <Badge key={subject} variant="outline" className="text-xs">
                  {subject}
                </Badge>
              ))}
              {tutor.subjects.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{tutor.subjects.length - 3} more
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {tutor.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {tutor.location.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  {tutor.experience}y exp
                </span>
                {tutor.isOnline && (
                  <Badge className="bg-green-100 text-green-700">Online</Badge>
                )}
              </div>

              <p className="font-semibold text-primary">
                Nu.{tutor.pricing.hourlyRate}/hr
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
