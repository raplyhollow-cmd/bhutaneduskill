"use client";

import { useState } from "react";
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface WorkforceSector {
  sector: string;
  studentInterest: number;
  nationalNeed: number;
  gap: number;
  status: "surplus" | "aligned" | "deficit";
}

interface WorkforceAlignmentCardProps {
  alignment?: WorkforceSector[];
  isLoading?: boolean;
}

export function WorkforceAlignmentCard({
  alignment,
  isLoading = false
}: WorkforceAlignmentCardProps) {
  const [selectedSector, setSelectedSector] = useState<WorkforceSector | null>(null);

  // Fallback data for development
  const defaultAlignment: WorkforceSector[] = [
    {
      sector: "STEM / IT",
      studentInterest: 42,
      nationalNeed: 30,
      gap: 12,
      status: "surplus"
    },
    {
      sector: "Agriculture & Natural Resources",
      studentInterest: 5,
      nationalNeed: 20,
      gap: -15,
      status: "deficit"
    },
    {
      sector: "Tourism & Hospitality",
      studentInterest: 25,
      nationalNeed: 25,
      gap: 0,
      status: "aligned"
    },
    {
      sector: "Healthcare",
      studentInterest: 8,
      nationalNeed: 12,
      gap: -4,
      status: "deficit"
    },
    {
      sector: "Education / Teaching",
      studentInterest: 12,
      nationalNeed: 10,
      gap: 2,
      status: "surplus"
    },
    {
      sector: "Hydropower Engineering",
      studentInterest: 6,
      nationalNeed: 15,
      gap: -9,
      status: "deficit"
    }
  ];

  const data = alignment || defaultAlignment;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "surplus":
        return {
          color: "text-blue-600",
          bg: "bg-blue-100",
          border: "border-blue-200",
          icon: TrendingUp
        };
      case "aligned":
        return {
          color: "text-green-600",
          bg: "bg-green-100",
          border: "border-green-200",
          icon: CheckCircle2
        };
      case "deficit":
        return {
          color: "text-red-600",
          bg: "bg-red-100",
          border: "border-red-200",
          icon: AlertTriangle
        };
      default:
        return {
          color: "text-gray-600",
          bg: "bg-gray-100",
          border: "border-gray-200",
          icon: Minus
        };
    }
  };

  const getStrategicAction = (sector: WorkforceSector) => {
    if (sector.status === "deficit" && Math.abs(sector.gap) >= 10) {
      return `URGENT: Redirect national scholarships to ${sector.sector}`;
    }
    if (sector.status === "deficit") {
      return `Promote ${sector.sector} careers in counseling sessions`;
    }
    if (sector.status === "surplus" && Math.abs(sector.gap) >= 10) {
      return `Consider exporting excess talent regionally`;
    }
    return "Monitor alignment trends";
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-500/10 to-transparent backdrop-blur-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/50 bg-gradient-to-br from-slate-500/10 via-cyan-500/5 to-transparent backdrop-blur-sm shadow-lg overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-500/5 via-transparent to-transparent pointer-events-none" />

      <div className="relative p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-slate-600" />
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-600">
              Workforce Alignment
            </h3>
          </div>
          <span className="text-[10px] text-slate-500/70">
            Student Interests vs National HRD Targets
          </span>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-5 gap-4 px-4 py-2 bg-slate-100/50 rounded-t-lg">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">Sector</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">Student Interest</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">National Need</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">Gap</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center">Status</span>
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-slate-200/30">
          {data.map((sector, index) => {
            const config = getStatusConfig(sector.status);
            const StatusIcon = config.icon;

            return (
              <div
                key={index}
                onClick={() => setSelectedSector(sector)}
                className={`grid grid-cols-5 gap-4 px-4 py-3 items-center hover:bg-slate-50/50 cursor-pointer transition-colors ${
                  index === data.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                {/* Sector Name */}
                <span className="text-sm font-medium text-gray-900">
                  {sector.sector}
                </span>

                {/* Student Interest */}
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">{sector.studentInterest}%</span>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${sector.studentInterest}%` }}
                    />
                  </div>
                </div>

                {/* National Need */}
                <div className="text-center">
                  <span className="text-sm font-medium text-gray-900">{sector.nationalNeed}%</span>
                  <div className="w-full h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full"
                      style={{ width: `${sector.nationalNeed}%` }}
                    />
                  </div>
                </div>

                {/* Gap */}
                <div className="text-center">
                  <span className={`text-sm font-bold ${
                    sector.gap > 5 ? 'text-blue-600' :
                    sector.gap < -5 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {sector.gap > 0 ? '+' : ''}{sector.gap}%
                  </span>
                </div>

                {/* Status */}
                <div className="text-center">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium ${config.bg} ${config.color} ${config.border} border`}>
                    <StatusIcon className="w-3 h-3" />
                    {sector.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Sector Detail */}
        {selectedSector && (
          <div className="mt-6 p-4 bg-slate-100/50 rounded-lg border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedSector.sector} Analysis</h4>
                <p className="text-xs text-gray-600 mt-0.5">
                  {selectedSector.gap > 0
                    ? `${selectedSector.gap}% surplus - Consider regional talent export`
                    : selectedSector.gap < 0
                    ? `${Math.abs(selectedSector.gap)}% deficit - Scholarship redirection recommended`
                    : 'Well aligned with national targets'
                  }
                </p>
              </div>
              <button
                onClick={() => setSelectedSector(null)}
                className="text-xs text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>

            {/* Strategic Action */}
            <div className="p-3 bg-white rounded border border-slate-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-purple-600">
                  Strategic Action
                </p>
              </div>
              <p className="text-sm text-gray-700">{getStrategicAction(selectedSector)}</p>

              {selectedSector.status === "deficit" && Math.abs(selectedSector.gap) >= 10 && (
                <button className="mt-3 flex items-center gap-2 text-xs font-medium text-purple-700 hover:text-purple-800 transition-colors">
                  <span>Create Scholarship Initiative</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-slate-200/30">
          <div className="flex items-center justify-center gap-6 text-[10px]">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-blue-500" />
              <span className="text-gray-600">Surplus (excess talent)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-green-500" />
              <span className="text-gray-600">Aligned (on track)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded bg-red-500" />
              <span className="text-gray-600">Deficit (shortage)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
