"use client";

import { useState, useEffect } from "react";
import {
  Shield,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface PolicyRecommendation {
  action: string;
  priority: "urgent" | "medium" | "monitor";
  rationale: string;
  targetDzongkhags?: string[];
}

interface PolicyBriefingCardProps {
  briefing?: {
    summary: string;
    concerns: string[];
    recommendations: PolicyRecommendation[];
  };
  isLoading?: boolean;
}

export function PolicyBriefingCard({
  briefing,
  isLoading = false
}: PolicyBriefingCardProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Fallback data for development
  const defaultBriefing = {
    summary: "National education indicators show strong student wellbeing and attendance, but academic progress requires attention in Eastern dzongkhags.",
    concerns: [
      "Syllabus progress lagging in Mathematics for Class 10 nationally",
      "Eastern dzongkhags showing 15% lower assessment completion",
      "Teacher-student ratio in remote areas exceeds 35:1"
    ],
    recommendations: [
      {
        action: "Deploy regional Mathematics mentors to Eastern dzongkhags",
        priority: "urgent" as const,
        rationale: "Class 10 Mathematics syllabus progress at 58% in Eastern region vs 72% national average",
        targetDzongkhags: ["Lhuntse", "Trashiyangtse", "Mongar", "Trashigang"]
      },
      {
        action: "Fast-track teacher recruitment for STEM subjects",
        priority: "urgent" as const,
        rationale: "Critical shortage of 180 Mathematics and Science teachers identified",
        targetDzongkhags: ["Lhuntse", "Zhemgang", "Sarpang"]
      },
      {
        action: "Initiate national mindfulness break for Class 10/12 students",
        priority: "medium" as const,
        rationale: "Counselor reports show 22% increase in exam-related stress interventions"
      },
      {
        action: "Redirect 5% of scholarships from IT to Agriculture",
        priority: "medium" as const,
        rationale: "Agriculture sector workforce deficit of 15% versus IT surplus of 12%"
      }
    ]
  };

  const data = briefing || defaultBriefing;

  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case "urgent":
        return {
          color: "text-red-600",
          bg: "bg-red-100",
          border: "border-red-200",
          icon: AlertTriangle
        };
      case "medium":
        return {
          color: "text-yellow-600",
          bg: "bg-yellow-100",
          border: "border-yellow-200",
          icon: Clock
        };
      case "monitor":
        return {
          color: "text-blue-600",
          bg: "bg-blue-100",
          border: "border-blue-200",
          icon: CheckCircle2
        };
      default:
        return {
          color: "text-gray-600",
          bg: "bg-gray-100",
          border: "border-gray-200",
          icon: Shield
        };
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-500/10 to-transparent backdrop-blur-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-64"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-purple-200/50 bg-gradient-to-br from-purple-500/10 via-cyan-500/5 to-transparent backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-purple-600" />
          <h3 className="text-xs font-black uppercase tracking-widest text-purple-600">
            AI Policy Briefing
          </h3>
          <span className="ml-auto text-[10px] text-purple-500/70">
            DOE Advisory
          </span>
        </div>

        {/* Summary */}
        <p className="text-sm text-gray-700 mb-6 leading-relaxed">
          {data.summary}
        </p>

        {/* Recommendations */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
            Recommended Actions
          </p>

          {data.recommendations.map((rec, index) => {
            const config = getPriorityConfig(rec.priority);
            const Icon = config.icon;
            const isExpanded = expandedIndex === index;

            return (
              <div
                key={index}
                className={`rounded-lg border ${config.border} ${config.bg} overflow-hidden transition-all`}
              >
                <button
                  onClick={() => setExpandedIndex(isExpanded ? null : index)}
                  className="w-full px-4 py-3 flex items-start gap-3 text-left"
                >
                  <div className={`p-1.5 rounded ${config.bg} mt-0.5`}>
                    <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 leading-tight">
                        {rec.action}
                      </p>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${config.bg} ${config.color}`}>
                        {rec.priority}
                      </span>
                      {rec.targetDzongkhags && rec.targetDzongkhags.length > 0 && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-600">
                          <MapPin className="w-3 h-3" />
                          <span>{rec.targetDzongkhags.slice(0, 2).join(", ")}{rec.targetDzongkhags.length > 2 ? ` +${rec.targetDzongkhags.length - 2}` : ""}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-3 pt-0">
                    <div className="pt-3 border-t border-black/5">
                      <p className="text-xs text-gray-700 leading-relaxed">
                        <span className="font-medium">Rationale:</span> {rec.rationale}
                      </p>
                      <button className="mt-3 flex items-center gap-2 text-xs font-medium text-purple-700 hover:text-purple-800 transition-colors">
                        <span>View Implementation Plan</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Concerns Footer */}
        {data.concerns && data.concerns.length > 0 && (
          <div className="mt-6 pt-4 border-t border-purple-200/30">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-yellow-600" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                Detected Concerns
              </p>
            </div>
            <ul className="space-y-1">
              {data.concerns.map((concern, i) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{concern}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
