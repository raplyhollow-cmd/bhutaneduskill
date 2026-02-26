"use client";

/**
 * AI CAREER PATH PREDICTOR COMPONENT
 *
 * Client component that displays AI-powered career predictions
 * Shows match probabilities, backup options, skills to develop, and next steps
 */


import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  Sparkles,
  Target,
  BookOpen,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Brain,
  Lightbulb,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { portal } from "@/styles/design-tokens";

// ============================================================================
// TYPES
// ============================================================================

export interface CareerPrediction {
  career: string;
  probability: number;
  reasons: string[];
}

export interface BackupOption {
  career: string;
  probability: number;
  reason: string;
}

export interface CareerPredictorData {
  predictions: CareerPrediction[];
  backupOptions: BackupOption[];
  skillsToDevelop: string[];
  nextSteps: string[];
  confidence: number;
  disclaimer: string;
}

export interface CareerPredictorRequest {
  hollandCode?: string;
  mbtiType?: string;
  grades?: Record<string, number>;
  interests?: string[];
  targetCareer?: string;
  completedAssessments?: number;
}

export interface AICareerPredictorProps {
  initialData?: CareerPredictorData;
  requestData?: CareerPredictorRequest;
  onCareerClick?: (career: string) => void;
  className?: string;
  compact?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function AICareerPredictor({
  initialData,
  requestData = {},
  onCareerClick,
  className,
  compact = false,
}: AICareerPredictorProps) {
  const [data, setData] = useState<CareerPredictorData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function analyzeCareerPotential() {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/career-predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        throw new Error("Failed to analyze career potential");
      }

      const result = await response.json();
      setData(result.data);
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
            <p className="text-gray-600">Analyzing your career potential...</p>
            <p className="text-sm text-gray-400">This may take a few seconds</p>
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
            <Button onClick={analyzeCareerPotential} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className={cn("border-orange-200 bg-gradient-to-br from-orange-50 to-white", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-orange-500" />
            AI Career Path Predictor
          </CardTitle>
          <CardDescription>
            Discover your career potential with AI-powered predictions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-orange-100">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Predict Your Career Success</h3>
              <p className="text-sm text-gray-600">
                Get personalized career predictions based on your assessments
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Target className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm font-medium">Match Probability</p>
                <p className="text-xs text-gray-500">Success prediction</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <Lightbulb className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Skills Analysis</p>
                <p className="text-xs text-gray-500">What to develop</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border">
              <GraduationCap className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Backup Options</p>
                <p className="text-xs text-gray-500">Alternative paths</p>
              </div>
            </div>
          </div>

          <Button
            onClick={analyzeCareerPotential}
            className="w-full"
            style={{
              background: portal.student.gradient,
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Analyze My Career Potential
          </Button>

          {requestData.completedAssessments === 0 && (
            <p className="text-xs text-center text-gray-500">
              Complete more assessments for better predictions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Predictions Card */}
      <Card className="border-orange-200">
        <CardHeader
          className="text-white"
          style={{ background: `linear-gradient(to right, ${portal.student.primary}, ${portal.student.primaryDark})` }}
        >
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                Your Career Predictions
              </CardTitle>
              <CardDescription className="text-orange-100">
                Based on your assessment results
              </CardDescription>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {data.confidence}% confidence
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {/* Top Predictions */}
          <div className="space-y-3">
            {data.predictions.map((prediction, index) => (
              <PredictionCard
                key={prediction.career}
                prediction={prediction}
                rank={index + 1}
                onClick={() => onCareerClick?.(prediction.career)}
              />
            ))}
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 italic">{data.disclaimer}</p>
        </CardContent>
      </Card>

      {!compact && (
        <>
          {/* Skills to Develop */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-yellow-500" />
                Skills to Develop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.skillsToDevelop.map((skill, index) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <CheckCircle2 className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                    <span className="text-sm">{skill}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Backup Options */}
          {data.backupOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-blue-500" />
                  Backup Career Options
                </CardTitle>
                <CardDescription>
                  Alternative paths that also match your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.backupOptions.map((option) => (
                    <div
                      key={option.career}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onCareerClick?.(option.career)}
                    >
                      <div>
                        <h4 className="font-medium text-gray-900">{option.career}</h4>
                        <p className="text-sm text-gray-600">{option.reason}</p>
                      </div>
                      <Badge variant="outline">{option.probability}%</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Next Steps */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="w-5 h-5 text-green-500" />
                Next Steps
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {data.nextSteps.map((step, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                      {index + 1}
                    </span>
                    <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </>
      )}

      {/* Re-analyze Button */}
      <Button
        onClick={analyzeCareerPotential}
        variant="outline"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Re-analyze with Updated Data
          </>
        )}
      </Button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PredictionCardProps {
  prediction: CareerPrediction;
  rank: number;
  onClick?: () => void;
}

function PredictionCard({ prediction, rank, onClick }: PredictionCardProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 85) return "text-green-600 bg-green-100";
    if (probability >= 70) return "text-blue-600 bg-blue-100";
    return "text-yellow-600 bg-yellow-100";
  };

  const getBarColor = (probability: number) => {
    if (probability >= 85) return "bg-green-500";
    if (probability >= 70) return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border-2 transition-all cursor-pointer",
        rank === 1 ? "border-orange-300 bg-orange-50/50" : "border-gray-200 bg-white hover:border-gray-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {rank === 1 && (
              <Badge className="bg-orange-500 text-white">
                <Sparkles className="w-3 h-3 mr-1" />
                Top Match
              </Badge>
            )}
            <h3 className="font-semibold text-gray-900 truncate">{prediction.career}</h3>
          </div>

          {/* Probability Bar */}
          <div className="mt-3 space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Success Probability</span>
              <span className={cn("font-semibold px-2 py-0.5 rounded", getProbabilityColor(prediction.probability))}>
                {prediction.probability}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-500", getBarColor(prediction.probability))}
                style={{ width: `${prediction.probability}%` }}
              />
            </div>
          </div>

          {/* Reasons */}
          {prediction.reasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {prediction.reasons.slice(0, 3).map((reason, index) => (
                <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {onClick && (
          <div className="flex-shrink-0">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default AICareerPredictor;
