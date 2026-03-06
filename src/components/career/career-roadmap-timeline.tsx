/**
 * CAREER ROADMAP TIMELINE COMPONENT
 *
 * Interactive horizontal timeline showing career journey
 * From Class 6 → Class 12 → College → Career
 *
 * Displays milestones with color-coded status
 */

"use client";

import React from "react";
import { Clock, CheckCircle2, Circle, AlertCircle, ChevronRight } from "lucide-react";

// ============================================================================
// TYPES
// ============================================================================

export interface TimelineMilestone {
  id: string;
  title: string;
  description: string;
  category: "assessment" | "academic" | "skill" | "application" | "milestone";
  status: "pending" | "in-progress" | "completed" | "skipped";
  priority?: "high" | "medium" | "low";
  dueDate?: string;
  relatedCareer?: string;
  resources?: string[];
  onClick?: () => void;
}

export interface TimelinePhase {
  id: string;
  name: string;
  grade: string;
  period: string;
  description: string;
  milestones: TimelineMilestone[];
  recommendations: Recommendation[];
  focusSkills: string[];
}

export interface Recommendation {
  type: "action" | "explore" | "prepare" | "complete";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
}

export interface RoadmapTimelineProps {
  careerId: string;
  careerTitle: string;
  phases: TimelinePhase[];
  totalDuration: string;
  currentGrade?: number;
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
  onPhaseClick?: (phase: TimelinePhase) => void;
  compact?: boolean;
}

// ============================================================================
// STATUS COLORS
// ============================================================================

const STATUS_CONFIG = {
  completed: {
    color: "bg-green-100 text-green-800 border-green-300",
    icon: CheckCircle2,
    label: "Completed",
  },
  "in-progress": {
    color: "bg-amber-100 text-amber-800 border-amber-300",
    icon: Circle,
    label: "In Progress",
  },
  pending: {
    color: "bg-gray-100 text-gray-700 border-gray-300",
    icon: Circle,
    label: "Pending",
  },
  skipped: {
    color: "bg-slate-100 text-slate-600 border-slate-300",
    icon: AlertCircle,
    label: "Skipped",
  },
} as const;

const CATEGORY_COLORS = {
  assessment: "bg-purple-50 border-purple-300",
  academic: "bg-blue-50 border-blue-300",
  skill: "bg-green-50 border-green-300",
  application: "bg-orange-50 border-orange-300",
  milestone: "bg-red-50 border-red-300",
};

// ============================================================================
// COMPONENTS
// ============================================================================

export function RoadmapTimeline({
  careerId,
  careerTitle,
  phases,
  totalDuration,
  currentGrade = 10,
  onMilestoneClick,
  onPhaseClick,
  compact = false,
}: RoadmapTimelineProps) {
  // Find current phase
  const currentPhaseIndex = phases.findIndex((p) => {
    const phaseGrade = parseInt(p.grade);
    return phaseGrade === currentGrade || p.grade.includes(currentGrade.toString());
  });

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{careerTitle}</h2>
        <p className="text-gray-600">Timeline: {totalDuration}</p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Horizontal line */}
        <div className="absolute top-8 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 rounded-full"></div>

        {/* Phases */}
        <div className="flex justify-between relative">
          {phases.map((phase, index) => {
            const isCurrent = index === currentPhaseIndex;
            const isPast = index < currentPhaseIndex;
            const isFuture = index > currentPhaseIndex;

            return (
              <TimelinePhaseNode
                key={phase.id}
                phase={phase}
                isCurrent={isCurrent}
                isPast={isPast}
                isFuture={isFuture}
                index={index}
                onClick={() => onPhaseClick?.(phase)}
                compact={compact}
              />
            );
          })}
        </div>
      </div>

      {/* Phase Details - shown below timeline */}
      {!compact && (
        <div className="mt-12">
          <h3 className="text-xl font-semibold mb-4">Milestones & Actions</h3>
          <PhaseDetails phases={phases} currentGrade={currentGrade} onMilestoneClick={onMilestoneClick} />
        </div>
      )}
    </div>
  );
}

interface TimelinePhaseNodeProps {
  phase: TimelinePhase;
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  index: number;
  onClick?: () => void;
  compact?: boolean;
}

function TimelinePhaseNode({
  phase,
  isCurrent,
  isPast,
  isFuture,
  index,
  onClick,
  compact,
}: TimelinePhaseNodeProps) {
  const totalMilestones = phase.milestones.length;
  const completedMilestones = phase.milestones.filter((m) => m.status === "completed").length;
  const progress = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  return (
    <div
      className={`flex flex-col items-center cursor-pointer transition-all ${isCurrent ? "scale-110" : "hover:scale-105"}`}
      onClick={onClick}
    >
      {/* Phase Node */}
      <div
        className={`
          relative z-10 w-16 h-16 rounded-full flex items-center justify-center border-4
          ${isCurrent
            ? "bg-blue-500 border-blue-600 text-white"
            : isPast
              ? "bg-green-500 border-green-600 text-white"
              : "bg-gray-300 border-gray-400 text-gray-600"
          }
          font-bold text-sm
        `}
      >
        {index + 1}
      </div>

      {/* Phase Label */}
      <div className={`mt-2 text-center max-w-32 ${isCurrent ? "font-bold" : "text-gray-600"}`}>
        <div className="text-sm">{phase.period}</div>
        {!compact && <div className="text-xs text-gray-500">{progress.toFixed(0)}% done</div>}
      </div>

      {/* Progress Ring for current phase */}
      {isCurrent && !compact && (
        <svg className="absolute -top-8 -left-8 w-32 h-32 -rotate-90">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-blue-200"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${314 * (progress / 100)} 314`}
            className="text-blue-500"
          />
        </svg>
      )}
    </div>
  );
}

interface PhaseDetailsProps {
  phases: TimelinePhase[];
  currentGrade: number;
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
}

function PhaseDetails({ phases, currentGrade, onMilestoneClick }: PhaseDetailsProps) {
  // Show details for current phase and adjacent phases
  const currentPhaseIndex = phases.findIndex((p) => {
    const phaseGrade = parseInt(p.grade);
    return phaseGrade === currentGrade || p.grade.includes(currentGrade.toString());
  });

  const visiblePhases = phases.filter((_, i) =>
    i >= currentPhaseIndex - 1 && i <= currentPhaseIndex + 1
  );

  return (
    <div className="space-y-6">
      {visiblePhases.map((phase, i) => {
        const phaseIndex = phases.indexOf(phase);
        const isCurrent = phaseIndex === currentPhaseIndex;

        return (
          <div
            key={phase.id}
            className={`border rounded-lg p-4 ${isCurrent ? "border-blue-500 bg-blue-50" : "border-gray-200"}`}
          >
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">{phase.period}: {phase.name}</h4>
              <span className="text-sm text-gray-500">{phase.description}</span>
            </div>

            {/* Focus Skills */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Focus Skills:</h5>
              <div className="flex flex-wrap gap-2">
                {phase.focusSkills.map((skill) => (
                  <span key={skill} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="mb-4">
              <h5 className="text-sm font-medium text-gray-700 mb-2">Milestones:</h5>
              <div className="grid gap-2">
                {phase.milestones.map((milestone) => (
                  <MilestoneCard
                    key={milestone.id}
                    milestone={milestone}
                    onClick={() => onMilestoneClick?.(milestone)}
                  />
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {phase.recommendations.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</h5>
                <div className="space-y-2">
                  {phase.recommendations.map((rec, idx) => (
                    <RecommendationCard key={idx} recommendation={rec} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface MilestoneCardProps {
  milestone: TimelineMilestone;
  onClick?: () => void;
}

function MilestoneCard({ milestone, onClick }: MilestoneCardProps) {
  const statusConfig = STATUS_CONFIG[milestone.status];

  return (
    <div
      className={`border rounded-lg p-3 cursor-pointer transition-all hover:shadow-md ${statusConfig.color}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <statusConfig.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h6 className="font-medium text-sm">{milestone.title}</h6>
            {milestone.priority === "high" && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-xs">
                Priority
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
          {milestone.dueDate && (
            <p className="text-xs text-gray-500 mt-1">Due: {milestone.dueDate}</p>
          )}
          {milestone.resources && milestone.resources.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Resources:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {milestone.resources.map((r) => (
                  <span key={r} className="text-xs bg-white px-2 py-0.5 border rounded">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface RecommendationCardProps {
  recommendation: Recommendation;
}

function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const typeIcons = {
    action: "🎯",
    explore: "🔍",
    prepare: "📚",
    complete: "✅",
  };

  const priorityColors = {
    high: "border-red-300 bg-red-50",
    medium: "border-yellow-300 bg-yellow-50",
    low: "border-gray-300 bg-gray-50",
  };

  return (
    <div className={`border rounded p-3 ${priorityColors[recommendation.priority]}`}>
      <div className="flex items-start gap-2">
        <span className="text-lg">{typeIcons[recommendation.type]}</span>
        <div className="flex-1">
          <h6 className="font-medium text-sm">{recommendation.title}</h6>
          <p className="text-xs text-gray-600 mt-1">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VERTICAL TIMELINE VARIANT
// ============================================================================

export interface VerticalTimelineProps {
  phases: TimelinePhase[];
  currentGrade?: number;
  onMilestoneClick?: (milestone: TimelineMilestone) => void;
}

export function VerticalTimeline({ phases, currentGrade = 10, onMilestoneClick }: VerticalTimelineProps) {
  return (
    <div className="max-w-2xl mx-auto">
      {phases.map((phase, phaseIndex) => {
        const phaseGrade = parseInt(phase.grade);
        const isCurrent = phaseGrade === currentGrade || phase.grade.includes(currentGrade.toString());
        const isPast = phaseGrade < currentGrade;

        return (
          <div key={phase.id} className="relative pb-12 last:pb-0">
            {/* Timeline Line */}
            {phaseIndex < phases.length - 1 && (
              <div className={`absolute left-6 top-12 w-0.5 h-full ${isPast ? "bg-green-300" : "bg-gray-300"}`}></div>
            )}

            {/* Phase Header */}
            <div className="flex items-start gap-4">
              {/* Timeline Dot */}
              <div
                className={`
                  w-12 h-12 rounded-full flex items-center justify-center border-2 z-10 flex-shrink-0
                  ${isCurrent
                    ? "bg-blue-500 border-blue-600 text-white"
                    : isPast
                      ? "bg-green-500 border-green-600 text-white"
                      : "bg-gray-300 border-gray-400"
                  }
                `}
              >
                {isPast ? "✓" : phaseIndex + 1}
              </div>

              {/* Phase Content */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-semibold">{phase.period}</h3>
                  <span className="text-gray-600">•</span>
                  <span className="text-gray-600">{phase.name}</span>
                  {isCurrent && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-4">{phase.description}</p>

                {/* Milestones */}
                <div className="space-y-2 ml-4">
                  {phase.milestones.map((milestone) => (
                    <MilestoneCard
                      key={milestone.id}
                      milestone={milestone}
                      onClick={() => onMilestoneClick?.(milestone)}
                    />
                  ))}
                </div>

                {/* Recommendations */}
                {phase.recommendations.length > 0 && (
                  <div className="mt-4 ml-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Recommended Actions:</h4>
                    <div className="space-y-2">
                      {phase.recommendations.map((rec, idx) => (
                        <RecommendationCard key={idx} recommendation={rec} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// COMPACT TIMELINE
// ============================================================================

export interface CompactTimelineProps {
  phases: TimelinePhase[];
  currentGrade: number;
}

export function CompactTimeline({ phases, currentGrade }: CompactTimelineProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-4">
      {phases.map((phase, index) => {
        const phaseGrade = parseInt(phase.grade);
        const isCurrent = phaseGrade === currentGrade || phase.grade.includes(currentGrade.toString());
        const isPast = phaseGrade < currentGrade;

        return (
          <React.Fragment key={phase.id}>
            {/* Phase indicator */}
            <div
              className={`
                flex-shrink-0 w-3 h-3 rounded-full
                ${isCurrent ? "bg-blue-500 ring-4 ring-blue-200" : isPast ? "bg-green-500" : "bg-gray-300"}
              `}
              title={phase.period}
            ></div>

            {/* Connector line */}
            {index < phases.length - 1 && (
              <div className={`w-8 h-0.5 ${isPast ? "bg-green-400" : "bg-gray-300"}`}></div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// PROGRESS SUMMARY
// ============================================================================

export interface TimelineProgressProps {
  phases: TimelinePhase[];
  currentGrade: number;
}

export function TimelineProgress({ phases, currentGrade }: TimelineProgressProps) {
  const totalMilestones = phases.reduce((sum, p) => sum + p.milestones.length, 0);
  const completedMilestones = phases.reduce((sum, p) => {
    const phaseGrade = parseInt(p.grade);
    const isPast = phaseGrade < currentGrade;
    return (
      sum +
        p.milestones.filter((m) => m.status === "completed" || (isPast && m.status === "pending")).length
    );
  }, 0);

  const progress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;
  const currentPhase = phases.find((p) => {
    const phaseGrade = parseInt(p.grade);
    return phaseGrade === currentGrade || p.grade.includes(currentGrade.toString());
  });

  return (
    <div className="bg-white border rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold">Career Roadmap Progress</h3>
        <span className="text-2xl font-bold text-blue-600">{progress}%</span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
        <div
          className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        ></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-bold text-gray-900">{completedMilestones}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{totalMilestones - completedMilestones}</div>
          <div className="text-xs text-gray-500">Remaining</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{currentPhase?.period || "-"}</div>
          <div className="text-xs text-gray-500">Current Phase</div>
        </div>
      </div>
    </div>
  );
}
