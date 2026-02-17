/**
 * AI SCHOLARSHIP MATCHER COMPONENT
 *
 * Client component that displays AI-powered scholarship matching
 * Shows matched scholarships, application tips, and document requirements
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  GraduationCap,
  Calendar,
  FileText,
  TrendingUp,
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Filter,
  Clock,
  Award,
  Building2,
  Globe,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export interface MatchedScholarship {
  name: string;
  provider: string;
  type: "government" | "rub" | "private" | "merit-based" | "need-based" | "international";
  amount?: string;
  eligibility: string[];
  deadline: string;
  deadlineDate?: Date;
  applicationProcess: string[];
  documentsNeeded: string[];
  matchScore: number;
  description: string;
}

export interface ScholarshipMatcherResponse {
  matchedScholarships: MatchedScholarship[];
  applicationTips: string[];
  generalAdvice: string[];
  eligibilitySummary: string;
  totalScholarships: number;
  highPriorityCount: number;
  disclaimer: string;
}

export interface ScholarshipMatcherRequest {
  academicPerformance?: {
    marks?: Record<string, number>;
    gpa?: number;
    class10Marks?: number;
    class12Marks?: number;
    ranking?: string;
  };
  familyIncome?: number;
  fieldOfStudy?: string;
  careerGoals?: string[];
  specialAchievements?: string[];
  interests?: string[];
  currentClass?: string;
}

export interface AIScholarshipMatcherProps {
  initialData?: ScholarshipMatcherResponse;
  requestData?: ScholarshipMatcherRequest;
  onScholarshipClick?: (scholarship: MatchedScholarship) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AIScholarshipMatcher({
  initialData,
  requestData = {},
  onScholarshipClick,
  className,
  compact = false,
}: AIScholarshipMatcherProps) {
  const [data, setData] = useState<ScholarshipMatcherResponse | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(!initialData && Object.keys(requestData).length === 0);

  // Form state
  const [formData, setFormData] = useState<ScholarshipMatcherRequest>({
    ...requestData,
    academicPerformance: requestData.academicPerformance || {},
  });

  async function findScholarships() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/scholarships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to find scholarships");
      }

      const result = await response.json();
      setData(result.data);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function getFilteredScholarships() {
    if (!data) return [];

    if (filter === "all") return data.matchedScholarships;
    if (filter === "high-priority") return data.matchedScholarships.filter((s) => s.matchScore >= 70);
    return data.matchedScholarships.filter((s) => s.type === filter);
  }

  function getDaysUntilDeadline(deadline?: Date): number | null {
    if (!deadline) return null;
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  if (isLoading) {
    return (
      <Card className={cn("border-green-200", className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-green-500 mx-auto" />
              <DollarSign className="w-8 h-8 text-yellow-500 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="text-gray-700 font-medium">Finding matching scholarships...</p>
            <p className="text-sm text-gray-500">Searching opportunities for you</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-700">{error}</p>
            <Button onClick={findScholarships} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return <ScholarshipForm formData={formData} onChange={setFormData} onSubmit={findScholarships} isLoading={isLoading} />;
  }

  if (!data) {
    return (
      <Card className={cn("border-green-200 bg-gradient-to-br from-green-50 to-white", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            AI Scholarship Matcher
          </CardTitle>
          <CardDescription>
            Find scholarship opportunities matched to your profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-green-100">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Find Your Perfect Scholarship</h3>
              <p className="text-sm text-gray-600">
                Get matched with scholarships available to Bhutanese students
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Building2 className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Government</p>
                <p className="text-xs text-gray-500">India, Bangladesh</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <GraduationCap className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm font-medium">RUB</p>
                <p className="text-xs text-gray-500">Local colleges</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Globe className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">International</p>
                <p className="text-xs text-gray-500">Australia, Germany</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Private</p>
                <p className="text-xs text-gray-500">Corporate funds</p>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="w-full"
            style={{
              background: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(234 179 8) 100%)',
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Find Scholarships for Me
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredScholarships = getFilteredScholarships();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Results Header */}
      <Card
        className="border-green-200"
        style={{ background: 'linear-gradient(to right, rgb(34 197 94), rgb(234 179 8))' }}
      >
        <CardHeader className="text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <Award className="w-5 h-5" />
                Your Scholarship Matches
              </CardTitle>
              <CardDescription className="text-green-100">
                {data.totalScholarships} opportunities found • {data.highPriorityCount} high priority
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              className="bg-white/20 text-white border-white/30 hover:bg-white/30"
            >
              Update Profile
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600 mr-2">Filter by:</span>
            <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
              All ({data.totalScholarships})
            </FilterButton>
            <FilterButton active={filter === "high-priority"} onClick={() => setFilter("high-priority")}>
              High Priority ({data.highPriorityCount})
            </FilterButton>
            <FilterButton active={filter === "government"} onClick={() => setFilter("government")}>
              Government
            </FilterButton>
            <FilterButton active={filter === "rub"} onClick={() => setFilter("rub")}>
              RUB
            </FilterButton>
            <FilterButton active={filter === "international"} onClick={() => setFilter("international")}>
              International
            </FilterButton>
            <FilterButton active={filter === "private"} onClick={() => setFilter("private")}>
              Private
            </FilterButton>
            <FilterButton active={filter === "need-based"} onClick={() => setFilter("need-based")}>
              Need-Based
            </FilterButton>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility Summary */}
      {data.eligibilitySummary && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-900">{data.eligibilitySummary}</p>
          </CardContent>
        </Card>
      )}

      {/* Scholarships List */}
      <div className="space-y-4">
        {filteredScholarships.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No scholarships match your current filter.</p>
                <Button
                  onClick={() => setFilter("all")}
                  variant="outline"
                  className="mt-4"
                >
                  View All Scholarships
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredScholarships.map((scholarship) => (
            <ScholarshipCard
              key={scholarship.name}
              scholarship={scholarship}
              onClick={() => onScholarshipClick?.(scholarship)}
              getDaysUntilDeadline={getDaysUntilDeadline}
            />
          ))
        )}
      </div>

      {!compact && (
        <>
          {/* Application Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Application Tips
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {data.applicationTips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-yellow-100 text-yellow-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 pt-0.5">{tip}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* General Advice */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-green-500" />
                How to Improve Your Chances
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.generalAdvice.map((advice, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{advice}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 italic text-center">{data.disclaimer}</p>
        </>
      )}

      {/* Re-match Button */}
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Finding Scholarships...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Re-match with Updated Profile
          </>
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface FilterButtonProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

function FilterButton({ active, onClick, children }: FilterButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 text-sm rounded-full transition-colors",
        active
          ? "bg-green-600 text-white"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      )}
    >
      {children}
    </button>
  );
}

interface ScholarshipCardProps {
  scholarship: MatchedScholarship;
  onClick?: () => void;
  getDaysUntilDeadline: (deadline?: Date) => number | null;
}

function ScholarshipCard({ scholarship, onClick, getDaysUntilDeadline }: ScholarshipCardProps) {
  const getTypeColor = (type: MatchedScholarship["type"]) => {
    const colors = {
      government: "bg-blue-100 text-blue-700 border-blue-200",
      rub: "bg-purple-100 text-purple-700 border-purple-200",
      private: "bg-orange-100 text-orange-700 border-orange-200",
      "merit-based": "bg-green-100 text-green-700 border-green-200",
      "need-based": "bg-pink-100 text-pink-700 border-pink-200",
      international: "bg-cyan-100 text-cyan-700 border-cyan-200",
    };
    return colors[type] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 85) return "bg-green-500";
    if (score >= 70) return "bg-blue-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-gray-500";
  };

  const daysUntil = getDaysUntilDeadline(scholarship.deadlineDate);

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        scholarship.matchScore >= 85 ? "border-green-300 ring-1 ring-green-200" : "border-gray-200"
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className="flex-shrink-0">
                <Award className={cn(
                  "w-10 h-10 rounded-lg p-2",
                  scholarship.matchScore >= 85 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
                )} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-gray-900">{scholarship.name}</h3>
                  <Badge className={cn("text-xs", getTypeColor(scholarship.type))}>
                    {scholarship.type}
                  </Badge>
                  {scholarship.matchScore >= 85 && (
                    <Badge className="bg-green-500 text-white">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Top Match
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600">{scholarship.provider}</p>
              </div>
            </div>

            {/* Match Score & Amount */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">Match Score</span>
                  <span className="font-semibold text-gray-900">{scholarship.matchScore}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getMatchScoreColor(scholarship.matchScore))}
                    style={{ width: `${scholarship.matchScore}%` }}
                  />
                </div>
              </div>
              {scholarship.amount && (
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="font-semibold text-green-600">{scholarship.amount}</p>
                </div>
              )}
            </div>

            {/* Deadline */}
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">{scholarship.deadline}</span>
              {daysUntil !== null && (
                <Badge
                  variant="outline"
                  className={cn(
                    daysUntil < 30
                      ? "bg-red-50 text-red-600 border-red-200"
                      : daysUntil < 90
                        ? "bg-yellow-50 text-yellow-600 border-yellow-200"
                        : "bg-green-50 text-green-600 border-green-200"
                  )}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {daysUntil < 0
                    ? "Deadline passed"
                    : daysUntil === 0
                      ? "Due today"
                      : daysUntil === 1
                        ? "Due tomorrow"
                        : `${daysUntil} days left`}
                </Badge>
              )}
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 mb-4">{scholarship.description}</p>

            {/* Expandable Details */}
            <ScholarshipDetails scholarship={scholarship} />
          </div>

          {onClick && (
            <div className="flex-shrink-0">
              <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ScholarshipDetailsProps {
  scholarship: MatchedScholarship;
}

function ScholarshipDetails({ scholarship }: ScholarshipDetailsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="border-t border-gray-100 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1"
      >
        {isExpanded ? "Hide" : "Show"} details
        <svg
          className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Eligibility */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Eligibility
            </h4>
            <ul className="space-y-1">
              {scholarship.eligibility.map((item, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Application Process */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              How to Apply
            </h4>
            <ol className="space-y-1">
              {scholarship.applicationProcess.map((step, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="flex-shrink-0 w-4 h-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Documents Needed */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-orange-500" />
              Documents Needed
            </h4>
            <ul className="space-y-1">
              {scholarship.documentsNeeded.map((doc, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-orange-500">•</span>
                  <span>{doc}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

interface ScholarshipFormProps {
  formData: ScholarshipMatcherRequest;
  onChange: (data: ScholarshipMatcherRequest) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

function ScholarshipForm({ formData, onChange, onSubmit, isLoading }: ScholarshipFormProps) {
  const updateField = <K extends keyof ScholarshipMatcherRequest>(
    field: K,
    value: ScholarshipMatcherRequest[K]
  ) => {
    onChange({ ...formData, [field]: value });
  };

  const updateAcademicField = <K extends keyof NonNullable<ScholarshipMatcherRequest["academicPerformance"]>>(
    field: K,
    value: NonNullable<ScholarshipMatcherRequest["academicPerformance"]>[K]
  ) => {
    onChange({
      ...formData,
      academicPerformance: { ...formData.academicPerformance, [field]: value },
    });
  };

  const toggleCareerGoal = (goal: string) => {
    const current = formData.careerGoals || [];
    const updated = current.includes(goal)
      ? current.filter((g) => g !== goal)
      : [...current, goal];
    updateField("careerGoals", updated);
  };

  const toggleAchievement = (achievement: string) => {
    const current = formData.specialAchievements || [];
    const updated = current.includes(achievement)
      ? current.filter((a) => a !== achievement)
      : [...current, achievement];
    updateField("specialAchievements", updated);
  };

  const careerOptions = [
    "Engineering",
    "Medicine/Healthcare",
    "IT/Computer Science",
    "Business/Commerce",
    "Agriculture",
    "Education/Teaching",
    "Arts/Humanities",
    "Environmental Science",
  ];

  const achievementOptions = [
    "Sports achievements",
    "Academic awards",
    "Leadership roles",
    "Community service",
    "Art/Cultural activities",
    "Technical competitions",
  ];

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-green-600" />
          Tell Us About Yourself
        </CardTitle>
        <CardDescription>
          We'll match you with scholarships based on your profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Academic Performance */}
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-gray-600" />
            Academic Performance
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="gpa">GPA (out of 4.0)</Label>
              <Input
                id="gpa"
                type="number"
                step="0.1"
                min="0"
                max="4"
                placeholder="3.5"
                value={formData.academicPerformance?.gpa || ""}
                onChange={(e) => updateAcademicField("gpa", parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="class10">Class 10 Marks (%)</Label>
              <Input
                id="class10"
                type="number"
                min="0"
                max="100"
                placeholder="75"
                value={formData.academicPerformance?.class10Marks || ""}
                onChange={(e) => updateAcademicField("class10Marks", parseFloat(e.target.value) || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="class12">Class 12 Marks (%)</Label>
              <Input
                id="class12"
                type="number"
                min="0"
                max="100"
                placeholder="80"
                value={formData.academicPerformance?.class12Marks || ""}
                onChange={(e) => updateAcademicField("class12Marks", parseFloat(e.target.value) || undefined)}
              />
            </div>
          </div>
        </div>

        {/* Field of Study */}
        <div className="space-y-2">
          <Label htmlFor="fieldOfStudy">Field of Study / Interest</Label>
          <Select
            value={formData.fieldOfStudy || ""}
            onValueChange={(value) => updateField("fieldOfStudy", value)}
          >
            <SelectTrigger id="fieldOfStudy">
              <SelectValue placeholder="Select your field of interest" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="engineering">Engineering</SelectItem>
              <SelectItem value="medicine">Medicine / Healthcare</SelectItem>
              <SelectItem value="computer-science">Computer Science / IT</SelectItem>
              <SelectItem value="business">Business / Commerce</SelectItem>
              <SelectItem value="agriculture">Agriculture / Forestry</SelectItem>
              <SelectItem value="education">Education / Teaching</SelectItem>
              <SelectItem value="arts">Arts / Humanities</SelectItem>
              <SelectItem value="science">Pure Sciences</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Family Income */}
        <div className="space-y-2">
          <Label htmlFor="familyIncome">Annual Family Income (Nu.)</Label>
          <Input
            id="familyIncome"
            type="number"
            min="0"
            step="10000"
            placeholder="Optional - helps find need-based scholarships"
            value={formData.familyIncome || ""}
            onChange={(e) => updateField("familyIncome", parseFloat(e.target.value) || undefined)}
          />
          <p className="text-xs text-gray-500">Leave blank if you prefer not to share</p>
        </div>

        {/* Career Goals */}
        <div className="space-y-2">
          <Label>Career Goals (select all that apply)</Label>
          <div className="flex flex-wrap gap-2">
            {careerOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleCareerGoal(option)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  (formData.careerGoals || []).includes(option)
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Special Achievements */}
        <div className="space-y-2">
          <Label>Special Achievements (select all that apply)</Label>
          <div className="flex flex-wrap gap-2">
            {achievementOptions.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => toggleAchievement(option)}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-colors",
                  (formData.specialAchievements || []).includes(option)
                    ? "bg-yellow-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Current Class */}
        <div className="space-y-2">
          <Label htmlFor="currentClass">Current Class</Label>
          <Select
            value={formData.currentClass || ""}
            onValueChange={(value) => updateField("currentClass", value)}
          >
            <SelectTrigger id="currentClass">
              <SelectValue placeholder="Select your class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">Class 10</SelectItem>
              <SelectItem value="11">Class 11</SelectItem>
              <SelectItem value="12">Class 12</SelectItem>
              <SelectItem value="graduate">Graduate</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Submit Button */}
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="w-full"
          style={{
            background: 'linear-gradient(135deg, rgb(34 197 94) 0%, rgb(234 179 8) 100%)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Finding Scholarships...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Find My Scholarships
            </>
          )}
        </Button>

        {/* Privacy Note */}
        <p className="text-xs text-center text-gray-500">
          Your information is used only for scholarship matching and is kept confidential.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIScholarshipMatcher;
