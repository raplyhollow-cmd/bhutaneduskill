/**
 * AI SKILL GAP ANALYZER COMPONENT
 *
 * Client component that displays AI-powered skill gap analysis
 * Shows current skill level vs required, priority gaps to develop,
 * learning resources, and development timeline
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  TrendingUp,
  Target,
  BookOpen,
  Clock,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Zap,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Lightbulb,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface SkillBreakdown {
  skill: string;
  current: number;
  required: number;
  gap: number;
  category?: "technical" | "soft" | "academic";
}

export interface LearningResource {
  title: string;
  type: "course" | "video" | "article" | "book" | "practice";
  url?: string;
  provider?: string;
  duration?: string;
  free?: boolean;
}

export interface SkillGapData {
  currentSkillLevel: number;
  skillBreakdown: SkillBreakdown[];
  priorityGaps: string[];
  learningResources: LearningResource[];
  timeline: string;
  strengths: string[];
  recommendations: string[];
}

export interface SkillGapRequest {
  targetCareer: string;
  currentSkills?: string[];
  completedSubjects?: string[];
  assessmentResults?: {
    hollandCode?: string;
    mbtiType?: string;
    grades?: Record<string, number>;
  };
}

export interface AISkillGapAnalyzerProps {
  initialData?: SkillGapData;
  requestData?: SkillGapRequest;
  onResourceClick?: (resource: LearningResource) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AISkillGapAnalyzer({
  initialData,
  requestData,
  onResourceClick,
  className,
  compact = false,
}: AISkillGapAnalyzerProps) {
  // Default request data with empty target career
  const defaultRequestData: SkillGapRequest = {
    targetCareer: "",
    currentSkills: [],
    completedSubjects: [],
    assessmentResults: undefined,
  };

  const resolvedRequestData = requestData || defaultRequestData;
  const [data, setData] = useState<SkillGapData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showInput, setShowInput] = useState(!resolvedRequestData.targetCareer);
  const [targetCareer, setTargetCareer] = useState(resolvedRequestData.targetCareer || "");
  const [skillsInput, setSkillsInput] = useState(
    resolvedRequestData.currentSkills?.join(", ") || ""
  );
  const [subjectsInput, setSubjectsInput] = useState(
    resolvedRequestData.completedSubjects?.join(", ") || ""
  );

  async function analyzeSkillGap() {
    if (!targetCareer.trim()) {
      setError("Please enter a target career");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentSkills = skillsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const completedSubjects = subjectsInput
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const response = await fetch("/api/ai/skill-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetCareer: targetCareer.trim(),
          currentSkills,
          completedSubjects,
          assessmentResults: resolvedRequestData.assessmentResults,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze skill gap");
      }

      const result = await response.json();
      setData(result.data);
      setShowInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <Card className={cn("border-orange-200", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-orange-500 mx-auto" />
            <p className="text-gray-600">Analyzing your skill gap...</p>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-700">{error}</p>
            <Button onClick={() => setError(null)} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Input form
  if (showInput || !data) {
    return (
      <Card className={cn("border-orange-200 bg-gradient-to-br from-orange-50 to-white", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-orange-500" />
            AI Skill Gap Analyzer
          </CardTitle>
          <CardDescription>
            Discover what skills you need to develop for your dream career
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Target Career <span className="text-red-500">*</span>
              </label>
              <Input
                value={targetCareer}
                onChange={(e) => setTargetCareer(e.target.value)}
                placeholder="e.g., Software Engineer, Doctor, Teacher"
                className="w-full"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Current Skills (optional)
              </label>
              <Input
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="e.g., JavaScript, HTML, CSS, Problem Solving"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Separate skills with commas</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Completed Subjects (optional)
              </label>
              <Input
                value={subjectsInput}
                onChange={(e) => setSubjectsInput(e.target.value)}
                placeholder="e.g., Math, Science, English"
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">Separate subjects with commas</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Identify Gaps</p>
                <p className="text-xs text-gray-500">Skills you need</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Learning Resources</p>
                <p className="text-xs text-gray-500">Curated content</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Clock className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Timeline</p>
                <p className="text-xs text-gray-500">Development plan</p>
              </div>
            </div>
          </div>

          <Button
            onClick={analyzeSkillGap}
            disabled={isLoading || !targetCareer.trim()}
            className="w-full"
            style={{
              background: 'linear-gradient(135deg, rgb(249 115 22) 0%, rgb(194 65 12) 100%)',
            }}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Analyze My Skill Gap
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Overview Card */}
      <Card
        className="border-orange-200"
        style={{ background: 'linear-gradient(to right bottom, rgb(255 247 237), white)' }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-orange-500" />
                Skill Gap Analysis
              </CardTitle>
              <CardDescription>
                Target Career: <span className="font-semibold text-orange-600">{targetCareer}</span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowInput(true);
                setData(null);
              }}
            >
              Analyze New Career
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Readiness */}
          <div className="flex items-center justify-between p-6 bg-white rounded-xl border">
            <div>
              <p className="text-sm text-gray-600 mb-1">Current Skill Level</p>
              <p className="text-3xl font-bold text-gray-900">{data.currentSkillLevel}%</p>
              <p className="text-sm text-gray-500 mt-1">
                {data.currentSkillLevel >= 70
                  ? "Well on your way!"
                  : data.currentSkillLevel >= 40
                  ? "Good foundation, keep building!"
                  : "Just starting your journey"}
              </p>
            </div>
            <div className="relative w-24 h-24">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-gray-200"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - data.currentSkillLevel / 100)}`}
                  strokeLinecap="round"
                  className={cn(
                    "transition-all duration-1000",
                    data.currentSkillLevel >= 70
                      ? "text-green-500"
                      : data.currentSkillLevel >= 40
                      ? "text-orange-500"
                      : "text-red-500"
                  )}
                />
              </svg>
            </div>
          </div>

          {/* Timeline */}
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Clock className="w-5 h-5 text-orange-600" />
            <div>
              <p className="text-sm font-medium text-gray-900">Estimated Timeline</p>
              <p className="text-sm text-gray-600">{data.timeline} to reach required skill level</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            Skill Breakdown
          </CardTitle>
          <CardDescription>How your current skills compare to requirements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.skillBreakdown.map((skill, index) => (
              <SkillBar key={index} skill={skill} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strengths */}
      {data.strengths && data.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Your Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.strengths.map((strength, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 p-3 bg-green-50 rounded-lg border border-green-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Priority Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="w-5 h-5 text-orange-500" />
            Priority Skills to Develop
          </CardTitle>
          <CardDescription>Focus on these skills for maximum impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.priorityGaps.map((gap, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <span className="font-medium text-gray-900">{gap}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-purple-500" />
            Learning Resources
          </CardTitle>
          <CardDescription>Curated resources to help you bridge the gap</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.learningResources.map((resource, index) => (
              <ResourceCard
                key={index}
                resource={resource}
                onClick={() => onResourceClick?.(resource)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {data.recommendations && data.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {data.recommendations.map((recommendation, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm text-gray-700 pt-0.5">{recommendation}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* Re-analyze button */}
      <Button
        onClick={() => {
          setShowInput(true);
          setData(null);
        }}
        variant="outline"
        className="w-full"
      >
        <GraduationCap className="w-4 h-4 mr-2" />
        Analyze Different Career
      </Button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface SkillBarProps {
  skill: SkillBreakdown;
}

function SkillBar({ skill }: SkillBarProps) {
  const getCategoryColor = (category?: string) => {
    switch (category) {
      case "technical":
        return "bg-blue-500";
      case "soft":
        return "bg-purple-500";
      case "academic":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getGapColor = (gap: number) => {
    if (gap <= 20) return "text-green-600 bg-green-100";
    if (gap <= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{skill.skill}</span>
          <Badge variant="outline" className="text-xs capitalize">
            {skill.category || "general"}
          </Badge>
        </div>
        <span className={cn("text-sm font-medium px-2 py-0.5 rounded", getGapColor(skill.gap))}>
          {skill.gap}% gap
        </span>
      </div>

      <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
        {/* Required level bar */}
        <div
          className={cn("absolute top-0 left-0 h-full opacity-30", getCategoryColor(skill.category))}
          style={{ width: `${skill.required}%` }}
        />
        {/* Current level bar */}
        <div
          className={cn("absolute top-0 left-0 h-full", getCategoryColor(skill.category))}
          style={{ width: `${skill.current}%` }}
        />
        {/* Labels */}
        <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-medium">
          <span className="text-gray-700">Current: {skill.current}%</span>
          <span className="text-gray-500">Required: {skill.required}%</span>
        </div>
      </div>
    </div>
  );
}

interface ResourceCardProps {
  resource: LearningResource;
  onClick?: () => void;
}

function ResourceCard({ resource, onClick }: ResourceCardProps) {
  const getTypeIcon = () => {
    switch (resource.type) {
      case "course":
        return <GraduationCap className="w-4 h-4 text-blue-500" />;
      case "video":
        return <ExternalLink className="w-4 h-4 text-red-500" />;
      case "article":
        return <BookOpen className="w-4 h-4 text-green-500" />;
      case "book":
        return <BookOpen className="w-4 h-4 text-purple-500" />;
      case "practice":
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 rounded-lg border transition-colors cursor-pointer",
        onClick ? "hover:bg-gray-50" : ""
      )}
      onClick={onClick}
    >
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
        {getTypeIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">{resource.title}</h4>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-500 capitalize">{resource.type}</span>
          {resource.provider && (
            <>
              <span className="text-gray-300">•</span>
              <span className="text-xs text-gray-500">{resource.provider}</span>
            </>
          )}
          {resource.free !== undefined && (
            <>
              <span className="text-gray-300">•</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-xs px-1.5 py-0",
                  resource.free ? "text-green-600 border-green-300" : "text-gray-600"
                )}
              >
                {resource.free ? "Free" : "Paid"}
              </Badge>
            </>
          )}
        </div>
      </div>

      {onClick && <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AISkillGapAnalyzer;
