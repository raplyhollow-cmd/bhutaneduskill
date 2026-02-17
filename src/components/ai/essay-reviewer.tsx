"use client";

/**
 * AI ESSAY REVIEWER COMPONENT
 *
 * Client component that provides AI-powered essay review for
 * college applications. Offers feedback on content, grammar,
 * style, and suggestions for improvement.
 */


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  FileText,
  Edit,
  Lightbulb,
  XCircle,
  Star,
  BookOpen,
  GraduationCap,
  RefreshCw,
  Copy,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES
// ============================================================================

export type PromptType =
  | "personal-statement"
  | "specific-question"
  | "supplemental-essay"
  | "scholarship-essay"
  | "common-app"
  | "general";

export interface GrammarCorrection {
  original: string;
  correction: string;
  explanation: string;
  type: "grammar" | "spelling" | "style" | "clarity";
}

export interface RecommendedChange {
  section: string;
  currentText: string;
  suggestion: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface EssayReviewData {
  overallRating: number;
  ratingExplanation: string;
  strengths: string[];
  areasForImprovement: string[];
  grammarAndStyle: GrammarCorrection[];
  recommendedChanges: RecommendedChange[];
  wordCount: number;
  feedback: string;
}

export interface AIEssayReviewerProps {
  initialEssay?: string;
  promptType?: PromptType;
  wordLimit?: number;
  targetCollege?: string;
  targetMajor?: string;
  onReviewComplete?: (review: EssayReviewData) => void;
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const PROMPT_TYPE_OPTIONS: Array<{ value: PromptType; label: string; description: string }> = [
  {
    value: "personal-statement",
    label: "Personal Statement",
    description: "Your story and why you're a great candidate",
  },
  {
    value: "common-app",
    label: "Common App Essay",
    description: "650-word essay for Common Application",
  },
  {
    value: "supplemental-essay",
    label: "Supplemental Essay",
    description: "Additional essay for specific colleges",
  },
  {
    value: "scholarship-essay",
    label: "Scholarship Essay",
    description: "Essay for scholarship applications",
  },
  {
    value: "specific-question",
    label: "Specific Question",
    description: "Response to a specific prompt",
  },
  {
    value: "general",
    label: "General Essay",
    description: "Any other type of essay",
  },
];

// ============================================================================
// COMPONENT
// ============================================================================

export function AIEssayReviewer({
  initialEssay = "",
  promptType = "general",
  wordLimit,
  targetCollege,
  targetMajor,
  onReviewComplete,
  className,
}: AIEssayReviewerProps) {
  const [essayText, setEssayText] = useState(initialEssay);
  const [selectedPromptType, setSelectedPromptType] = useState<PromptType>(promptType);
  const [data, setData] = useState<EssayReviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  const wordCount = essayText.split(/\s+/).filter((w) => w.length > 0).length;
  const charCount = essayText.length;

  async function reviewEssay() {
    if (essayText.trim().length < 50) {
      setError("Please enter at least 50 characters for a meaningful review.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/essay-reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essayText,
          promptType: selectedPromptType,
          wordLimit,
          targetCollege,
          targetMajor,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to review essay");
      }

      const result = await response.json();
      setData(result.data);
      setShowResults(true);
      onReviewComplete?.(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setShowResults(false);
    setData(null);
    setError(null);
  }

  if (isLoading) {
    return (
      <Card className={cn("border-blue-200", className)}>
        <CardContent className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="relative w-20 h-20 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-blue-200" />
              <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-500 animate-pulse" />
            </div>
            <p className="text-gray-700 font-medium">Reviewing your essay...</p>
            <p className="text-sm text-gray-500">This may take a few seconds</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !data) {
    return (
      <Card className={cn("border-red-200", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4 max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
            <p className="text-gray-700">{error}</p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setError(null)} variant="outline">
                Try Again
              </Button>
              <Button onClick={reviewEssay}>Retry Review</Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults && data) {
    return <EssayResults data={data} onReset={handleReset} className={className} />;
  }

  return (
    <Card
      className={cn(
        "border-blue-200 bg-gradient-to-br from-blue-50 to-white",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="w-6 h-6 text-blue-500" />
          AI Essay Reviewer
        </CardTitle>
        <CardDescription>
          Get constructive feedback on your college application essay
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Prompt Type Selector */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            Essay Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PROMPT_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedPromptType(option.value)}
                className={cn(
                  "text-left p-3 rounded-lg border-2 transition-all",
                  selectedPromptType === option.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300 bg-white"
                )}
              >
                <div className="font-medium text-gray-900">{option.label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{option.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Essay Text Area */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">
              Your Essay <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>{wordCount} words</span>
              <span className="text-gray-300">|</span>
              <span>{charCount} characters</span>
            </div>
          </div>
          <Textarea
            value={essayText}
            onChange={(e) => setEssayText(e.target.value)}
            placeholder="Paste your essay here...

Tips for a great essay:
- Be authentic and true to your voice
- Show, don't tell - use specific examples
- Focus on your growth and learning
- Keep your language clear and concise"
            className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
          />
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-gray-500">
              Minimum 50 characters. Maximum 15,000 characters.
            </p>
            {wordLimit && (
              <Badge
                variant={wordCount > wordLimit ? "destructive" : "outline"}
                className="text-xs"
              >
                {wordCount} / {wordLimit} words
              </Badge>
            )}
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Grammar Check</p>
              <p className="text-xs text-gray-500">Spelling & style</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Lightbulb className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Content Feedback</p>
              <p className="text-xs text-gray-500">Strengths & growth</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
            <Edit className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Specific Suggestions</p>
              <p className="text-xs text-gray-500">Actionable edits</p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={reviewEssay}
          disabled={isLoading || essayText.trim().length < 50}
          className="w-full"
          style={{
            background: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Reviewing...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Review My Essay
            </>
          )}
        </Button>

        <p className="text-xs text-center text-gray-500">
          Your essay is processed securely. Consider this as one of several feedback sources.
        </p>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// RESULTS COMPONENT
// ============================================================================

interface EssayResultsProps {
  data: EssayReviewData;
  onReset: () => void;
  className?: string;
}

function EssayResults({ data, onReset, className }: EssayResultsProps) {
  const getRatingColor = (rating: number) => {
    if (rating >= 9) return "text-green-600";
    if (rating >= 7) return "text-blue-600";
    if (rating >= 5) return "text-yellow-600";
    return "text-orange-600";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 9) return "Excellent!";
    if (rating >= 7) return "Good work!";
    if (rating >= 5) return "Getting there!";
    return "Keep working!";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-700 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Rating Card */}
      <Card
        className="border-blue-200"
        style={{ background: 'linear-gradient(to right bottom, rgb(239 246 255), white)' }}
      >
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                Essay Review Results
              </CardTitle>
              <CardDescription>
                {data.wordCount} words reviewed
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RefreshCw className="w-4 h-4 mr-1" />
              New Essay
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="flex items-center justify-between p-6 bg-white rounded-xl border">
            <div>
              <p className="text-sm text-gray-600 mb-1">Overall Rating</p>
              <div className="flex items-center gap-3">
                <p className={cn("text-4xl font-bold", getRatingColor(data.overallRating))}>
                  {data.overallRating}
                  <span className="text-lg text-gray-400">/10</span>
                </p>
                <Badge
                  className={cn("text-sm px-3 py-1", getRatingColor(data.overallRating))}
                >
                  {getRatingLabel(data.overallRating)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">{data.ratingExplanation}</p>
            </div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "w-8 h-8",
                    star <= Math.ceil(data.overallRating / 2)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Final Feedback */}
          {data.feedback && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Lightbulb className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-700">{data.feedback}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Strengths */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-green-600">
            <CheckCircle2 className="w-5 h-5" />
            What Works Well
          </CardTitle>
          <CardDescription>Strengths to keep building on</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.strengths.map((strength, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 pt-0.5">{strength}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Areas for Improvement */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-orange-600">
            <Lightbulb className="w-5 h-5" />
            Areas for Improvement
          </CardTitle>
          <CardDescription>Focus on these to strengthen your essay</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.areasForImprovement.map((area, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <p className="text-sm text-gray-700 pt-0.5">{area}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Changes */}
      {data.recommendedChanges.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-blue-600">
              <Edit className="w-5 h-5" />
              Recommended Changes
            </CardTitle>
            <CardDescription>Specific edits with explanations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recommendedChanges.map((change, index) => (
                <div
                  key={index}
                  className="border rounded-lg overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b">
                    <span className="font-medium text-sm text-gray-900">{change.section}</span>
                    <Badge
                      variant="outline"
                      className={cn("text-xs", getPriorityColor(change.priority))}
                    >
                      {change.priority} priority
                    </Badge>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Current</p>
                      <p className="text-sm text-gray-700 bg-red-50 p-2 rounded border border-red-100">
                        {change.currentText}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Suggested</p>
                      <p className="text-sm text-gray-700 bg-green-50 p-2 rounded border border-green-100">
                        {change.suggestion}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <Lightbulb className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-gray-600">{change.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grammar & Style */}
      {data.grammarAndStyle.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-purple-600">
              <BookOpen className="w-5 h-5" />
              Grammar & Style
            </CardTitle>
            <CardDescription>Language corrections and improvements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.grammarAndStyle.map((correction, index) => (
                <div
                  key={index}
                  className="p-4 bg-purple-50 rounded-lg border border-purple-200"
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant="outline"
                      className="capitalize text-xs bg-white"
                    >
                      {correction.type}
                    </Badge>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-3 h-3 text-red-500" />
                        <p className="text-sm text-gray-700 line-through">
                          {correction.original}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <p className="text-sm text-gray-900 font-medium">
                          {correction.correction}
                        </p>
                      </div>
                      <p className="text-xs text-gray-600 pl-5">{correction.explanation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={onReset}
          variant="outline"
          className="flex-1"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Review Another Essay
        </Button>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(
              `Essay Review (Rating: ${data.overallRating}/10)\n\n${data.ratingExplanation}\n\nStrengths:\n${data.strengths.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nImprovements:\n${data.areasForImprovement.map((a, i) => `${i + 1}. ${a}`).join("\n")}\n\nFeedback: ${data.feedback}`
            );
          }}
          variant="outline"
          size="icon"
          title="Copy review"
        >
          <Copy className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AIEssayReviewer;
