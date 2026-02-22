"use client";

/**
 * SITREP BRIEFING COMPONENT
 *
 * Displays the daily AI-generated Situation Report.
 * Features:
 * - Monospace font for "terminal" feel
 * - Typing effect for text reveal
 * - Status indicator for health
 * - Copy to clipboard
 */

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Copy, Check, RefreshCw, Loader2 } from "lucide-react";

interface SITREPData {
  reportDate: string;
  timestamp: string;
  healthStatus: "healthy" | "degraded" | "critical";
  summary: string;
  growth?: {
    newSchools: number;
    newUsers: number;
    newStudents: number;
    growthPercentage: number;
    totalSchools: number;
    totalStudents: number;
  };
  revenue?: {
    mrr: number;
    overdueInvoices: number;
    overdueAmount: number;
    paidThisMonth: number;
  };
  activity?: {
    aiConsultations: number;
    assessmentsCompleted: number;
    topCareer: string;
    activeNow: number;
  };
  anomalies?: {
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      total: number;
    };
  };
}

interface SITREPBriefingProps {
  sitrep: SITREPData | null;
  isLoading?: boolean;
  onRefresh?: () => void;
}

const healthConfig = {
  healthy: {
    icon: "🟢",
    label: "HEALTHY",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  degraded: {
    icon: "🟡",
    label: "DEGRADED",
    color: "text-amber-500",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  critical: {
    icon: "🔴",
    label: "CRITICAL",
    color: "text-red-500",
    bg: "bg-red-500/10 border-red-500/20",
  },
};

export function SITREPBriefing({ sitrep, isLoading, onRefresh }: SITREPBriefingProps) {
  const [typedText, setTypedText] = useState("");
  const [copied, setCopied] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // Typing effect for summary
  useEffect(() => {
    if (!sitrep || isLoading) return;

    setIsTyping(true);
    setTypedText("");

    const text = sitrep.summary;
    let index = 0;

    // Fast typing for initial reveal
    const interval = setInterval(() => {
      if (index < text.length) {
        setTypedText(text.slice(0, index + 1));
        index += 3; // Type 3 chars at a time for speed
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [sitrep, isLoading]);

  const handleCopy = () => {
    if (sitrep) {
      navigator.clipboard.writeText(sitrep.summary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#050505] border border-cyan-500/20 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin" />
          <span className="text-sm font-mono text-ceramic-dimmed">
            Generating SITREP...
          </span>
        </div>
      </div>
    );
  }

  if (!sitrep) {
    return (
      <div className="bg-[#050505] border border-cyan-500/20 rounded-2xl p-8">
        <p className="text-sm text-ceramic-dimmed">No SITREP available</p>
      </div>
    );
  }

  const health = healthConfig[sitrep.healthStatus];

  return (
    <div className="bg-[#050505] border border-cyan-500/20 rounded-2xl p-8 shadow-[0_0_50px_-12px_rgba(6,182,212,0.15)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
        <div className="flex items-center gap-4">
          {/* Health Status */}
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-black tracking-widest",
            health.bg
          )}>
            <span>{health.icon}</span>
            <span className={health.color}>{health.label}</span>
          </div>

          {/* Date */}
          <div className="flex flex-col">
            <span className="text-[10px] font-black tracking-[0.3em] text-cyan-500 uppercase">
              SITREP // {sitrep.reportDate}
            </span>
            <span className="text-[10px] font-mono text-ceramic-dimmed">
              Generated at {new Date(sitrep.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-ceramic-dimmed hover:text-cyan-500 h-8"
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1" />
                Copy
              </>
            )}
          </Button>
          {onRefresh && (
            <Button
              size="sm"
              variant="ghost"
              className="text-ceramic-dimmed hover:text-cyan-500 h-8"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Briefing Content */}
      <div className="font-mono text-sm leading-relaxed text-slate-300 whitespace-pre-wrap min-h-[200px]">
        {typedText || sitrep.summary}
        {isTyping && (
          <span className="inline-block w-2 h-4 bg-cyan-500 ml-1 animate-pulse" />
        )}
      </div>

      {/* Stats Footer */}
      {(sitrep.growth || sitrep.revenue || sitrep.anomalies) && (
        <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
          {sitrep.growth && (
            <div className="text-center">
              <p className="text-[10px] text-ceramic-dimmed uppercase tracking-wider mb-1">New Students</p>
              <p className="text-xl font-bold text-white">{sitrep.growth.newStudents}</p>
            </div>
          )}
          {sitrep.revenue && (
            <div className="text-center">
              <p className="text-[10px] text-ceramic-dimmed uppercase tracking-wider mb-1">MRR</p>
              <p className="text-xl font-bold text-emerald-500">Nu.{(sitrep.revenue.mrr / 1000).toFixed(0)}K</p>
            </div>
          )}
          {sitrep.activity && (
            <div className="text-center">
              <p className="text-[10px] text-ceramic-dimmed uppercase tracking-wider mb-1">AI Consults</p>
              <p className="text-xl font-bold text-cyan-500">{sitrep.activity.aiConsultations}</p>
            </div>
          )}
          {sitrep.anomalies && (
            <div className="text-center">
              <p className="text-[10px] text-ceramic-dimmed uppercase tracking-wider mb-1">Anomalies</p>
              <p className={cn(
                "text-xl font-bold",
                sitrep.anomalies.summary.total > 0 ? "text-amber-500" : "text-emerald-500"
              )}>
                {sitrep.anomalies.summary.total}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
