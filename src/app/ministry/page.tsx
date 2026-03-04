"use client";

import { logger } from "@/lib/logger";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building2,
  Users,
  GraduationCap,
  Loader2,
  Calendar,
  RefreshCw,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import Link from "next/link";
import { NationalPulseCard } from "@/components/ministry/national-pulse-card";
import { PolicyBriefingCard } from "@/components/ministry/policy-briefing-card";
import { WorkforceAlignmentCard } from "@/components/ministry/workforce-alignment-card";
import { WorkforceIntelligenceCard } from "@/components/ministry/workforce-intelligence-card";

// ============================================================================
// TYPES
// ============================================================================

interface BriefingResponse {
  pulse: {
    attendance: { current: number; trend: number; status: string };
    gnhScore: { current: number; trend: number; status: string };
    syllabusProgress: { current: number; trend: number; status: string };
  };
  aiBriefing: {
    summary: string;
    concerns: string[];
    recommendations: Array<{
      action: string;
      priority: "urgent" | "medium" | "monitor";
      rationale: string;
      targetDzongkhags?: string[];
    }>;
  };
  workforceAlignment: Array<{
    sector: string;
    studentInterest: number;
    nationalNeed: number;
    gap: number;
    status: "surplus" | "aligned" | "deficit";
  }>;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function MinistryDashboard() {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Purple/violet theme colors
  const colors = {
    primary: "rgb(168 85 247)",
    secondary: "rgb(147 51 234)",
    gradient: "linear-gradient(135deg, rgb(168 85 247) 0%, rgb(147 51 234) 100%)",
    bg: "rgb(250 245 255)",
    cyan: "rgb(6, 182, 212)",
  };

  // Load briefing data
  useEffect(() => {
    loadBriefingData();
  }, []);

  const loadBriefingData = async () => {
    try {
      const response = await fetch("/api/ministry/briefing");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setBriefing(result.data);
    } catch (err) {
      logger.error("Failed to load ministry briefing:", err);
      // Briefing remains null - components will use fallback data
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadBriefingData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Card className="max-w-md">
          <CardContent className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mr-3" />
            <p className="text-gray-600">Loading Ministry Command Center...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: colors.bg }}>
              <GraduationCap className="w-5 h-5" style={{ color: colors.primary }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Ministry Strategic Dashboard</h1>
              <p className="text-sm text-gray-500">National Command Center • Lyonpo & DOE Advisory</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Link href="/ministry/reports">
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Reports
            </Button>
          </Link>
          <Link href="/ministry/settings">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Row 1: National Pulse (spans 2 cols) */}
        <div className="lg:col-span-2">
          <NationalPulseCard
            pulse={briefing?.pulse}
            aiObservation={briefing ? {
              text: briefing.aiBriefing.summary,
              concerns: briefing.aiBriefing.concerns
            } : undefined}
            isLoading={isLoading}
          />
        </div>

        {/* Row 2: Policy Briefing (spans 2 cols) */}
        <div className="lg:col-span-2">
          <PolicyBriefingCard
            briefing={briefing?.aiBriefing}
            isLoading={isLoading}
          />
        </div>

        {/* Row 3: Workforce Alignment (spans 2 cols) */}
        <div className="lg:col-span-2">
          <WorkforceAlignmentCard
            alignment={briefing?.workforceAlignment}
            isLoading={isLoading}
          />
        </div>

        {/* Row 4: Workforce Intelligence (NEW - spans 2 cols) */}
        <div className="lg:col-span-2">
          <WorkforceIntelligenceCard targetYear={2028} isLoading={isLoading} />
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/ministry/gnh" className="group">
          <Card className="hover:shadow-lg transition-all hover:border-purple-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-purple-100 group-hover:bg-purple-200 transition-colors">
                  <BarChart3 className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">GNH Dashboard</p>
                  <p className="text-xs text-gray-500">Wellbeing Analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ministry/teacher-resources" className="group">
          <Card className="hover:shadow-lg transition-all hover:border-purple-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 group-hover:bg-blue-200 transition-colors">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Teacher Resources</p>
                  <p className="text-xs text-gray-500">Optimization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ministry/labor-market" className="group">
          <Card className="hover:shadow-lg transition-all hover:border-purple-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-100 group-hover:bg-cyan-200 transition-colors">
                  <Building2 className="w-5 h-5 text-cyan-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Workforce 2028</p>
                  <p className="text-xs text-gray-500">AI Projections</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/ministry/analytics" className="group">
          <Card className="hover:shadow-lg transition-all hover:border-purple-300">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-green-100 group-hover:bg-green-200 transition-colors">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Analytics</p>
                  <p className="text-xs text-gray-500">Deep Dive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Data Source Footer */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live data from {briefing ? "245" : "..."} schools
              </span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
            <span>Bhutan EduSkill • Ministry of Education</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
