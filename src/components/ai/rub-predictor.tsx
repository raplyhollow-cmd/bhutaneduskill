"use client";

/**
 * AI RUB ADMISSION PREDICTOR COMPONENT
 *
 * Client component that displays AI-powered RUB admission predictions
 * Shows admission probability for all RUB colleges, eligibility status,
 * backup options, and preparation recommendations
 */


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
  GraduationCap,
  School,
  TrendingUp,
  Target,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  BookOpen,
  Lightbulb,
  MapPin,
  Percent,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ============================================================================
// TYPES - Imported from API route
// ============================================================================

import type {
  SubjectMarks,
  CollegePrediction,
  BackupOption,
  RUBPredictorResponse,
  RUBPredictorRequest,
} from "@/app/api/ai/rub-predictor/route";

// Use RUBPredictorResponse as RUBPredictorData for consistency
type RUBPredictorData = RUBPredictorResponse;

export interface AIRUBPredictorProps {
  initialData?: RUBPredictorData;
  requestData?: RUBPredictorRequest;
  onCollegeClick?: (college: string) => void;
  className?: string;
  compact?: boolean;
}

// RUB College colors for visual distinction
const COLLEGE_COLORS: Record<string, string> = {
  CST: "from-blue-500 to-blue-600",
  CNR: "from-green-500 to-green-600",
  GCBS: "from-purple-500 to-purple-600",
  SHERUBTSE: "from-orange-500 to-orange-600",
  PCE: "from-teal-500 to-teal-600",
  SCE: "from-indigo-500 to-indigo-600",
  NRC: "from-pink-500 to-pink-600",
};

// ============================================================================
// COMPONENT
// ============================================================================

export function AIRUBPredictor({
  initialData,
  requestData = {},
  onCollegeClick,
  className,
  compact = false,
}: AIRUBPredictorProps) {
  const [data, setData] = useState<RUBPredictorData | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(!initialData);

  // Form state
  const [stream, setStream] = useState<"Science" | "Commerce" | "Arts">("Science");
  const [class12Marks, setClass12Marks] = useState<SubjectMarks>({
    english: undefined,
    mathematics: undefined,
    physics: undefined,
    chemistry: undefined,
    biology: undefined,
    economics: undefined,
  });

  // Stream-specific subjects
  const scienceSubjects = [
    { key: "english", label: "English" },
    { key: "mathematics", label: "Mathematics" },
    { key: "physics", label: "Physics" },
    { key: "chemistry", label: "Chemistry" },
    { key: "biology", label: "Biology" },
  ];

  const commerceSubjects = [
    { key: "english", label: "English" },
    { key: "mathematics", label: "Mathematics" },
    { key: "economics", label: "Economics" },
    { key: "accountancy", label: "Accountancy" },
    { key: "businessStudies", label: "Business Studies" },
  ];

  const artsSubjects = [
    { key: "english", label: "English" },
    { key: "dzongkha", label: "Dzongkha" },
    { key: "economics", label: "Economics" },
    { key: "geography", label: "Geography" },
    { key: "history", label: "History" },
  ];

  const getSubjectsForStream = (selectedStream: string) => {
    switch (selectedStream) {
      case "Commerce": return commerceSubjects;
      case "Arts": return artsSubjects;
      default: return scienceSubjects;
    }
  };

  const handleMarkChange = (subject: string, value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    setClass12Marks((prev) => ({ ...prev, [subject]: numValue }));
  };

  const calculateAggregate = (): number => {
    const marks = Object.values(class12Marks).filter((m): m is number => m !== undefined);
    if (marks.length === 0) return 0;
    return Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length);
  };

  async function predictAdmission() {
    setIsLoading(true);
    setError(null);

    try {
      const request: RUBPredictorRequest = {
        ...requestData,
        class12Marks,
        stream,
        eligibilityCriteria: true,
      };

      const response = await fetch("/api/ai/rub-predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error("Failed to predict admission chances");
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

  if (isLoading) {
    return (
      <Card className={cn("border-blue-200", className)}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto" />
            <p className="text-gray-600">Analyzing your admission chances...</p>
            <p className="text-sm text-gray-400">Evaluating RUB college eligibility</p>
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
            <Button onClick={predictAdmission} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showForm) {
    return (
      <Card className={cn("border-blue-200 bg-gradient-to-br from-blue-50 to-white", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-500" />
            AI RUB Admission Predictor
          </CardTitle>
          <CardDescription>
            Predict your admission chances to Royal University of Bhutan colleges
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Info Banner */}
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">About RUB Admission Predictor</p>
              <p className="text-blue-700">
                This AI tool analyzes your Class 12 marks and predicts your admission chances
                at all 7 RUB colleges based on historical eligibility criteria.
              </p>
            </div>
          </div>

          {/* Stream Selection */}
          <div className="space-y-2">
            <Label htmlFor="stream">Select Your Stream</Label>
            <Select value={stream} onValueChange={(value: any) => setStream(value)}>
              <SelectTrigger id="stream">
                <SelectValue placeholder="Select stream" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Science">Science</SelectItem>
                <SelectItem value="Commerce">Commerce</SelectItem>
                <SelectItem value="Arts">Arts</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Marks Input */}
          <div className="space-y-4">
            <Label>Enter Your Class 12 Marks (out of 100)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {getSubjectsForStream(stream).map((subject) => (
                <div key={subject.key} className="space-y-2">
                  <Label htmlFor={subject.key} className="text-sm">{subject.label}</Label>
                  <Input
                    id={subject.key}
                    type="number"
                    min="0"
                    max="100"
                    placeholder="75"
                    value={class12Marks[subject.key] || ""}
                    onChange={(e) => handleMarkChange(subject.key, e.target.value)}
                    className="text-center"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Aggregate Display */}
          {calculateAggregate() > 0 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
              <div className="flex items-center gap-3">
                <Percent className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium">Calculated Aggregate</p>
                  <p className="text-xs text-gray-500">Based on entered marks</p>
                </div>
              </div>
              <span className="text-2xl font-bold text-blue-600">{calculateAggregate()}%</span>
            </div>
          )}

          {/* RUB Colleges List */}
          <div className="space-y-2">
            <Label className="text-sm text-gray-600">RUB Colleges Covered</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { code: "CST", name: "College of Science & Technology" },
                { code: "CNR", name: "College of Natural Resources" },
                { code: "GCBS", name: "Gedu College of Business Studies" },
                { code: "SHERUBTSE", name: "Sherubtse College" },
                { code: "PCE", name: "Paro College of Education" },
                { code: "SCE", name: "Samtse College of Education" },
                { code: "NRC", name: "Norbuling Rigter College" },
              ].map((college) => (
                <Badge key={college.code} variant="outline" className="text-xs">
                  {college.code}
                </Badge>
              ))}
            </div>
          </div>

          {/* Predict Button */}
          <Button
            onClick={predictAdmission}
            className="w-full"
            disabled={calculateAggregate() === 0}
            style={{
              background: 'linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)',
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Predict My Admission Chances
          </Button>

          {calculateAggregate() === 0 && (
            <p className="text-xs text-center text-gray-500">
              Enter at least one subject mark to get predictions
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // Results View
  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Summary */}
      <Card
        className="border-blue-200"
        style={{ background: 'linear-gradient(to right, rgb(59 130 246), rgb(37 99 235))' }}
      >
        <CardContent className="p-6">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <GraduationCap className="w-6 h-6" />
                Your RUB Admission Predictions
              </h3>
              <p className="text-blue-100 mt-1">
                Based on your Class 12 performance
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{data.eligibilitySummary.eligibleCount}</div>
              <div className="text-sm text-blue-100">of {data.eligibilitySummary.totalColleges} eligible</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-700 leading-relaxed">{data.recommendations}</p>
        </CardContent>
      </Card>

      {/* College Predictions */}
      <div className="space-y-3">
        {data.predictions.map((prediction, index) => (
          <CollegePredictionCard
            key={prediction.collegeCode}
            prediction={prediction}
            rank={index + 1}
            onClick={() => onCollegeClick?.(prediction.college)}
          />
        ))}
      </div>

      {!compact && (
        <>
          {/* Tips Section */}
          {data.tips.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Lightbulb className="w-5 h-5 text-yellow-500" />
                  Tips to Improve Your Chances
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {data.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{tip}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Backup Options */}
          {data.backupOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-purple-500" />
                  Backup College Options
                </CardTitle>
                <CardDescription>
                  Alternative colleges to consider
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {data.backupOptions.map((option, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => onCollegeClick?.(option.college)}
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <School className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{option.college}</h4>
                        <p className="text-sm text-gray-600">{option.program}</p>
                        <p className="text-xs text-gray-500 mt-1">{option.reason}</p>
                      </div>
                      {option.eligibility ? (
                        <Badge className="bg-green-100 text-green-700">Eligible</Badge>
                      ) : (
                        <Badge variant="outline">Check Criteria</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Disclaimer */}
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4">
              <p className="text-xs text-yellow-800 flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {data.disclaimer}
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {/* Re-predict Button */}
      <Button
        onClick={() => setShowForm(true)}
        variant="outline"
        className="w-full"
      >
        <Sparkles className="w-4 h-4 mr-2" />
        Check with Different Marks
      </Button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface CollegePredictionCardProps {
  prediction: CollegePrediction;
  rank: number;
  onClick?: () => void;
}

function CollegePredictionCard({ prediction, rank, onClick }: CollegePredictionCardProps) {
  const getProbabilityColor = (probability: number) => {
    if (probability >= 80) return "text-green-600 bg-green-100 border-green-200";
    if (probability >= 60) return "text-blue-600 bg-blue-100 border-blue-200";
    if (probability >= 40) return "text-yellow-600 bg-yellow-100 border-yellow-200";
    return "text-red-600 bg-red-100 border-red-200";
  };

  const getBarColor = (probability: number) => {
    if (probability >= 80) return "bg-green-500";
    if (probability >= 60) return "bg-blue-500";
    if (probability >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const collegeGradient = COLLEGE_COLORS[prediction.collegeCode] || "from-gray-500 to-gray-600";

  return (
    <div
      className={cn(
        "p-5 rounded-xl border-2 transition-all cursor-pointer",
        rank === 1
          ? "border-blue-300 bg-gradient-to-r from-blue-50 to-white shadow-sm"
          : "border-gray-200 bg-white hover:border-gray-300"
      )}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* College Icon/Logo */}
        <div
          className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center text-white flex-shrink-0",
            `bg-gradient-to-br ${collegeGradient}`
          )}
        >
          <GraduationCap className="w-7 h-7" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <div className="flex items-center gap-2">
                {rank === 1 && (
                  <Badge className="bg-blue-500 text-white">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Top Choice
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {prediction.collegeCode}
                </Badge>
              </div>
              <h3 className="font-semibold text-gray-900 mt-1">{prediction.college}</h3>
              <p className="text-sm text-gray-600">{prediction.program}</p>
            </div>

            {/* Probability Badge */}
            <div className={cn("px-3 py-1.5 rounded-lg text-center", getProbabilityColor(prediction.probability))}>
              <div className="text-lg font-bold">{prediction.probability}%</div>
              <div className="text-xs">probability</div>
            </div>
          </div>

          {/* Eligibility Status */}
          <div className="flex items-center gap-2 mb-3">
            {prediction.eligibility ? (
              <Badge className="bg-green-100 text-green-700 border-green-200">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Eligible
              </Badge>
            ) : (
              <Badge className="bg-red-100 text-red-700 border-red-200">
                <XCircle className="w-3 h-3 mr-1" />
                Not Eligible
              </Badge>
            )}

            {prediction.requiredMarks && (
              <span className="text-xs text-gray-500">
                Your aggregate: {prediction.requiredMarks.current}% |
                Required: {prediction.requiredMarks.required}%
                {prediction.requiredMarks.gap > 0 && (
                  <span className="text-red-500"> (Gap: {prediction.requiredMarks.gap}%)</span>
                )}
              </span>
            )}
          </div>

          {/* Probability Bar */}
          <div className="mb-3">
            <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all duration-700", getBarColor(prediction.probability))}
                style={{ width: `${prediction.probability}%` }}
              />
            </div>
          </div>

          {/* Strengths */}
          {prediction.eligibility && prediction.strengths.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Strengths:</p>
              <div className="flex flex-wrap gap-1.5">
                {prediction.strengths.slice(0, 3).map((strength, index) => (
                  <span key={index} className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                    {strength}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Areas to Improve */}
          {!prediction.eligibility && prediction.areasToImprove.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-gray-700">Areas to Improve:</p>
              <div className="flex flex-wrap gap-1.5">
                {prediction.areasToImprove.map((area, index) => (
                  <span key={index} className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded">
                    {area}
                  </span>
                ))}
              </div>
            </div>
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

export default AIRUBPredictor;

// Re-export types for convenience
export type {
  SubjectMarks,
  CollegePrediction,
  BackupOption,
  RUBPredictorResponse as RUBPredictorData,
  RUBPredictorRequest,
} from "@/app/api/ai/rub-predictor/route";
