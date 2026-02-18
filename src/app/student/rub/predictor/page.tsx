/**
 * Student RUB Admission Predictor Page
 * Predict admission chances based on BCSE results
 */

"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface Prediction {
  collegeId: string;
  collegeName: string;
  collegeLocation: string;
  programId: string;
  programName: string;
  programLevel: string;
  programField: string;
  minPercentage: number;
  admissionProbability: number;
  category: "high" | "medium" | "low";
  reasons: string[];
  suggestions: string[];
}

interface AcademicProfile {
  percentage: number;
  division: string;
  examType: string;
  examYear: number;
}

export default function StudentRUBPredictorPage() {
  const router = useRouter();
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [academicProfile, setAcademicProfile] = useState<AcademicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    fetchPredictions();
  }, []);

  const fetchPredictions = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/rub/predictor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      if (data.success) {
        setPredictions(data.data.predictions);
        setAcademicProfile(data.data.academicProfile);
      } else {
        setError(data.error || "Failed to generate predictions");
      }
    } catch (err) {
      console.error("Failed to fetch predictions:", err);
      setError("Failed to connect to prediction service");
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 70) return "text-green-600";
    if (probability >= 45) return "text-yellow-600";
    return "text-red-600";
  };

  const getProbabilityBarColor = (probability: number) => {
    if (probability >= 70) return "bg-green-500";
    if (probability >= 45) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      high: "High Chance",
      medium: "Medium Chance",
      low: "Reach",
    };
    return labels[category] || category;
  };

  const highChancePredictions = predictions.filter((p) => p.category === "high");
  const mediumChancePredictions = predictions.filter((p) => p.category === "medium");
  const lowChancePredictions = predictions.filter((p) => p.category === "low");

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RUB Admission Predictor</h1>
              <p className="text-sm text-gray-500 mt-1">
                Check your admission chances at RUB colleges based on your BCSE results
              </p>
            </div>
            <button
              onClick={() => router.push("/student/rub")}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
            >
              Browse Programs
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Analyzing your profile...</div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-900">{error}</h3>
            <p className="text-red-700 mt-2">
              To use the admission predictor, your BCSE results need to be imported by your school.
            </p>
            <button
              onClick={() => router.push("/student/bcse-results")}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Check BCSE Results
            </button>
          </div>
        ) : (
          <>
            {/* Academic Profile Summary */}
            {academicProfile && (
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl shadow-sm p-6 mb-6 text-white">
                <h2 className="text-lg font-semibold mb-4">Your Academic Profile</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm opacity-90">Percentage</div>
                    <div className="text-3xl font-bold">{academicProfile.percentage.toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Division</div>
                    <div className="text-xl font-semibold">{academicProfile.division}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Exam</div>
                    <div className="text-xl font-semibold">{academicProfile.examType}</div>
                  </div>
                  <div>
                    <div className="text-sm opacity-90">Year</div>
                    <div className="text-xl font-semibold">{academicProfile.examYear}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
                <div className="text-3xl font-bold text-green-600">{highChancePredictions.length}</div>
                <div className="text-sm text-gray-500">High Chance Programs</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
                <div className="text-3xl font-bold text-yellow-600">{mediumChancePredictions.length}</div>
                <div className="text-sm text-gray-500">Medium Chance Programs</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
                <div className="text-3xl font-bold text-red-600">{lowChancePredictions.length}</div>
                <div className="text-sm text-gray-500">Reach Programs</div>
              </div>
            </div>

            {/* High Chance Programs */}
            {highChancePredictions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-green-700 mb-4">🎯 High Chance Programs</h2>
                <div className="grid gap-4">
                  {highChancePredictions.map((prediction) => (
                    <div key={`${prediction.collegeId}-${prediction.programId}`} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{prediction.programName}</h3>
                          <p className="text-sm text-gray-500">{prediction.collegeName} • {prediction.collegeLocation}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-3xl font-bold ${getProbabilityColor(prediction.admissionProbability)}`}>
                            {prediction.admissionProbability}%
                          </div>
                          <div className="text-xs text-gray-500">Admission Probability</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full ${getProbabilityBarColor(prediction.admissionProbability)}`}
                          style={{ width: `${prediction.admissionProbability}%` }}
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">
                          <span className="font-medium">Why:</span> {prediction.reasons[0]}
                        </div>
                        {prediction.suggestions.length > 0 && (
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Tip:</span> {prediction.suggestions[0]}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => router.push(`/student/rub/applications?programId=${prediction.programId}`)}
                        className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                      >
                        Apply Now
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medium Chance Programs */}
            {mediumChancePredictions.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-yellow-700 mb-4">⚖️ Medium Chance Programs</h2>
                <div className="grid gap-4">
                  {mediumChancePredictions.slice(0, 5).map((prediction) => (
                    <div key={`${prediction.collegeId}-${prediction.programId}`} className="bg-white rounded-xl shadow-sm p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{prediction.programName}</h3>
                          <p className="text-sm text-gray-500">{prediction.collegeName}</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getProbabilityColor(prediction.admissionProbability)}`}>
                            {prediction.admissionProbability}%
                          </div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                        <div
                          className={`h-2 rounded-full ${getProbabilityBarColor(prediction.admissionProbability)}`}
                          style={{ width: `${prediction.admissionProbability}%` }}
                        />
                      </div>
                      <button
                        onClick={() => router.push(`/student/rub/applications?programId=${prediction.programId}`)}
                        className="mt-4 w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition font-medium"
                      >
                        Apply Anyway
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">About Admission Prediction</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Predictions are based on your BCSE results and historical admission trends</li>
                <li>• High chance (70%+): Strong likelihood of admission</li>
                <li>• Medium chance (45-70%): Competitive, admission possible</li>
                <li>• Reach (&lt;45%): Challenging but worth trying</li>
                <li>• Actual admission depends on seat availability and merit ranking</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
