/**
 * SYSTEM STATUS PAGE
 *
 * Real-time monitoring of platform services
 * Features:
 * - Service health indicators
 * - Latency monitoring
 * - Live updates
 * - Incident history
 */

"use client";

import { PremiumCard } from "@/components/admin/premium-card";
import { PageWrapper } from "@/components/admin/page-wrapper";
import { LiveBadge } from "@/components/admin/live-badge";
import { useSystemStatus } from "@/hooks/use-realtime-stats";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Clock,
  Zap,
  Database,
  Server,
  Mail,
  Brain,
} from "lucide-react";
import { useState } from "react";

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency?: number;
  uptime?: number;
  lastCheck?: string;
}

interface SystemStatusData {
  services: ServiceStatus[];
  metrics: {
    activeUsers?: number;
    requestsPerMinute?: number;
    errorRate?: number;
    avgResponseTime?: number;
  };
  incidents?: Array<{
    id: string;
    title: string;
    status: "investigating" | "identified" | "monitoring" | "resolved";
    createdAt: string;
    updatedAt: string;
  }>;
}

const serviceIcons: Record<string, React.ComponentType<{ className: string }>> = {
  "Database (Neon)": Database,
  "Auth (Clerk)": Server,
  "Email Service": Mail,
  "AI Service": Brain,
  "Application Server": Server,
};

export default function SystemStatusPage() {
  const { data, isLoading, isLive } = useSystemStatus();

  // For demo purposes, use mock data if API not ready
  const systemStatus: SystemStatusData = data || {
    services: [
      { name: "Database (Neon)", status: "operational", latency: 45, uptime: 99.9 },
      { name: "Auth (Clerk)", status: "operational", latency: 120, uptime: 99.95 },
      { name: "Email Service", status: "operational", latency: 200, uptime: 98.5 },
      { name: "AI Service", status: "degraded", latency: 850, uptime: 97.0 },
    ],
    metrics: {
      activeUsers: 142,
      requestsPerMinute: 234,
      errorRate: 0.02,
      avgResponseTime: 145,
    },
    incidents: [
      {
        id: "1",
        title: "AI Service experiencing slow response times",
        status: "monitoring",
        createdAt: new Date(Date.now() - 3600000).toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Force refetch
    window.location.reload();
  };

  const getStatusColor = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "down":
        return "text-red-600";
    }
  };

  const getStatusBg = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return "bg-green-50 border-green-200";
      case "degraded":
        return "bg-yellow-50 border-yellow-200";
      case "down":
        return "bg-red-50 border-red-200";
    }
  };

  const getStatusIcon = (status: ServiceStatus["status"]) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case "down":
        return <XCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case "investigating":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "identified":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "monitoring":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const timeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <PageWrapper>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">System Status</h1>
          <p className="text-gray-500 mt-1">Real-time service monitoring</p>
        </div>
        <div className="flex items-center gap-3">
          <LiveBadge />
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="transition-all duration-150"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <PremiumCard className={`mb-6 ${getStatusBg(
        systemStatus.services.every(s => s.status === "operational")
          ? "operational"
          : systemStatus.services.some(s => s.status === "down")
          ? "down"
          : "degraded"
      )}`}>
        <div className="flex items-center gap-4">
          {systemStatus.services.every(s => s.status === "operational") ? (
            <>
              <CheckCircle className="w-8 h-8 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  All Systems Operational
                </h2>
                <p className="text-green-700">
                  All services are running normally
                </p>
              </div>
            </>
          ) : systemStatus.services.some(s => s.status === "down") ? (
            <>
              <XCircle className="w-8 h-8 text-red-500" />
              <div>
                <h2 className="text-lg font-semibold text-red-900">
                  System Outage Detected
                </h2>
                <p className="text-red-700">
                  One or more services are currently unavailable
                </p>
              </div>
            </>
          ) : (
            <>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              <div>
                <h2 className="text-lg font-semibold text-yellow-900">
                  Service Degradation
                </h2>
                <p className="text-yellow-700">
                  Some services are experiencing issues
                </p>
              </div>
            </>
          )}
        </div>
      </PremiumCard>

      {/* Services Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {systemStatus.services.map((service) => {
            const Icon = serviceIcons[service.name] || Server;
            return (
              <PremiumCard key={service.name} className={`p-4 border-l-4 ${
                service.status === "operational"
                  ? "border-l-green-500"
                  : service.status === "degraded"
                  ? "border-l-yellow-500"
                  : "border-l-red-500"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-lg ${
                        service.status === "operational"
                          ? "bg-green-100"
                          : service.status === "degraded"
                          ? "bg-yellow-100"
                          : "bg-red-100"
                      }`}
                    >
                      <Icon
                        className={`w-5 h-5 ${
                          service.status === "operational"
                            ? "text-green-600"
                            : service.status === "degraded"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{service.name}</p>
                      <p
                        className={`text-sm capitalize ${getStatusColor(
                          service.status
                        )}`}
                      >
                        {service.status}
                      </p>
                    </div>
                  </div>
                  {service.latency && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Latency</p>
                      <p className="font-mono text-sm">
                        {service.latency}{" "}
                        <span className="text-gray-500">ms</span>
                      </p>
                    </div>
                  )}
                </div>
                {service.uptime && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">30-day uptime</span>
                      <span className="font-medium text-gray-900">
                        {service.uptime}%
                      </span>
                    </div>
                  </div>
                )}
              </PremiumCard>
            );
          })}
        </div>
      </div>

      {/* Metrics */}
      {systemStatus.metrics && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PremiumCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Zap className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Active Users</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {systemStatus.metrics.activeUsers}
                  </p>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100">
                  <Server className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Requests/Min</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {systemStatus.metrics.requestsPerMinute}
                  </p>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Success Rate</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {((1 - (systemStatus.metrics.errorRate || 0)) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </PremiumCard>

            <PremiumCard className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-100">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Avg Response</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {systemStatus.metrics.avgResponseTime}{" "}
                    <span className="text-sm font-normal text-gray-500">ms</span>
                  </p>
                </div>
              </div>
            </PremiumCard>
          </div>
        </div>
      )}

      {/* Incidents */}
      {systemStatus.incidents && systemStatus.incidents.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Incidents
          </h2>
          <div className="space-y-3">
            {systemStatus.incidents.map((incident) => (
              <PremiumCard key={incident.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-gray-900">
                        {incident.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={getIncidentStatusColor(incident.status)}
                      >
                        {incident.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">
                      Updated {timeSince(incident.updatedAt)}
                    </p>
                  </div>
                </div>
              </PremiumCard>
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}
