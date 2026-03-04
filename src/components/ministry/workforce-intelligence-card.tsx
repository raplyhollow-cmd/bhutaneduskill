"use client";

/**
 * WORKFORCE INTELLIGENCE CARD - Ministry Dashboard
 *
 * Displays:
 * - Workforce predictions by sector
 * - Regional gaps analysis
 * - AI-generated policy recommendations
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Building2,
  Users,
  GraduationCap,
  Download,
} from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

interface WorkforcePrediction {
  year: number;
  sector: string;
  projectedSupply: number;
  projectedDemand: number;
  gap: number;
  status: "surplus" | "balanced" | "deficit";
  confidence: "high" | "medium" | "low";
  rationale: string;
}

interface Recommendation {
  type: "infrastructure" | "policy" | "program" | "scholarship";
  priority: "urgent" | "high" | "medium" | "low";
  action: string;
  rationale: string;
  targetDzongkhags?: string[];
  estimatedCost?: string;
  timeline?: string;
}

interface WorkforceReport {
  generatedAt: string;
  dataSourceCount: number;
  totalStudents: number;
  predictions: WorkforcePrediction[];
  recommendations: Recommendation[];
}

interface WorkforceIntelligenceCardProps {
  targetYear?: number;
  isLoading?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function WorkforceIntelligenceCard({
  targetYear = 2028,
  isLoading = false,
}: WorkforceIntelligenceCardProps) {
  const [report, setReport] = useState<WorkforceReport | null>(null);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading) {
      fetchWorkforceData();
    }
  }, [targetYear, isLoading]);

  const fetchWorkforceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ministry/workforce?year=${targetYear}&view=full`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const result = await response.json();
      setReport(result.data);
    } catch (err) {
      console.error("Failed to fetch workforce data:", err);
      setError("Unable to load workforce intelligence");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Workforce Intelligence {targetYear}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !report) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Workforce Intelligence {targetYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            {error || "No workforce data available"}
          </div>
        </CardContent>
      </Card>
    );
  }

  const criticalDeficits = report.predictions.filter(
    (p) => p.status === "deficit" && p.gap > 100
  );
  const balancedSectors = report.predictions.filter((p) => p.status === "balanced");
  const surpluses = report.predictions.filter((p) => p.status === "surplus");

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-purple-600" />
            Workforce Intelligence {targetYear}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              <Users className="w-3 h-3 mr-1" />
              {report.dataSourceCount} schools
            </Badge>
            <Badge variant="outline" className="text-xs">
              {report.totalStudents.toLocaleString()} students
            </Badge>
          </div>
        </div>
        <p className="text-sm text-gray-500">
          AI-driven workforce projections based on student career interests, grades, and
          national economic trends
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <AlertTriangle className="w-4 h-4" />
              Critical Deficits
            </div>
            <div className="text-2xl font-bold text-red-700 mt-1">
              {criticalDeficits.length}
            </div>
            <div className="text-xs text-red-600 mt-1">Sectors need workers</div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-green-700 font-semibold text-sm">
              <CheckCircle className="w-4 h-4" />
              Balanced
            </div>
            <div className="text-2xl font-bold text-green-700 mt-1">
              {balancedSectors.length}
            </div>
            <div className="text-xs text-green-600 mt-1">Sectors on track</div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-blue-700 font-semibold text-sm">
              <TrendingUp className="w-4 h-4" />
              Surplus
            </div>
            <div className="text-2xl font-bold text-blue-700 mt-1">
              {surpluses.length}
            </div>
            <div className="text-xs text-blue-600 mt-1">Excess workers</div>
          </div>
        </div>

        {/* Workforce Predictions Table */}
        <div>
          <h3 className="font-semibold text-gray-900 mb-3">Sector Projections</h3>
          <div className="space-y-2">
            {report.predictions.slice(0, 6).map((prediction) => (
              <PredictionRow key={prediction.sector} prediction={prediction} />
            ))}
          </div>
        </div>

        {/* Critical Gaps */}
        {criticalDeficits.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h3 className="font-semibold text-amber-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical Workforce Gaps
            </h3>
            <div className="space-y-2">
              {criticalDeficits.map((deficit) => (
                <div
                  key={deficit.sector}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-amber-900">{deficit.sector}</span>
                  <span className="text-amber-700 font-semibold">
                    {deficit.gap.toLocaleString()} workers short
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {report.recommendations.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">
              AI-Generated Recommendations
            </h3>
            <div className="space-y-3">
              {report.recommendations.slice(0, 4).map((rec, idx) => (
                <RecommendationCard key={idx} recommendation={rec} />
              ))}
            </div>
          </div>
        )}

        {/* Export Button */}
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/ministry/workforce/export?format=pdf&year=${targetYear}`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`/api/ministry/workforce/export?format=csv&year=${targetYear}`, '_blank')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

function PredictionRow({ prediction }: { prediction: WorkforcePrediction }) {
  const isDeficit = prediction.status === "deficit";
  const isSurplus = prediction.status === "surplus";

  return (
    <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
          isDeficit ? "bg-red-100" : isSurplus ? "bg-blue-100" : "bg-green-100"
        }`}>
          {isDeficit ? (
            <TrendingDown className="w-4 h-4 text-red-600" />
          ) : isSurplus ? (
            <TrendingUp className="w-4 h-4 text-blue-600" />
          ) : (
            <Minus className="w-4 h-4 text-green-600" />
          )}
        </div>
        <div>
          <div className="font-medium text-gray-900">{prediction.sector}</div>
          <div className="text-xs text-gray-500">
            Demand: {prediction.projectedDemand.toLocaleString()} | Supply:{" "}
            {prediction.projectedSupply.toLocaleString()}
          </div>
        </div>
      </div>
      <div className="text-right">
        <div
          className={`font-semibold text-sm ${
            isDeficit ? "text-red-600" : isSurplus ? "text-blue-600" : "text-green-600"
          }`}
        >
          {isDeficit ? "-" : isSurplus ? "+" : ""}
          {Math.abs(prediction.gap).toLocaleString()}
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${
            isDeficit
              ? "border-red-300 text-red-700"
              : isSurplus
              ? "border-blue-300 text-blue-700"
              : "border-green-300 text-green-700"
          }`}
        >
          {prediction.status}
        </Badge>
      </div>
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: Recommendation }) {
  const priorityColors = {
    urgent: "bg-red-100 border-red-300 text-red-800",
    high: "bg-orange-100 border-orange-300 text-orange-800",
    medium: "bg-yellow-100 border-yellow-300 text-yellow-800",
    low: "bg-gray-100 border-gray-300 text-gray-800",
  };

  const typeIcons = {
    infrastructure: <Building2 className="w-4 h-4" />,
    policy: <Building2 className="w-4 h-4" />,
    program: <GraduationCap className="w-4 h-4" />,
    scholarship: <Users className="w-4 h-4" />,
  };

  return (
    <div
      className={`border rounded-lg p-4 ${
        recommendation.priority === "urgent"
          ? "bg-red-50 border-red-200"
          : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {typeIcons[recommendation.type]}
          <span className="font-semibold text-gray-900">{recommendation.action}</span>
        </div>
        <Badge
          variant="outline"
          className={`text-xs ${priorityColors[recommendation.priority]}`}
        >
          {recommendation.priority.toUpperCase()}
        </Badge>
      </div>
      <p className="text-sm text-gray-600 mb-2">{recommendation.rationale}</p>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        {recommendation.timeline && (
          <span>Timeline: {recommendation.timeline}</span>
        )}
        {recommendation.estimatedCost && (
          <span>Est. Cost: {recommendation.estimatedCost}</span>
        )}
        {recommendation.targetDzongkhags && (
          <span>
            Target: {recommendation.targetDzongkhags.slice(0, 2).join(", ")}
            {recommendation.targetDzongkhags.length > 2 && " + more"}
          </span>
        )}
      </div>
    </div>
  );
}
