"use client";

/**
 * Assessment Profile Card Component
 *
 * Displays student's assessment results on the dashboard including:
 * - RIASEC Holland Code with visual badge
 * - Top career matches
 * - MBTI personality type (if available)
 * - Progress toward completing all assessments
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Target,
  Sparkles,
  ArrowRight,
  BookOpen,
  FileText,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { logger } from "@/lib/logger";

interface AssessmentProfile {
  completedAssessments: number;
  assessmentTypes: string[];
  riasec: {
    hollandCode: string;
    description: string;
    scores: Record<string, number>;
    dominantTraits: string[];
  } | null;
  mbti: {
    type: string;
    description: string;
    strengths: string[];
  } | null;
  topCareers: Array<{
    id: string;
    title: string;
    matchScore: number;
    category?: string;
  }>;
  profile: {
    grade: number;
    interests: string[];
    goals: string[];
    fullName: string;
  };
  journal: {
    totalEntries: number;
    lastEntryAt: string | null;
    hasRecentEntries: boolean;
  };
  recommendations: {
    hasEnoughData: boolean;
    message: string;
  };
}

const TRAIT_COLORS: Record<string, string> = {
  R: "bg-red-100 text-red-700",
  I: "bg-blue-100 text-blue-700",
  A: "bg-purple-100 text-purple-700",
  S: "bg-green-100 text-green-700",
  E: "bg-orange-100 text-orange-700",
  C: "bg-gray-100 text-gray-700",
};

const TRAIT_GRADIENTS: Record<string, string> = {
  R: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)",
  I: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)",
  A: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
  S: "linear-gradient(135deg, rgb(34 197 94) 0%, rgb(22 163 74) 100%)",
  E: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)",
  C: "linear-gradient(135deg, rgb(107 114 128) 0%, rgb(75 85 99) 100%)",
};

export function AssessmentProfileCard() {
  const [profile, setProfile] = useState<AssessmentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentProfile();
  }, []);

  const fetchAssessmentProfile = async () => {
    try {
      const response = await fetch("/api/student/assessment-profile");
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    } catch (error) {
      logger.error("Failed to fetch assessment profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/3" />
            <div className="h-20 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return null;
  }

  const hasAssessments = profile.completedAssessments > 0;
  const totalAssessments = 5;
  const assessmentProgress = (profile.completedAssessments / totalAssessments) * 100;

  return (
    <Card className={hasAssessments ? "border-orange-200 bg-gradient-to-r from-orange-50/50 to-amber-50/50" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              {hasAssessments ? "Your Assessment Profile" : "Start Your Journey"}
            </CardTitle>
            <CardDescription>
              {hasAssessments
                ? "Based on your completed assessments"
                : "Complete assessments to unlock personalized insights"}
            </CardDescription>
          </div>
          {hasAssessments && (
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {profile.completedAssessments} of {totalAssessments} completed
              </p>
              <Progress value={assessmentProgress} className="h-2 w-24 mt-1" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasAssessments ? (
          <>
            {/* RIASEC Holland Code */}
            {profile.riasec && (
              <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
                <div
                  className="w-16 h-16 rounded-xl flex items-center justify-center text-white shadow-md"
                  style={{ background: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(59 130 246) 100%)" }}
                >
                  <span className="text-2xl font-bold tracking-wider">{profile.riasec.hollandCode}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">Your Holland Code</h4>
                    {profile.riasec.dominantTraits.map((trait) => (
                      <Badge key={trait} className={TRAIT_COLORS[trait]}>
                        {trait}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{profile.riasec.description}</p>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/student/careers">
                    View Careers
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Top Career Matches */}
            {profile.topCareers.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  Top Career Matches
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                  {profile.topCareers.map((career) => (
                    <div
                      key={career.id}
                      className="p-3 bg-white rounded-lg border hover:border-orange-300 transition-colors text-center"
                    >
                      <p className="font-medium text-sm text-gray-900 line-clamp-2">{career.title}</p>
                      <div className="flex items-center justify-center gap-1 mt-2">
                        <TrendingUp className="w-3 h-3 text-orange-500" />
                        <span className="text-sm font-semibold text-orange-600">{career.matchScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* MBTI (if available) */}
            {profile.mbti && (
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)" }}
                >
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-500">Personality Type</p>
                  <p className="font-semibold text-gray-900">{profile.mbti.type}</p>
                </div>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  MBTI
                </Badge>
              </div>
            )}
          </>
        ) : (
          /* Empty State - Start Assessments */
          <div className="text-center py-6">
            <div
              className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)" }}
            >
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">Discover Your Unique Profile</h4>
            <p className="text-sm text-gray-600 mb-4 max-w-md mx-auto">
              Complete quick assessments to unlock personalized career guidance, skill
              recommendations, and AI-powered insights
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Button size="sm" asChild>
                <Link href="/student/assessment/riasec">
                  <Target className="w-4 h-4 mr-2" />
                  Start RIASEC
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link href="/student/assessment">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
