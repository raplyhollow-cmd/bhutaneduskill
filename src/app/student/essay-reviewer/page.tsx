"use client";

/**
 * AI Essay Reviewer Page
 *
 * College application essay review with AI feedback.
 * Analyzes personal statements for content, grammar, and style.
 */

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  FileText,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import type {
  EssayReviewerRequest,
  PromptType,
} from "@/app/api/ai/essay-reviewer/route";

const PROMPT_TYPES: { value: PromptType; label: string; description: string }[] = [
  { value: "personal-statement", label: "Personal Statement", description: "General college essay about yourself" },
  { value: "common-app", label: "Common App Essay", description: "Common Application main essay" },
  { value: "supplemental-essay", label: "Supplemental Essay", description: "School-specific short essays" },
  { value: "scholarship-essay", label: "Scholarship Essay", description: "Essay for scholarship applications" },
  { value: "specific-question", label: "Specific Question", description: "Responding to a specific prompt" },
  { value: "general", label: "General Review", description: "General essay feedback" },
];

export default function EssayReviewerPage() {
  const [essayText, setEssayText] = useState("");
  const [promptType, setPromptType] = useState<PromptType>("personal-statement");
  const [targetCollege, setTargetCollege] = useState("");
  const [targetMajor, setTargetMajor] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<{
    overallScore?: number;
    strengths?: string[];
    improvements?: string[];
    grammarCorrections?: Array<{ original: string; correction: string; explanation: string }>;
    suggestedChanges?: Array<{ section: string; currentText: string; suggestion: string }>;
    wordCount?: number;
    readabilityScore?: number;
  } | null>(null);
  const [error, setError] = useState("");

  const analyzeEssay = async () => {
    if (!essayText.trim()) {
      setError("Please enter your essay text");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setResult(null);

    try {
      const request: EssayReviewerRequest = {
        essayText,
        promptType,
        targetCollege: targetCollege || undefined,
        targetMajor: targetMajor || undefined,
      };

      const response = await fetch("/api/ai/essay-reviewer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to analyze essay");
      }

      const data = await response.json();
      setResult(data.data || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze essay");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-lg bg-orange-100 text-orange-600">
            <FileText className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold">AI Essay Reviewer</h1>
        </div>
        <p className="text-muted-foreground">
          Get intelligent feedback on your college application essays
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Your Essay</CardTitle>
            <CardDescription>
              Paste your essay and get AI-powered feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Prompt Type */}
            <div>
              <Label htmlFor="prompt-type">Essay Type</Label>
              <select
                id="prompt-type"
                value={promptType}
                onChange={(e) => setPromptType(e.target.value as PromptType)}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                {PROMPT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            {/* Target College (Optional) */}
            <div>
              <Label htmlFor="target-college">
                Target College <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="target-college"
                placeholder="e.g., Harvard, Stanford"
                value={targetCollege}
                onChange={(e) => setTargetCollege(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Target Major (Optional) */}
            <div>
              <Label htmlFor="target-major">
                Intended Major <span className="text-muted-foreground">(Optional)</span>
              </Label>
              <Input
                id="target-major"
                placeholder="e.g., Computer Science, Biology"
                value={targetMajor}
                onChange={(e) => setTargetMajor(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Essay Text */}
            <div>
              <Label htmlFor="essay-text">Essay Content</Label>
              <Textarea
                id="essay-text"
                placeholder="Paste your essay here..."
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                rows={12}
                className="mt-1 font-mono text-sm"
              />
              <div className="flex justify-between mt-1 text-xs text-muted-foreground">
                <span>{essayText.trim().split(/\s+/).filter(Boolean).length} words</span>
                <span>{essayText.length} characters</span>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {/* Analyze Button */}
            <Button
              onClick={analyzeEssay}
              disabled={isAnalyzing || !essayText.trim()}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Essay
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-4">
          {result ? (
            <>
              {/* Overall Score */}
              {result.overallScore !== undefined && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Overall Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="text-5xl font-bold text-orange-600">
                        {result.overallScore}/10
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {result.overallScore >= 8
                          ? "Excellent essay!"
                          : result.overallScore >= 6
                          ? "Good essay with room for improvement"
                          : "Needs significant revision"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stats */}
              {(result.wordCount || result.readabilityScore) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Essay Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    {result.wordCount && (
                      <div>
                        <div className="text-2xl font-bold">{result.wordCount}</div>
                        <div className="text-xs text-muted-foreground">Words</div>
                      </div>
                    )}
                    {result.readabilityScore && (
                      <div>
                        <div className="text-2xl font-bold">{result.readabilityScore}/100</div>
                        <div className="text-xs text-muted-foreground">Readability</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Strengths */}
              {result.strengths && result.strengths.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle2 className="w-5 h-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.strengths.map((strength, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Improvements */}
              {result.improvements && result.improvements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-700">
                      <Lightbulb className="w-5 h-5" />
                      Suggested Improvements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {result.improvements.map((improvement, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Lightbulb className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Grammar Corrections */}
              {result.grammarCorrections && result.grammarCorrections.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <BookOpen className="w-5 h-5" />
                      Grammar & Style
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {result.grammarCorrections.map((correction, i) => (
                        <div key={i} className="p-3 bg-blue-50 rounded-md">
                          <div className="text-sm">
                            <span className="line-through text-red-600">{correction.original}</span>{" "}
                            <span className="text-green-600 font-medium">→ {correction.correction}</span>
                          </div>
                          {correction.explanation && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {correction.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-12">
                <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Enter your essay and click "Analyze Essay" to get started
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
