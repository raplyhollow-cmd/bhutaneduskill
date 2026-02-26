/**
 * RUB College Card Component
 * Displays RUB college information with facilities and program count
 */

"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Users,
  BookOpen,
  GraduationCap,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

interface RUBCollegeCardProps {
  college: {
    id: string;
    name: string;
    code: string;
    type: "constituent" | "affiliated";
    dzongkhag: string;
    location: string;
    hasHostel?: boolean;
    hasLibrary?: boolean;
    hasLab?: boolean;
    hasSports?: boolean;
    website?: string;
    programCount?: number;
    description?: string;
  };
  onViewPrograms?: (collegeId: string) => void;
  variant?: "default" | "compact";
}

export function RUBCollegeCard({
  college,
  onViewPrograms,
  variant = "default",
}: RUBCollegeCardProps) {
  const getTypeColor = (type: string) => {
    return type === "constituent"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-purple-100 text-purple-700 border-purple-200";
  };

  if (variant === "compact") {
    return (
      <Card className="hover:shadow-md transition-all">
        <CardContent className="pt-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 truncate">{college.name}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {college.code}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <MapPin className="w-3 h-3" />
                <span className="truncate">{college.location}, {college.dzongkhag}</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge className={getTypeColor(college.type)}>
                {college.type === "constituent" ? "Constituent" : "Affiliated"}
              </Badge>
              {college.programCount !== undefined && (
                <span className="text-xs text-gray-600">
                  {college.programCount} programs
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-all group">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <CardTitle className="group-hover:text-orange-600 transition-colors">
                {college.name}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {college.code}
              </Badge>
              <Badge className={getTypeColor(college.type)}>
                {college.type === "constituent" ? "Constituent" : "Affiliated"}
              </Badge>
            </div>
            <CardDescription className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {college.location}, {college.dzongkhag}
            </CardDescription>
          </div>
          {college.website && (
            <a
              href={college.website}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0"
            >
              <Button variant="ghost" size="sm" className="min-h-[44px]">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        {college.description && (
          <p className="text-sm text-gray-600 line-clamp-2">
            {college.description}
          </p>
        )}

        {/* Facilities */}
        <div className="flex flex-wrap gap-2">
          {college.hasHostel && (
            <Badge variant="outline" className="text-xs gap-1">
              <Users className="w-3 h-3" />
              Hostel
            </Badge>
          )}
          {college.hasLibrary && (
            <Badge variant="outline" className="text-xs gap-1">
              <BookOpen className="w-3 h-3" />
              Library
            </Badge>
          )}
          {college.hasLab && (
            <Badge variant="outline" className="text-xs gap-1">
              <GraduationCap className="w-3 h-3" />
              Lab
            </Badge>
          )}
          {college.hasSports && (
            <Badge variant="outline" className="text-xs">
              Sports
            </Badge>
          )}
        </div>

        {/* Programs Count and Actions */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            {college.programCount !== undefined ? (
              <span className="text-gray-600">
                {college.programCount} program{college.programCount !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="text-gray-400">View programs</span>
            )}
          </div>
          <div className="flex gap-2">
            {onViewPrograms && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewPrograms(college.id)}
                className="min-h-[44px]"
              >
                <GraduationCap className="w-4 h-4 mr-2" />
                Programs
              </Button>
            )}
            <Link href={`/student/rub?college=${college.id}`}>
              <Button
                size="sm"
                className="min-h-[44px]"
                style={{ background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)' }}
              >
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default RUBCollegeCard;
