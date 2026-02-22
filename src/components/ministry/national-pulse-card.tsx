"use client";

import { useState, useEffect } from "react";
import { Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PulseMetric {
  label: string;
  value: string | number;
  trend: number;
  status: string;
}

interface AIObservation {
  text: string;
  concerns: string[];
}

interface NationalPulseCardProps {
  pulse?: {
    attendance: { current: number; trend: number; status: string };
    gnhScore: { current: number; trend: number; status: string };
    syllabusProgress: { current: number; trend: number; status: string };
  };
  aiObservation?: AIObservation;
  isLoading?: boolean;
}

export function NationalPulseCard({
  pulse,
  aiObservation,
  isLoading = false
}: NationalPulseCardProps) {
  const [isLive, setIsLive] = useState(true);

  // Pulse animation for live indicator
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fallback data for development
  const defaultPulse = {
    attendance: { current: 94.2, trend: 0.4, status: "excellent" },
    gnhScore: { current: 8.4, trend: 1.2, status: "excellent" },
    syllabusProgress: { current: 62, trend: -2.0, status: "lagging" }
  };

  const defaultObservation: AIObservation = {
    text: "National syllabus progress is lagging in Mathematics for Class 10. Recommend deploying regional mentors to Eastern Dzongkhags to hit BCSE targets.",
    concerns: [
      "Mathematics progress down 3% in Eastern region",
      "Teacher shortage in STEM subjects",
      "Exam stress interventions up 15%"
    ]
  };

  const data = pulse || defaultPulse;
  const observation = aiObservation || defaultObservation;

  const metrics: PulseMetric[] = [
    {
      label: "Avg Attendance",
      value: `${data.attendance.current}%`,
      trend: data.attendance.trend,
      status: data.attendance.status
    },
    {
      label: "GNH Wellbeing",
      value: `${data.gnhScore.current}/10`,
      trend: data.gnhScore.trend,
      status: data.gnhScore.status
    },
    {
      label: "Syllabus Progress",
      value: `${data.syllabusProgress.current}%`,
      trend: data.syllabusProgress.trend,
      status: data.syllabusProgress.status
    }
  ];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return <Minus className="w-4 h-4 text-gray-600" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "excellent":
      case "on-track":
        return "text-green-600";
      case "good":
        return "text-blue-600";
      case "lagging":
      case "concern":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border-2 border-cyan-500/30 bg-gradient-to-br from-cyan-500/5 to-transparent backdrop-blur-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border-l-4 border-cyan-500 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-transparent backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-cyan-600">
              National Strategic Pulse
            </h3>
            <p className="text-[10px] text-cyan-500/70 mt-0.5">Real-time national education indicators</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full bg-cyan-500 ${isLive ? 'animate-pulse' : ''}`} />
            <span className="px-2 py-1 rounded-full bg-cyan-500/20 text-[10px] text-cyan-700 font-bold border border-cyan-500/30">
              LIVE: ALL DZONGKHAGS
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {metrics.map((metric, index) => (
            <div key={index} className="text-center">
              <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wide mb-1">
                {metric.label}
              </p>
              <div className="flex items-center justify-center gap-2 mb-1">
                <p className="text-3xl font-bold text-gray-900">
                  {metric.value}
                </p>
                <div className="flex items-center">
                  {getTrendIcon(metric.trend)}
                  <span className={`text-xs font-medium ml-0.5 ${
                    metric.trend > 0 ? 'text-green-600' :
                    metric.trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {metric.trend > 0 ? '+' : ''}{metric.trend}%
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-medium uppercase ${getStatusColor(metric.status)}`}>
                {metric.status}
              </span>
            </div>
          ))}
        </div>

        {/* AI Observation Panel */}
        <div className="rounded-lg bg-black/5 border border-white/10 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={14} className="text-cyan-600" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
              AI Observation
            </p>
          </div>
          <p className="text-sm italic text-slate-700 leading-relaxed">
            "{observation.text}"
          </p>

          {/* Concerns */}
          {observation.concerns && observation.concerns.length > 0 && (
            <div className="mt-3 pt-3 border-t border-white/10">
              <p className="text-[10px] font-medium text-slate-600 mb-2">Key Concerns Detected:</p>
              <ul className="space-y-1">
                {observation.concerns.slice(0, 2).map((concern, i) => (
                  <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                    <span className="text-yellow-600 mt-0.5">•</span>
                    <span>{concern}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
