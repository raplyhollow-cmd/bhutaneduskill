"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  Shield,
  RefreshCw,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar,
  School,
  User,
  Sparkles,
  Loader2,
} from "lucide-react";
import Link from "next/link";

interface RedFlag {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  flagType: string;
  status: string;
  patternDetected: {
    categories: string[];
    description: string;
    confidence: number;
  };
  aiRecommendation: string;
  gnhPrinciple: string;
  attendanceData?: {
    rate: number;
    lates: number;
    absences: number;
  };
  academicData?: {
    avgMarks: number;
    failingSubjects: string[];
  };
  createdAt: string;
  studentId: string;
  studentName: string;
  studentClass: string | null;
  schoolName: string;
  interventionId?: string;
}

interface RedFlagsResponse {
  success: boolean;
  data: {
    flags: RedFlag[];
    count: number;
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

const severityColors = {
  critical: "bg-red-100 text-red-700 border-red-300",
  high: "bg-orange-100 text-orange-700 border-orange-300",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-300",
  low: "bg-blue-100 text-blue-700 border-blue-300",
};

const severityIcons = {
  critical: <AlertTriangle className="w-4 h-4" />,
  high: <AlertCircle className="w-4 h-4" />,
  medium: <AlertCircle className="w-4 h-4" />,
  low: <AlertCircle className="w-4 h-4" />,
};

export default function RedFlagsPage() {
  const [flags, setFlags] = useState<RedFlag[]>([]);
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch red flags on load
  useEffect(() => {
    fetchRedFlags();
  }, [selectedSeverity]);

  async function fetchRedFlags() {
    try {
      setIsLoading(true);
      const url = selectedSeverity
        ? `/api/counselor/red-flags?severity=${selectedSeverity}&status=flagged`
        : "/api/counselor/red-flags?status=flagged";

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch red flags");

      const data: RedFlagsResponse = await response.json();
      setFlags(data.data.flags);
      setSummary(data.data.summary);
    } catch (err) {
      console.error("Error fetching red flags:", err);
      setError("Failed to load red flags");
    } finally {
      setIsLoading(false);
    }
  }

  async function runScan() {
    try {
      setIsScanning(true);
      const response = await fetch("/api/counselor/red-flags/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ forceRescan: true }),
      });

      if (!response.ok) throw new Error("Scan failed");

      const result = await response.json();
      // Refresh flags after scan
      await fetchRedFlags();

      // Show result
      alert(`Scan complete: ${result.data.flagsFound} new flags detected`);
    } catch (err) {
      console.error("Scan error:", err);
      alert("Scan failed. Please try again.");
    } finally {
      setIsScanning(false);
    }
  }

  async function updateFlagStatus(flagId: string, status: string, createIntervention = false) {
    try {
      const response = await fetch("/api/counselor/red-flags", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flagId, status, createIntervention }),
      });

      if (!response.ok) throw new Error("Update failed");

      // Refresh the list
      await fetchRedFlags();
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update flag status");
    }
  }

  const filteredFlags = selectedSeverity
    ? flags.filter((f) => f.severity === selectedSeverity)
    : flags;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900">Red Flag System</h1>
          </div>
          <p className="text-gray-600 mt-1">AI-powered early warning for at-risk students</p>
        </div>
        <Button
          onClick={runScan}
          disabled={isScanning}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isScanning ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Run AI Scan
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className={`${summary.critical > 0 ? "border-red-500 bg-red-50" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Critical
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-700">{summary.critical}</div>
            <p className="text-xs text-red-500 mt-1">Immediate attention</p>
          </CardContent>
        </Card>

        <Card className={`${summary.high > 0 ? "border-orange-500 bg-orange-50" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-orange-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              High
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-700">{summary.high}</div>
            <p className="text-xs text-orange-500 mt-1">Action needed</p>
          </CardContent>
        </Card>

        <Card className={`${summary.medium > 0 ? "border-yellow-500 bg-yellow-50" : ""}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Medium
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-700">{summary.medium}</div>
            <p className="text-xs text-yellow-500 mt-1">Monitor closely</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Low
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-700">{summary.low}</div>
            <p className="text-xs text-blue-500 mt-1">Keep watching</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedSeverity === null ? "default" : "outline"}
          onClick={() => setSelectedSeverity(null)}
          size="sm"
        >
          All ({flags.length})
        </Button>
        <Button
          variant={selectedSeverity === "critical" ? "default" : "outline"}
          onClick={() => setSelectedSeverity("critical")}
          size="sm"
          className={selectedSeverity === "critical" ? "bg-red-600" : ""}
        >
          Critical ({summary.critical})
        </Button>
        <Button
          variant={selectedSeverity === "high" ? "default" : "outline"}
          onClick={() => setSelectedSeverity("high")}
          size="sm"
          className={selectedSeverity === "high" ? "bg-orange-600" : ""}
        >
          High ({summary.high})
        </Button>
        <Button
          variant={selectedSeverity === "medium" ? "default" : "outline"}
          onClick={() => setSelectedSeverity("medium")}
          size="sm"
          className={selectedSeverity === "medium" ? "bg-yellow-600" : ""}
        >
          Medium ({summary.medium})
        </Button>
        <Button
          variant={selectedSeverity === "low" ? "default" : "outline"}
          onClick={() => setSelectedSeverity("low")}
          size="sm"
          className={selectedSeverity === "low" ? "bg-blue-600" : ""}
        >
          Low ({summary.low})
        </Button>
      </div>

      {/* Red Flags List */}
      {error ? (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center text-red-600">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p>{error}</p>
            <Button onClick={fetchRedFlags} variant="outline" className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : filteredFlags.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Red Flags Found</h3>
            <p className="text-gray-600 mb-4">
              {selectedSeverity
                ? `No ${selectedSeverity} severity flags currently.`
                : "Great job! No students are currently flagged."}
            </p>
            <Button onClick={runScan} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Run AI Scan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredFlags.map((flag) => (
            <Card
              key={flag.id}
              className={`border-2 ${
                flag.severity === "critical"
                  ? "border-red-300 bg-red-50/50"
                  : flag.severity === "high"
                  ? "border-orange-300 bg-orange-50/50"
                  : flag.severity === "medium"
                  ? "border-yellow-300 bg-yellow-50/50"
                  : "border-blue-200"
              }`}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge className={severityColors[flag.severity]}>
                        {severityIcons[flag.severity]}
                        <span className="ml-1 capitalize">{flag.severity}</span>
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {flag.flagType}
                      </Badge>
                      {flag.gnhPrinciple && (
                        <Badge variant="secondary" className="text-purple-700 bg-purple-100">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {flag.gnhPrinciple}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      {flag.studentName}
                      <span className="text-sm font-normal text-gray-500">
                        • Class {flag.studentClass || "N/A"}
                      </span>
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <School className="w-4 h-4" />
                        {flag.schoolName}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(flag.createdAt).toLocaleDateString()}
                      </span>
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Pattern Description */}
                  <div>
                    <h4 className="font-semibold text-sm text-gray-700 mb-1">Pattern Detected</h4>
                    <p className="text-gray-600">{flag.patternDetected.description}</p>
                    {flag.patternDetected.categories.length > 0 && (
                      <div className="flex gap-2 mt-2">
                        {flag.patternDetected.categories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Data Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-white rounded-lg border">
                    {flag.attendanceData && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Attendance</p>
                          <p className={`font-semibold ${
                            flag.attendanceData.rate < 75 ? "text-red-600" : "text-green-600"
                          }`}>
                            {flag.attendanceData.rate}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Lates</p>
                          <p className="font-semibold">{flag.attendanceData.lates}</p>
                        </div>
                      </>
                    )}
                    {flag.academicData && (
                      <>
                        <div>
                          <p className="text-xs text-gray-500">Avg Marks</p>
                          <p className={`font-semibold ${
                            flag.academicData.avgMarks < 60 ? "text-red-600" : "text-green-600"
                          }`}>
                            {flag.academicData.avgMarks}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Failing Subjects</p>
                          <p className="font-semibold">{flag.academicData.failingSubjects?.length || 0}</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* AI Recommendation */}
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-semibold text-sm text-purple-900 mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      AI Recommendation
                    </h4>
                    <p className="text-sm text-purple-800">{flag.aiRecommendation}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                    >
                      <Link href={`/counselor/students/${flag.studentId}`}>
                        <User className="w-4 h-4 mr-1" />
                        View Student
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => updateFlagStatus(flag.id, "intervention_planned", true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Create Intervention
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateFlagStatus(flag.id, "reviewed")}
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Mark Reviewed
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => updateFlagStatus(flag.id, "dismissed")}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
