"use client";

import { logger } from "@/lib/logger";
import { useState, useEffect, useCallback } from "react";
import {
  Building,
  Users,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  MapPin,
  Loader2,
  Wifi,
  Zap,
  Monitor,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// ============================================================================
// TYPES
// ============================================================================

interface InfrastructureMetrics {
  totalSchools: number;
  totalClassrooms: number;
  totalLabs: number;
  digitalClassrooms: number;
  internetConnected: number;
  smartClassrooms: number;
  capacityUtilization: number;
}

interface DzongkhagInfrastructure {
  dzongkhag: string;
  districtCode: string;
  schools: number;
  classrooms: number;
  labs: number;
  digitalInfrastructure: number; // percentage
  capacityUtilization: number;
  status: "adequate" | "strained" | "critical";
}

interface InfrastructureResponse {
  nationalMetrics: InfrastructureMetrics;
  dzongkhagData: DzongkhagInfrastructure[];
  generatedAt: string;
}

interface ApiSuccess<T> {
  data: T;
  status: number;
}

interface ApiErrorResponse {
  error: string;
  status: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function InfrastructurePage() {
  const [infraData, setInfraData] = useState<InfrastructureResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const colors = {
    primary: "rgb(168 85 247)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#ef4444",
  };

  const fetchInfraData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/ministry/infrastructure");

      if (!response.ok) {
        const errorData = (await response.json()) as ApiErrorResponse;
        throw new Error(errorData.error || "Failed to fetch infrastructure data");
      }

      const result = (await response.json()) as ApiSuccess<InfrastructureResponse>;
      setInfraData(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      logger.error("Infrastructure fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfraData();
  }, [fetchInfraData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: colors.primary }} />
          <p className="text-gray-600">Loading Infrastructure Analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={fetchInfraData} variant="outline">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback data for demonstration
  const fallbackData: InfrastructureResponse = {
    nationalMetrics: {
      totalSchools: 245,
      totalClassrooms: 4200,
      totalLabs: 680,
      digitalClassrooms: 1850,
      internetConnected: 220,
      smartClassrooms: 450,
      capacityUtilization: 87,
    },
    dzongkhagData: [
      {
        dzongkhag: "Thimphu",
        districtCode: "TH",
        schools: 45,
        classrooms: 850,
        labs: 150,
        digitalInfrastructure: 92,
        capacityUtilization: 85,
        status: "adequate",
      },
      {
        dzongkhag: "Paro",
        districtCode: "PR",
        schools: 25,
        classrooms: 420,
        labs: 75,
        digitalInfrastructure: 88,
        capacityUtilization: 82,
        status: "adequate",
      },
      {
        dzongkhag: "Lhuntse",
        districtCode: "LH",
        schools: 15,
        classrooms: 180,
        labs: 25,
        digitalInfrastructure: 45,
        capacityUtilization: 95,
        status: "critical",
      },
      {
        dzongkhag: "Wangdue",
        districtCode: "WD",
        schools: 22,
        classrooms: 350,
        labs: 55,
        digitalInfrastructure: 65,
        capacityUtilization: 90,
        status: "strained",
      },
    ],
    generatedAt: new Date().toISOString(),
  };

  const data = infraData || fallbackData;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "adequate":
        return { color: colors.success, icon: CheckCircle2, label: "Adequate" };
      case "strained":
        return { color: colors.warning, icon: AlertTriangle, label: "Strained" };
      case "critical":
        return { color: colors.danger, icon: AlertTriangle, label: "Critical" };
      default:
        return { color: "#6b7280", icon: AlertTriangle, label: "Unknown" };
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Building className="w-6 h-6" style={{ color: colors.primary }} />
            <h1 className="text-3xl font-bold text-gray-900">Infrastructure Overview</h1>
          </div>
          <p className="text-gray-600 mt-1">National school infrastructure and capacity analysis</p>
        </div>
        <Button variant="outline" onClick={fetchInfraData}>
          <Loader2 className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* National Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgb(250 245 255)" }}>
                <Building className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Schools</p>
                <p className="text-2xl font-bold text-gray-900">{data.nationalMetrics.totalSchools}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-50">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Classrooms</p>
                <p className="text-2xl font-bold text-gray-900">{data.nationalMetrics.totalClassrooms.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50">
                <GraduationCap className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Labs</p>
                <p className="text-2xl font-bold text-gray-900">{data.nationalMetrics.totalLabs}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-50">
                <Wifi className="w-6 h-6" style={{ color: colors.primary }} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Internet Connected</p>
                <p className="text-2xl font-bold text-gray-900">{data.nationalMetrics.internetConnected}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Digital Infrastructure */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Digital Infrastructure by Dzongkhag</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.dzongkhagData.map((dzongkhag) => (
                <div key={dzongkhag.districtCode} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{dzongkhag.dzongkhag}</span>
                    </div>
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{
                        background: `${getStatusConfig(dzongkhag.status).color}20`,
                        color: getStatusConfig(dzongkhag.status).color
                      }}
                    >
                      {getStatusConfig(dzongkhag.status).label}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Schools</p>
                      <p className="font-medium">{dzongkhag.schools}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Classrooms</p>
                      <p className="font-medium">{dzongkhag.classrooms}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Labs</p>
                      <p className="font-medium">{dzongkhag.labs}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Capacity</p>
                      <p className={`font-medium ${dzongkhag.capacityUtilization > 90 ? "text-red-600" : "text-gray-900"}`}>
                        {dzongkhag.capacityUtilization}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Digital Infrastructure</span>
                      <span className="font-medium">{dzongkhag.digitalInfrastructure}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${dzongkhag.digitalInfrastructure}%`,
                          background: dzongkhag.digitalInfrastructure > 80 ? colors.success :
                                 dzongkhag.digitalInfrastructure > 50 ? colors.warning : colors.danger,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>National Digital Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                <Monitor className="w-12 h-12 mx-auto mb-3" style={{ color: colors.primary }} />
                <p className="text-3xl font-bold text-gray-900">
                  {Math.round((data.nationalMetrics.digitalClassrooms / data.nationalMetrics.totalClassrooms) * 100)}%
                </p>
                <p className="text-sm text-gray-600">Classrooms Digitalized</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-gray-700">Smart Classrooms</span>
                  </div>
                  <span className="font-medium">{data.nationalMetrics.smartClassrooms}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-700">Internet Connectivity</span>
                  </div>
                  <span className="font-medium">
                    {Math.round((data.nationalMetrics.internetConnected / data.nationalMetrics.totalSchools) * 100)}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">Labs per School</span>
                  </div>
                  <span className="font-medium">
                    {(data.nationalMetrics.totalLabs / data.nationalMetrics.totalSchools).toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Capacity Alert */}
      {data.dzongkhagData.some(d => d.capacityUtilization > 90) && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium text-yellow-900">
                  {data.dzongkhagData.filter(d => d.capacityUtilization > 90).length} Dzongkhags at Critical Capacity
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  Schools in these areas are operating above 90% capacity. Consider infrastructure expansion or new school construction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
