"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Share2, Briefcase, TrendingUp, Target, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type AssessmentResult = {
  id: string;
  type: string;
  title: string;
  status: string;
  completedAt: string;
  results?: {
    scores?: Record<string, number>;
    hollandCode?: string;
    personalityType?: string;
    workValues?: Record<string, number>;
    primaryHollandCode?: string;
    secondaryHollandCode?: string;
    description?: string;
    strengths?: string[];
  };
  careerMatches?: Array<{
    careerId: string;
    careerTitle: string;
    matchScore: number;
    matchReason: string;
    recommendationText?: string;
    isTopMatch: boolean;
  }>;
};

export default function AssessmentResultsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [careerMatches, setCareerMatches] = useState<AssessmentResult["careerMatches"]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        // Fetch student's assessments
        const response = await fetch("/api/student/assessments");
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Failed to fetch assessments");
        }

        // Find the assessment matching this slug
        const matchedAssessment = data.assessments?.find((a: AssessmentResult) => {
          if (slug === "riasec") return a.type === "riasec";
          if (slug === "mbti") return a.type === "mbti";
          if (slug === "disc") return a.type === "disc";
          if (slug === "work-values") return a.type === "work_values";
          return a.type === slug;
        });

        if (matchedAssessment && matchedAssessment.status === "completed") {
          setAssessment(matchedAssessment);
          // Fetch career matches for this assessment
          const careerResponse = await fetch(`/api/student/career-matches?assessmentType=${matchedAssessment.type}`);
          const careerData = await careerResponse.json();
          setCareerMatches(careerData.careerMatches || []);
        } else {
          setError("Assessment not completed yet. Please complete the assessment first.");
        }
      } catch (err) {
        console.error("Failed to fetch results:", err);
        setError(err instanceof Error ? err.message : "Failed to load results");
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your results...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button asChild>
                <Link href="/student/assessment">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assessments
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-gray-600 mb-4">
                Assessment not found or not completed yet.
              </p>
              <Button asChild>
                <Link href={`/student/assessment/${slug}`}>
                  Take Assessment
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get assessment title
  const titles: Record<string, string> = {
    riasec: "RIASEC Career Interest Assessment",
    mbti: "MBTI Personality Type Assessment",
    disc: "DISC Personality Assessment",
    work_values: "Work Values Inventory",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/student/assessment">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {titles[assessment.type] || assessment.title}
          </h1>
          <p className="text-sm text-gray-500">
            Completed on {new Date(assessment.completedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Success Message */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-green-600" />
            <div>
              <h3 className="font-semibold text-green-900">Assessment Complete!</h3>
              <p className="text-sm text-green-700">
                Your results have been saved and career matches generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Content */}
      {assessment.type === "riasec" && assessment.results?.hollandCode && (
        <RIASECResults results={assessment.results} careerMatches={careerMatches} />
      )}

      {assessment.type === "mbti" && assessment.results?.personalityType && (
        <MBTIResults results={assessment.results} careerMatches={careerMatches} />
      )}

      {assessment.type === "work_values" && assessment.results?.workValues && (
        <WorkValuesResults results={assessment.results} />
      )}

      {/* Career Matches Section */}
      {careerMatches && careerMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Your Career Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {careerMatches.map((match) => (
                <div
                  key={match.careerId}
                  className={`p-4 rounded-lg border ${
                    match.isTopMatch
                      ? "border-orange-300 bg-orange-50"
                      : "border-gray-200 hover:border-gray-300"
                  } transition-colors`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{match.careerTitle}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={match.isTopMatch ? "default" : "secondary"}>
                          {match.matchScore}% Match
                        </Badge>
                        {match.isTopMatch && (
                          <Badge className="bg-orange-600 text-white">Top Match</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{match.matchReason}</p>
                  {match.recommendationText && (
                    <p className="text-sm text-gray-500">{match.recommendationText}</p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {careerMatches && careerMatches.length > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              What's Next?
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-blue-900">
                Based on your results, here are your next steps:
              </p>
              <ul className="text-sm text-blue-800 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">1.</span>
                  <span>Explore your matched careers to learn more about education requirements</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">2.</span>
                  <span>
                    Create a{" "}
                    <Link href="/student/careers/plan" className="font-semibold hover:underline">
                      Career Plan
                    </Link>{" "}
                    to track your progress
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">3.</span>
                  <span>
                    Talk to a{" "}
                    <Link href="/student/counseling" className="font-semibold hover:underline">
                      Counselor
                    </Link>{" "}
                    for guidance
                  </span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// RIASEC Results Component
function RIASECResults({ results, careerMatches }: { results: any; careerMatches: any[] }) {
  const scores = results.scores || {};
  const hollandCode = results.hollandCode || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your RIASEC Holland Code</CardTitle>
        <CardDescription>
          Your combination of traits suggests these career paths
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Holland Code Display */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white shadow-lg">
            <span className="text-3xl font-bold tracking-wider">{hollandCode}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Your Holland Code</p>
        </div>

        {/* Scores */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-4">Your Trait Scores</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { code: "R", name: "Realistic", score: scores.realistic || scores.R || 0, icon: "🔧" },
              { code: "I", name: "Investigative", score: scores.investigative || scores.I || 0, icon: "🔬" },
              { code: "A", name: "Artistic", score: scores.artistic || scores.A || 0, icon: "🎨" },
              { code: "S", name: "Social", score: scores.social || scores.S || 0, icon: "💬" },
              { code: "E", name: "Enterprising", score: scores.enterprising || scores.E || 0, icon: "📈" },
              { code: "C", name: "Conventional", score: scores.conventional || scores.C || 0, icon: "📋" },
            ].map((trait) => (
              <div key={trait.code} className="p-3 rounded-lg bg-gray-50 border">
                <div className="text-2xl mb-1">{trait.icon}</div>
                <div className="text-sm font-medium text-gray-700">{trait.name}</div>
                <div className="text-xs text-gray-500">Code: {trait.code}</div>
                <div className="mt-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                      style={{ width: `${Math.min(100, trait.score)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// MBTI Results Component
function MBTIResults({ results, careerMatches }: { results: any; careerMatches: any[] }) {
  const personalityType = results.personalityType || "";

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your MBTI Personality Type</CardTitle>
        <CardDescription>
          Understanding your personality can help you choose a fulfilling career
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Type Display */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl text-white shadow-lg">
            <span className="text-3xl font-bold tracking-wider">{personalityType}</span>
          </div>
          <p className="text-sm text-gray-500 mt-2">Your Personality Type</p>
        </div>

        {/* Description */}
        {results.description && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-900">{results.description}</p>
          </div>
        )}

        {/* Strengths */}
        {results.strengths && results.strengths.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Your Strengths</h4>
            <div className="flex flex-wrap gap-2">
              {results.strengths.map((strength: string, i: number) => (
                <Badge key={i} variant="secondary" className="px-3 py-1">
                  {strength}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Work Values Results Component
function WorkValuesResults({ results }: { results: any }) {
  const workValues = results.workValues || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Work Values</CardTitle>
        <CardDescription>
          What matters most to you in a career
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(workValues)
            .sort(([, a], [, b]) => (b as number) - (a as number))
            .slice(0, 6)
            .map(([key, value]) => (
              <div key={key} className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="text-sm font-medium text-green-900 capitalize">{key}</div>
                <div className="text-xs text-green-600 mt-1">Score: {value as number}</div>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}
