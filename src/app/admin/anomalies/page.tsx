"use client";

/**
 * PLATFORM ADMIN - ANOMALIES DASHBOARD
 *
 * System monitoring page showing anomalies detected by AI Sentinel.
 * Displays anomalies by severity with filtering and trends.
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  AlertCircle,
  AlertOctagon,
  Info,
  RefreshCw,
  Filter,
  ChevronDown,
  ChevronUp,
  School,
  FileText,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  XCircle,
  Calendar,
  Search,
  Loader2,
  Bell,
  Shield,
  Zap,
  Lightbulb,
} from "lucide-react";
import { logger } from "@/lib/logger";

// Anomaly types matching the AI Sentinel detector
type AnomalySeverity = "critical" | "high" | "medium" | "low";
type AnomalyType = "seat_limit" | "overdue_payment" | "low_engagement" | "api_error" | "system_health";
type AnomalyEntityType = "school" | "invoice" | "user" | "system";

interface AnomalyDetection {
  severity: AnomalySeverity;
  type: AnomalyType;
  entityId: string;
  entityType: AnomalyEntityType;
  title: string;
  message: string;
  suggestedAction?: string;
  metadata?: Record<string, unknown>;
}

interface AnomalySummary {
  critical: number;
  high: number;
  medium: number;
  low: number;
  total: number;
}

interface SITREPData {
  reportDate: string;
  timestamp: string;
  healthStatus: "healthy" | "degraded" | "critical";
  anomalies: {
    anomalies: AnomalyDetection[];
    summary: AnomalySummary;
  };
}

type FilterType = "all" | AnomalySeverity;
type DateRange = "24h" | "7d" | "30d" | "all";

export default function AnomaliesPage() {
  const router = useRouter();
  const [sitrep, setSitrep] = useState<SITREPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAnomalies, setExpandedAnomalies] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/sitrep?ai=false&force=true");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const result = await response.json();
      setSitrep(result.data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load anomalies";
      setError(errorMessage);
      logger.error("Error loading anomalies:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadAnomalies();
    setIsRefreshing(false);
  };

  const toggleExpanded = (anomalyId: string) => {
    const newExpanded = new Set(expandedAnomalies);
    if (newExpanded.has(anomalyId)) {
      newExpanded.delete(anomalyId);
    } else {
      newExpanded.add(anomalyId);
    }
    setExpandedAnomalies(newExpanded);
  };

  const getFilteredAnomalies = (): AnomalyDetection[] => {
    if (!sitrep?.anomalies?.anomalies) return [];

    let filtered = [...sitrep.anomalies.anomalies];

    // Filter by severity
    if (filter !== "all") {
      filtered = filtered.filter((a) => a.severity === filter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(query) ||
          a.message.toLowerCase().includes(query) ||
          a.entityType.toLowerCase().includes(query) ||
          a.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const filteredAnomalies = getFilteredAnomalies();
  const summary = sitrep?.anomalies?.summary || { critical: 0, high: 0, medium: 0, low: 0, total: 0 };

  const getSeverityConfig = (severity: AnomalySeverity) => {
    switch (severity) {
      case "critical":
        return {
          icon: AlertOctagon,
          color: "bg-red-50 text-red-700 border-red-200",
          badge: "ceramic-error",
          label: "Critical",
        };
      case "high":
        return {
          icon: AlertTriangle,
          color: "bg-orange-50 text-orange-700 border-orange-200",
          badge: "ceramic-warning",
          label: "High",
        };
      case "medium":
        return {
          icon: AlertCircle,
          color: "bg-yellow-50 text-yellow-700 border-yellow-200",
          badge: "ceramic-warning",
          label: "Medium",
        };
      case "low":
        return {
          icon: Info,
          color: "bg-blue-50 text-blue-700 border-blue-200",
          badge: "ceramic-info",
          label: "Low",
        };
    }
  };

  const getTypeIcon = (type: AnomalyType) => {
    switch (type) {
      case "seat_limit":
        return Users;
      case "overdue_payment":
        return FileText;
      case "low_engagement":
        return Activity;
      case "api_error":
        return Zap;
      case "system_health":
        return Shield;
      default:
        return AlertCircle;
    }
  };

  const getEntityTypeColor = (entityType: AnomalyEntityType) => {
    switch (entityType) {
      case "school":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "invoice":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "user":
        return "bg-green-50 text-green-700 border-green-200";
      case "system":
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const handleAnomalyClick = (anomaly: AnomalyDetection) => {
    // Navigate to relevant page based on anomaly type
    switch (anomaly.entityType) {
      case "school":
        router.push(`/admin/schools/${anomaly.entityId}`);
        break;
      case "invoice":
        if (anomaly.metadata?.schoolId) {
          router.push(`/admin/schools/${anomaly.metadata.schoolId as string}?tab=billing`);
        }
        break;
      default:
        // For other types, just expand details
        toggleExpanded(anomaly.entityId);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-ceramic-primary">
            Anomaly Detection
          </h1>
          <p className="text-ceramic-secondary mt-1">
            System monitoring alerts detected by AI Sentinel
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          Refresh
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 text-red-700 rounded-lg flex items-center gap-2">
          <XCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !sitrep ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mb-4" />
          <p className="text-gray-600">Loading anomaly data...</p>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Overall Health */}
            <Card className={sitrep?.healthStatus === "critical" ? "border-red-300 bg-red-50" : sitrep?.healthStatus === "degraded" ? "border-yellow-300 bg-yellow-50" : "border-green-300 bg-green-50"}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${
                    sitrep?.healthStatus === "critical" ? "bg-red-500" :
                    sitrep?.healthStatus === "degraded" ? "bg-yellow-500" :
                    "bg-green-500"
                  }`} />
                  <span className="text-lg font-bold capitalize text-gray-900">
                    {sitrep?.healthStatus || "Unknown"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Critical */}
            <Card className="border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-red-600" />
                  Critical
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{summary.critical}</div>
                <p className="text-xs text-gray-500 mt-1">Immediate action</p>
              </CardContent>
            </Card>

            {/* High */}
            <Card className="border-orange-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  High
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{summary.high}</div>
                <p className="text-xs text-gray-500 mt-1">Address soon</p>
              </CardContent>
            </Card>

            {/* Medium */}
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  Medium
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{summary.medium}</div>
                <p className="text-xs text-gray-500 mt-1">Monitor</p>
              </CardContent>
            </Card>

            {/* Low */}
            <Card className="border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Low
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{summary.low}</div>
                <p className="text-xs text-gray-500 mt-1">Informational</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search anomalies..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                {/* Severity Filter */}
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant={filter === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("all")}
                    style={filter === "all" ? { background: "linear-gradient(135deg, rgb(132 107 255) 0%, rgb(108 71 255) 100%)", color: "white" } : undefined}
                  >
                    All ({summary.total})
                  </Button>
                  <Button
                    variant={filter === "critical" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("critical")}
                    style={filter === "critical" ? { background: "linear-gradient(135deg, rgb(239 68 68) 0%, rgb(220 38 38) 100%)", color: "white" } : undefined}
                  >
                    Critical ({summary.critical})
                  </Button>
                  <Button
                    variant={filter === "high" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("high")}
                    style={filter === "high" ? { background: "linear-gradient(135deg, rgb(249 115 22) 0%, rgb(234 88 12) 100%)", color: "white" } : undefined}
                  >
                    High ({summary.high})
                  </Button>
                  <Button
                    variant={filter === "medium" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("medium")}
                    style={filter === "medium" ? { background: "linear-gradient(135deg, rgb(234 179 8) 0%, rgb(202 138 4) 100%)", color: "white" } : undefined}
                  >
                    Medium ({summary.medium})
                  </Button>
                  <Button
                    variant={filter === "low" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter("low")}
                    style={filter === "low" ? { background: "linear-gradient(135deg, rgb(59 130 246) 0%, rgb(37 99 235) 100%)", color: "white" } : undefined}
                  >
                    Low ({summary.low})
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anomalies List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Detected Anomalies
                <span className="text-gray-500 font-normal ml-2">
                  ({filteredAnomalies.length} of {summary.total})
                </span>
              </h2>
            </div>

            {filteredAnomalies.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No anomalies detected
                  </h3>
                  <p className="text-gray-500">
                    {filter === "all"
                      ? "All systems are operating normally. No anomalies have been detected."
                      : `No ${filter} severity anomalies found.`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredAnomalies.map((anomaly) => {
                const severityConfig = getSeverityConfig(anomaly.severity);
                const TypeIcon = getTypeIcon(anomaly.type);
                const SeverityIcon = severityConfig.icon;
                const isExpanded = expandedAnomalies.has(anomaly.entityId);

                return (
                  <Card
                    key={anomaly.entityId}
                    className={`hover:shadow-md transition-all cursor-pointer ${
                      anomaly.severity === "critical" ? "border-l-4 border-l-red-500" :
                      anomaly.severity === "high" ? "border-l-4 border-l-orange-500" :
                      ""
                    }`}
                    onClick={() => handleAnomalyClick(anomaly)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {/* Severity Icon */}
                        <div className={`p-2 rounded-lg ${severityConfig.color}`}>
                          <SeverityIcon className="w-5 h-5" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {anomaly.title}
                                </h3>
                                <Badge variant="outline" className={severityConfig.badge}>
                                  {severityConfig.label}
                                </Badge>
                                <Badge variant="outline" className={getEntityTypeColor(anomaly.entityType)}>
                                  <TypeIcon className="w-3 h-3 mr-1" />
                                  {anomaly.entityType}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {anomaly.message}
                              </p>
                            </div>

                            {/* Expand/Collapse */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleExpanded(anomaly.entityId);
                              }}
                              className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-5 h-5 text-gray-500" />
                              ) : (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                              )}
                            </button>
                          </div>

                          {/* Expanded Details */}
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-3">
                              {/* Suggested Action */}
                              {anomaly.suggestedAction && (
                                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                                  <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-xs font-semibold text-blue-700">Suggested Action</p>
                                    <p className="text-sm text-blue-600">{anomaly.suggestedAction}</p>
                                  </div>
                                </div>
                              )}

                              {/* Metadata */}
                              {anomaly.metadata && Object.keys(anomaly.metadata).length > 0 && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                                  {Object.entries(anomaly.metadata).map(([key, value]) => (
                                    <div key={key} className="p-2 bg-gray-50 rounded">
                                      <span className="text-gray-500">{key}:</span>
                                      <span className="ml-1 font-medium text-gray-700">
                                        {typeof value === "number" ? value.toLocaleString() : String(value)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex gap-2">
                                {anomaly.entityType === "school" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/admin/schools/${anomaly.entityId}`);
                                    }}
                                  >
                                    <School className="w-4 h-4 mr-1" />
                                    View School
                                  </Button>
                                )}
                                {anomaly.entityType === "invoice" && anomaly.metadata?.schoolId && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/admin/schools/${anomaly.metadata.schoolId as string}?tab=billing`);
                                    }}
                                  >
                                    <FileText className="w-4 h-4 mr-1" />
                                    View Invoice
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleExpanded(anomaly.entityId);
                                  }}
                                >
                                  Dismiss
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>

          {/* Trends Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Anomaly Trends
              </CardTitle>
              <CardDescription>
                Historical anomaly detection patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Activity className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Anomaly trend data will be available once sufficient historical data is collected.</p>
                <p className="text-sm mt-2">SITREP has been running since {sitrep?.reportDate || "recently"}.</p>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
