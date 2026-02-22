"use client";

/**
 * PLATFORM ADMIN COMMAND CENTER
 *
 * The "Summer Wars" inspired cockpit for platform administration.
 * Features:
 * - AI SITREP briefing (left panel)
 * - Command terminal (right panel)
 * - AI presence indicator
 * - Dark theme with cyan accents
 */

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AIPresenceIndicator } from "@/components/admin/ai-presence-indicator";
import { SITREPBriefing } from "@/components/admin/sitrep-briefing";
import { CommandTerminal } from "@/components/admin/command-terminal";
import { logger } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface SITREPData {
  reportDate: string;
  timestamp: string;
  healthStatus: "healthy" | "degraded" | "critical";
  summary: string;
  growth: {
    newSchools: number;
    newUsers: number;
    newStudents: number;
    growthPercentage: number;
    totalSchools: number;
    totalStudents: number;
  };
  revenue: {
    mrr: number;
    overdueInvoices: number;
    overdueAmount: number;
    paidThisMonth: number;
  };
  activity: {
    aiConsultations: number;
    assessmentsCompleted: number;
    topCareer: string;
    activeNow: number;
  };
  anomalies: {
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
  };
}

export default function CommandCenterPage() {
  const router = useRouter();
  const [sitrep, setSitrep] = useState<SITREPData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadSITREP();
  }, []);

  const loadSITREP = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/admin/sitrep?ai=true");

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSitrep(data.data);
    } catch (error) {
      logger.error("Failed to load SITREP:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/admin/sitrep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ useAI: true }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      setSitrep(data.data);
    } catch (error) {
      logger.error("Failed to refresh SITREP:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ceramic-primary flex items-center gap-3">
            <CommandCenterIcon />
            Command Center
          </h1>
          <p className="text-ceramic-secondary mt-1">
            AI-powered platform administration cockpit
          </p>
        </div>
        <AIPresenceIndicator status="online" />
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Panel: SITREP Briefing */}
        <div className="space-y-4">
          <h2 className="text-sm font-black tracking-widest text-cyan-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
            Daily Briefing
          </h2>
          <SITREPBriefing
            sitrep={sitrep}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Right Panel: Command Terminal */}
        <div className="space-y-4">
          <h2 className="text-sm font-black tracking-widest text-cyan-500 uppercase flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            Command Terminal
          </h2>
          <CommandTerminal />
        </div>
      </div>

      {/* Quick Actions Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickActionCard
          title="Knowledge Base"
          description="Import RUB/Scholarship data"
          onClick={() => router.push("/admin/knowledge")}
          color="purple"
        />
        <QuickActionCard
          title="Anomalies"
          description={`${sitrep?.anomalies?.summary.total || 0} alerts`}
          onClick={() => router.push("/admin/anomalies")}
          color={sitrep?.anomalies?.summary.critical ? "red" : "amber"}
        />
        <QuickActionCard
          title="Schools"
          description={`${sitrep?.growth?.totalSchools || 0} institutions`}
          onClick={() => router.push("/admin/schools")}
          color="blue"
        />
        <QuickActionCard
          title="Analytics"
          description="Platform-wide insights"
          onClick={() => router.push("/admin/analytics")}
          color="green"
        />
      </div>
    </div>
  );
}

function CommandCenterIcon() {
  return (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500" />
      <circle cx="12" cy="12" r="3" fill="currentColor" className="text-cyan-500" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500" />
      <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="1.5" className="text-cyan-500" />
    </svg>
  );
}

interface QuickActionCardProps {
  title: string;
  description: string;
  onClick: () => void;
  color: "purple" | "red" | "amber" | "blue" | "green";
}

function QuickActionCard({ title, description, onClick, color }: QuickActionCardProps) {
  const colorConfig = {
    purple: "from-purple-500/10 to-purple-600/5 border-purple-500/20 hover:border-purple-500/40",
    red: "from-red-500/10 to-red-600/5 border-red-500/20 hover:border-red-500/40",
    amber: "from-amber-500/10 to-amber-600/5 border-amber-500/20 hover:border-amber-500/40",
    blue: "from-blue-500/10 to-blue-600/5 border-blue-500/20 hover:border-blue-500/40",
    green: "from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 hover:border-emerald-500/40",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border bg-gradient-to-br transition-all duration-200 hover:scale-[1.02]",
        colorConfig[color]
      )}
    >
      <h3 className="text-sm font-semibold text-ceramic-primary">{title}</h3>
      <p className="text-xs text-ceramic-secondary mt-1">{description}</p>
    </button>
  );
}
